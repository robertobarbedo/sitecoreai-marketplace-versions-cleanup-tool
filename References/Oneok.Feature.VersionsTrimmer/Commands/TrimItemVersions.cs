using System;
using System.Collections.Generic;
using System.Linq;

using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Publishing.PublishingInformation;
using Sitecore.Security.Accounts;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Workflows;

namespace Oneok.Feature.VersionsTrimmer.Commands
{
    public class TrimItemVersionsCommand : Command
    {
        protected Database Database => Sitecore.Context.ContentDatabase;

        public override void Execute(CommandContext context)
        {
            if (context?.Items?[0] != null)
                Sitecore.Shell.Applications.Dialogs.ProgressBoxes.ProgressBox.Execute(
                    "Versions Trimmer",
                    "Recycling Versions",
                    new Sitecore.Shell.Applications.Dialogs.ProgressBoxes.ProgressBoxMethod(StartTrim),
                    new object[] { context.Items[0].ID });

        }

        public virtual void StartTrim(params object[] parameters)
        {
            Log.Warn($"Executed to recycle versions from item - TrimItemVersionsCommand - User:'{Sitecore.Context.User.Name}' at '{DateTime.Now.ToString()}' ID '{parameters[0]}'.", this);

            TrimItem((ID)parameters[0]);
        }

        protected void TrimItem(ID itemId)
        {
            if (Database.Name != "master")
            {
                Log.Warn($"Executing item trimmer from delivery server. Context database '{Database.Name}'. Operation not allowed.", this);
                return;
            }

            //get item in ALL languages
            Item tempItem = Database.GetItem(itemId);
            foreach (var itemLanguage in tempItem.Languages)
            {
                var item = tempItem.Database.GetItem(tempItem.ID, itemLanguage);
                if (item.Versions.Count > 0)
                {
                    //process trimming - delete older versions
                    RecycleUnusedVersions(item);
                }
            }
        }

        private bool CanBePublished(Item item)
        {
            if (item != null)
            {
                IWorkflow itemWorkflow = item.Database.WorkflowProvider.GetWorkflow(item.ID.ToString());
                if (itemWorkflow != null)
                {
                    var state = itemWorkflow.GetState(item);
                    return (state == null || state.FinalState)
                        && item.Publishing.IsPublishable(DateTime.Now, false)
                        && PublishingInformationBuilder.GetPublishingInformation(item, PublishingInformationLevel.Item).Count() == 0
                        && PublishingInformationBuilder.GetPublishingInformation(item, PublishingInformationLevel.Version).Count() == 0;
                }
            }
            return false;
        }

        private Item GetPreviousVersion(Item item)
        {
            if (item == null)
                return null;

            for (int version = item.Version.Number - 1; version > 0; version--)
            {
                var result = item.Versions.GetVersions().Where(c => c.Version.Number == version).FirstOrDefault();
                if (result != null)
                    return result;
            }
            return null;
        }

        private void RecycleUnusedVersions(Item item)
        {
            var toNOTRecycle = new List<int>();

            //not recycle the latest approved and any posterior version
            //toNOTRecycle.Add(item.Versions.GetLatestVersion().Version.Number);
            var aux = item.Database.GetItem(item.ID, item.Language, item.Versions.GetLatestVersion().Version);
            do
            {
                if (aux?.Version != null)
                {
                    toNOTRecycle.Add(aux.Version.Number);
                    if (CanBePublished(aux))
                        break;
                }

                var previousVersion = GetPreviousVersion(aux);
                if (previousVersion?.Version != null)
                    aux = item.Database.GetItem(item.ID, item.Language, previousVersion.Version);
                else
                    break;

            } while (aux != null);

            //not recycle based on the date criteria
            var alwaysKeepDate = DateTime.Now.AddDays(-1 * int.Parse(Sitecore.Configuration.Settings.GetSetting("VersionsTrimmer.NumberOfDays", "60")));
            foreach (var itemVersion in item.Versions.GetVersions())
            {
                var updated = (DateField)(itemVersion.Fields[Sitecore.FieldIDs.Updated]);
                if (updated.DateTime.CompareTo(alwaysKeepDate) >= 0)
                    toNOTRecycle.Add(itemVersion.Version.Number);
            }

            //recycle but always keep N versions 
            var alwaysKeepQtdy = int.Parse(Sitecore.Configuration.Settings.GetSetting("VersionsTrimmer.MinimumNumber", "5"));
            var versionsToRecycle = new List<Item>();
            var count = 0;
            foreach (var itemVersion in item.Versions.GetVersions().OrderByDescending(c => c.Version.Number))
            {
                count++;
                if (count > alwaysKeepQtdy)
                {
                    //exclude if is marked NOT to recycle (*include if not to not recycle)
                    if (!(toNOTRecycle.Any(c => c == itemVersion.Version.Number)))
                    {
                        versionsToRecycle.Add(itemVersion);
                    }
                }
            }

            //perform recycling
            Recycle(versionsToRecycle);
        }

        private void Recycle(List<Item> versionsToRecycle)
        {
            foreach (var toBeRecycledVersion in versionsToRecycle)
            {
                var guid = toBeRecycledVersion.RecycleVersion();

                if (Sitecore.Context.Job != null)
                {
                    Sitecore.Context.Job.Status.Processed = Sitecore.Context.Job.Status.Processed + 1;
                    Sitecore.Context.Job.Status.Messages.Add("Recycled version " + toBeRecycledVersion.Version.Number + " from " + toBeRecycledVersion.Name);
                }
                Log.Info("TrimItemVersionsCommand - Recycled item unique id'" + toBeRecycledVersion.GetUniqueId() + "'. Returned guid '" + guid.ToString() + "'", this);
            }
        }

        private IEnumerable<Database> GetTargetDatabases()
        {
            foreach (var publishingTarget in Sitecore.Publishing.PublishManager.GetPublishingTargets(Database))
            {
                // Find the target database name, move to the next publishing target if it is empty.
                var targetDatabaseName = publishingTarget["Target database"];
                if (string.IsNullOrEmpty(targetDatabaseName))
                    continue;

                // Get the target database, if missing skip
                var targetDatabase = Sitecore.Configuration.Factory.GetDatabase(targetDatabaseName);
                if (targetDatabase == null)
                    continue;

                yield return targetDatabase;
            }
        }

        public override CommandState QueryState(CommandContext context)
        {
            return Sitecore.Context.User.IsAdministrator || Sitecore.Context.User.IsInRole(Role.FromName(@"oneok\Trim Versions")) ? CommandState.Enabled : CommandState.Disabled;
        }
    }

    public class TrimTreeVersionsCommand : TrimItemVersionsCommand
    {
        public override void StartTrim(params object[] parameters)
        {
            StartTrimFromItem(Database.GetItem((ID)parameters[0]));
        }

        public void StartTrimFromItem(Item item)
        {
            Log.Warn($"Executed to recycle versions from item and all descendants - TrimItemVersionsCommand - User:'{Sitecore.Context.User.Name}' at '{DateTime.Now.ToString()}' ID '{item.ID.ToString()}'.", this);

            TrimRecursevely(item);
        }

        private void TrimRecursevely(Item item)
        {
            if (item == null)
                return;

            //recycle versions for the item
            TrimItem(item.ID);
            foreach (Item child in item.GetChildren())
            {
                TrimRecursevely(child);
            }
        }
    }
}
