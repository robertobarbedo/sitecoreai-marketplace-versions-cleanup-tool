"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApplicationContext, PagesContext } from "@sitecore-marketplace-sdk/client";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { queryItemVersionsWithWorkflow, deleteItemVersion, queryLiveVersionNumber } from "@/src/utils/sitecore-graphql";
import { loadTrimSettings } from "@/src/utils/sitecore-settings";
import { VersionsList } from "@/components/versions-list";
import { TrimActions } from "@/components/trim-actions";
import { SettingsModal } from "@/components/settings-modal";
import { Icon } from "@/lib/icon";
import { mdiCog } from "@mdi/js";
import type { VersionInfo, TrimSettings } from "@/src/types/version";
import { DEFAULT_TRIM_SETTINGS } from "@/src/types/version";

function VersioningCenterPanel() {
  const { client, error, isInitialized } = useMarketplaceClient();
  const [pagesContext, setPagesContext] = useState<PagesContext>();
  const [appContext, setAppContext] = useState<ApplicationContext>();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [settings, setSettings] = useState<TrimSettings>(DEFAULT_TRIM_SETTINGS);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showCleanupPreview, setShowCleanupPreview] = useState(false);

  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res) => setAppContext(res.data))
        .catch((err) => console.error("Error retrieving application.context:", err));

      client
        .query("pages.context", {
          subscribe: true,
          onSuccess: (res) => setPagesContext(res),
        })
        .catch((err) => console.error("Error retrieving pages.context:", err));
    }
  }, [client, error, isInitialized]);

  const getContextId = useCallback(() => {
    if (!appContext) return "";
    const resourceAccess = appContext.resourceAccess as
      | Array<{ context?: { preview?: string; live?: string } }>
      | undefined;
    return resourceAccess?.[0]?.context?.preview ?? "";
  }, [appContext]);

  const getLiveContextId = useCallback(() => {
    if (!appContext) return "";
    const resourceAccess = appContext.resourceAccess as
      | Array<{ context?: { preview?: string; live?: string } }>
      | undefined;
    return resourceAccess?.[0]?.context?.live ?? "";
  }, [appContext]);

  const loadVersions = useCallback(async (): Promise<VersionInfo[]> => {
    if (!client || !pagesContext?.pageInfo?.id) return [];

    const contextId = getContextId();
    if (!contextId) return [];

    const language = pagesContext.pageInfo.language ?? "en";
    const itemId = pagesContext.pageInfo.id;
    const itemPath = pagesContext.pageInfo.path ?? "";

    setIsLoadingVersions(true);
    try {
      const result = await queryItemVersionsWithWorkflow(client, contextId, itemId, language);

      let liveVersion: number | null = null;
      const liveContextId = getLiveContextId();
      if (liveContextId && itemPath) {
        liveVersion = await queryLiveVersionNumber(client, liveContextId, itemPath, language);
      }

      const versionsWithLive = result.map((v) => ({
        ...v,
        isLive: v.version === liveVersion,
      }));

      setVersions(versionsWithLive);
      return versionsWithLive;
    } catch (err) {
      console.error("Error loading versions:", err);
      return [];
    } finally {
      setIsLoadingVersions(false);
    }
  }, [client, pagesContext, getContextId, getLiveContextId]);

  useEffect(() => {
    if (client && appContext && pagesContext?.pageInfo?.id) {
      void loadVersions();
    }
  }, [client, appContext, pagesContext, loadVersions]);

  useEffect(() => {
    if (client && appContext && pagesContext?.pageInfo?.language) {
      const contextId = getContextId();
      if (!contextId) return;

      void loadTrimSettings(client, contextId, pagesContext.pageInfo.language).then(setSettings);
    }
  }, [client, appContext, pagesContext, getContextId]);

  const handleDeleteVersion = async (versionNumber: number) => {
    if (!client || !pagesContext?.pageInfo?.id) return;

    const contextId = getContextId();
    const language = pagesContext.pageInfo.language ?? "en";
    const itemId = pagesContext.pageInfo.id;

    await deleteItemVersion(client, contextId, itemId, language, versionNumber);
    await loadVersions();
  };

  const handleTrimVersions = async (versionNumbers: number[]) => {
    if (!client || !pagesContext?.pageInfo?.id) return;

    const contextId = getContextId();
    const language = pagesContext.pageInfo.language ?? "en";
    const itemId = pagesContext.pageInfo.id;

    for (const versionNumber of versionNumbers) {
      await deleteItemVersion(client, contextId, itemId, language, versionNumber);
    }

    setShowCleanupPreview(false);
    const remaining = await loadVersions();

    const deletedSet = new Set(versionNumbers);
    const currentVersion = pagesContext.pageInfo.version;
    if (remaining.length > 0 && (currentVersion === undefined || deletedSet.has(currentVersion))) {
      const latest = Math.max(...remaining.map((v) => v.version));
      await handleOpenVersion(latest);
    }
  };

  const handleOpenVersion = useCallback(async (versionNumber: number) => {
    if (!client) return;
    await client.mutate("pages.context", { params: { itemVersion: versionNumber } });
  }, [client]);

  const handleSettingsSaved = (newSettings: TrimSettings) => {
    setSettings(newSettings);
  };

  const pageId = pagesContext?.pageInfo?.id;
  const pageLanguage = pagesContext?.pageInfo?.language;
  const pageVersion = pagesContext?.pageInfo?.version;

  if (error) {
    return (
      <div className="p-4 text-center text-danger-fg">
        Failed to initialize.
      </div>
    );
  }

  if (!isInitialized || !client || !appContext || !pageId || !pageLanguage) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Waiting for page context...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-end">
        <TrimActions
          versions={versions}
          settings={settings}
          showCleanupPreview={showCleanupPreview}
          onShowCleanupPreview={() => setShowCleanupPreview(true)}
          onCancelCleanup={() => setShowCleanupPreview(false)}
          onTrimVersions={handleTrimVersions}
        />
      </div>

      {/* Versions list */}
      <VersionsList
        versions={versions}
        settings={settings}
        isLoading={isLoadingVersions}
        showCleanupPreview={showCleanupPreview}
        currentVersion={pageVersion}
        onDeleteVersion={handleDeleteVersion}
        onOpenVersion={handleOpenVersion}
        onRefresh={async () => { await loadVersions(); }}
      />

      {/* Settings link */}
      <div className="flex items-center justify-end gap-2 py-2 border-t border-border-color">
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <Icon path={mdiCog} size={0.65} />
          <span>Settings</span>
        </button>
      </div>

      {/* Settings Modal */}
      {appContext && pageLanguage && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSettingsSaved={handleSettingsSaved}
          client={client}
          appContext={appContext}
          language={pageLanguage}
        />
      )}
    </div>
  );
}

export default VersioningCenterPanel;
