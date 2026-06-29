using System;
using Oneok.Feature.VersionsTrimmer.Commands;
using Sitecore.Diagnostics;

namespace Oneok.Feature.VersionsTrimmer.Tasks
{
    public class VersionsTrimmerTask
    {
        public string ScheduledHours { get; set; }

        public string Scope { get; set; }

        public string Database { get; set; }

        public void Run()
        {
            try
            {
                if (ShouldRun())
                {
                    Log.Info("Oneok.Feature.VersionsTrimmer.Tasks.VersionsTrimmerTask Started.", this);

                    ExecuteJob();
                }
            }
            catch (Exception ex)
            {
                Log.Error($"Oneok.Feature.VersionsTrimmer.Tasks.VersionsTrimmerTask error occured: {ex.Message}", ex, this);
            }
        }

        private bool ShouldRun()
        {
            if (ScheduledHours == "")
                ScheduledHours = "1"; //default 1AM UTC

            var pimHours = ScheduledHours.Split('|');
            foreach (string hour in pimHours)
            {
                if (DateTime.UtcNow.Hour == int.Parse(hour))
                    return true;
            }
            return false;
        }

        private void ExecuteJob()
        {
            var database = Sitecore.Configuration.Factory.GetDatabase(Database);

            foreach (var path in Scope.Split('|'))
            {
                var command = new TrimTreeVersionsCommand();
                var startItem = database.GetItem(path);
                if (startItem != null)
                    command.StartTrimFromItem(startItem);
            }
        }
    }
}
