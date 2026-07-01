"use client";

import { useState } from "react";
import type { VersionInfo, TrimSettings } from "@/src/types/version";
import { calculateVersionsToTrim, formatRelativeDate, formatAbsoluteDate } from "@/src/utils/trim-versions";
import { Icon } from "@/lib/icon";
import { mdiDeleteOutline, mdiRefresh } from "@mdi/js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface VersionsListProps {
  versions: VersionInfo[];
  settings: TrimSettings;
  isLoading: boolean;
  showCleanupPreview: boolean;
  currentVersion?: number;
  onDeleteVersion: (versionNumber: number) => Promise<void>;
  onOpenVersion: (versionNumber: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function VersionsList({ versions, settings, isLoading, showCleanupPreview, currentVersion, onDeleteVersion, onOpenVersion, onRefresh }: VersionsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const trimResult = calculateVersionsToTrim(versions, settings);
  const trimmableSet = new Set(trimResult.toRemove);

  const sorted = [...versions].sort((a, b) => b.version - a.version);

  const handleDeleteClick = (versionNumber: number) => {
    setDeleteError(null);
    setDeleteConfirm(versionNumber);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteVersion(deleteConfirm);
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete version.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2 rounded-md border-l-4 animate-pulse ${i === 0 ? "border-l-transparent" : "border-l-gray-200 bg-white"}`}
          >
            {i === 0 ? null : (
              <>
                {/* Version badge */}
                <div className="h-3.5 w-7 rounded bg-gray-200 min-w-[28px]" />
                {/* Workflow pill */}
                <div className="h-4 w-14 rounded-full bg-gray-200" />
                {/* Date */}
                <div className="h-3 flex-1 rounded bg-gray-100" style={{ maxWidth: `${48 + (i % 3) * 16}px` }} />
                {/* Username */}
                <div className="h-3 w-16 rounded bg-gray-100" />
                {/* Delete icon placeholder */}
                <div className="h-4 w-4 rounded bg-gray-100" />
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No versions found for this item.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? "s" : ""} total
          {showCleanupPreview && (
            <>
              {" "}&mdash;{" "}
              <span className="text-success-fg font-medium">{trimResult.toKeep.length} kept</span>
              {trimResult.toRemove.length > 0 && (
                <>
                  ,{" "}
                  <span className="text-danger-fg font-medium">{trimResult.toRemove.length} to clean</span>
                </>
              )}
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="p-1 rounded hover:bg-neutral-bg transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh versions"
        >
          <Icon
            path={mdiRefresh}
            size={0.7}
            className={`text-muted-foreground hover:text-primary transition-colors ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Version cards */}
      <div className="flex flex-col gap-1.5">
        {sorted.map((ver) => {
          const isTrimmable = showCleanupPreview && trimmableSet.has(ver.version);
          const isCurrentVersion = ver.version === currentVersion;
          return (
            <div
              key={ver.version}
              role="button"
              tabIndex={0}
              onClick={() => void onOpenVersion(ver.version)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") void onOpenVersion(ver.version); }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md border-l-4 transition-all
                cursor-pointer hover:brightness-95
                ${isTrimmable
                  ? "border-l-danger/60 bg-danger-bg/30 opacity-60"
                  : ver.isLive
                    ? "border-l-purple-500/60 bg-white"
                    : ver.isFinalState
                      ? "border-l-success/60 bg-white"
                      : "border-l-muted-foreground/40 bg-white"
                }
                ${isCurrentVersion
                  ? isTrimmable
                    ? "outline outline-1 outline-danger/60"
                    : ver.isLive
                      ? "outline outline-1 outline-purple-500/60"
                      : ver.isFinalState
                        ? "outline outline-1 outline-success/60"
                        : "outline outline-1 outline-muted-foreground/40"
                  : ""
                }
              `}
            >
              {/* Version badge */}
              <span
                className="text-xs font-bold min-w-[28px]"
                title={ver.versionName || undefined}
              >
                v{ver.version}
              </span>

              {/* Workflow state pill */}
              <WorkflowPill stateName={ver.workflowStateName} isFinal={ver.isFinalState} isLive={ver.isLive} />

              {/* Updated date + optional version name */}
              <span
                className="text-xs text-muted-foreground flex-1"
                title={formatAbsoluteDate(ver.updatedDate)}
              >
                {formatRelativeDate(ver.updatedDate)}
                {ver.versionName && (
                  <span className="ml-1.5">· {ver.versionName}</span>
                )}
              </span>

              {/* Updated by */}
              <span className="text-xs text-muted-foreground max-w-[80px] truncate" title={ver.updatedBy}>
                {ver.updatedBy}
              </span>

              {/* Trim label */}
              {isTrimmable && (
                <span className="text-[10px] text-danger-fg whitespace-nowrap">will be removed</span>
              )}

              {/* Individual delete button — hidden for the live version */}
              {!ver.isLive && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(ver.version); }}
                  className="opacity-30 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-danger-bg"
                  title={`Delete version ${ver.version}`}
                >
                  <Icon path={mdiDeleteOutline} size={0.6} className="text-danger-fg" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => { setDeleteConfirm(null); setDeleteError(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete version {deleteConfirm}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-danger-fg px-1">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="danger"
              onClick={() => void handleDeleteConfirm()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkflowPill({ stateName, isFinal, isLive }: { stateName: string; isFinal: boolean; isLive: boolean }) {
  if (isLive) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap bg-purple-100 text-purple-700">
        Live
      </span>
    );
  }

  let colorClass = "bg-neutral-bg text-neutral-fg";
  if (isFinal) {
    colorClass = "bg-success-bg text-success-fg";
  } else if (stateName !== "No workflow" && stateName !== "Unknown") {
    colorClass = "bg-warning-background text-warning-foreground";
  }

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${colorClass}`}>
      {stateName}
    </span>
  );
}
