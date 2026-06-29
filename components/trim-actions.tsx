"use client";

import { useState } from "react";
import type { VersionInfo, TrimSettings } from "@/src/types/version";
import { calculateVersionsToTrim } from "@/src/utils/trim-versions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/icon";
import { mdiDeleteSweepOutline, mdiMagnifyScan } from "@mdi/js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TrimActionsProps {
  versions: VersionInfo[];
  settings: TrimSettings;
  showCleanupPreview: boolean;
  onShowCleanupPreview: () => void;
  onCancelCleanup: () => void;
  onTrimVersions: (versionNumbers: number[]) => Promise<void>;
}

export function TrimActions({
  versions,
  settings,
  showCleanupPreview,
  onShowCleanupPreview,
  onCancelCleanup,
  onTrimVersions,
}: TrimActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [showNothingToClean, setShowNothingToClean] = useState(false);

  const trimResult = calculateVersionsToTrim(versions, settings);
  const hasVersionsToTrim = trimResult.toRemove.length > 0;

  const handlePerformCleanup = () => {
    if (!hasVersionsToTrim) return;
    setIsConfirmOpen(true);
  };

  const handleReviewClick = () => {
    if (!hasVersionsToTrim) {
      setShowNothingToClean(true);
      setTimeout(() => setShowNothingToClean(false), 5000);
      return;
    }
    onShowCleanupPreview();
  };

  const handleConfirm = async () => {
    setIsTrimming(true);
    setProgress({ current: 0, total: trimResult.toRemove.length });

    try {
      await onTrimVersions(trimResult.toRemove);
    } finally {
      setIsTrimming(false);
      setProgress(null);
      setIsConfirmOpen(false);
    }
  };

  if (!showCleanupPreview) {
    return (
      <div className="relative h-8 flex items-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReviewClick}
          className={`gap-1.5 border border-border-color/50 transition-opacity duration-200 ${showNothingToClean ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <Icon path={mdiMagnifyScan} size={0.7} />
          <span>Review Cleanup Suggestions</span>
        </Button>
        <span
          className={`absolute inset-0 flex items-center text-sm text-muted-foreground italic transition-opacity duration-200 ${showNothingToClean ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          All versions are within the configured retention policy — nothing to clean up.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancelCleanup}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          colorScheme="danger"
          onClick={handlePerformCleanup}
          disabled={!hasVersionsToTrim}
          className="gap-1.5"
        >
          <Icon path={mdiDeleteSweepOutline} size={0.7} />
          <span>Perform Cleanup ({trimResult.toRemove.length})</span>
        </Button>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !isTrimming && setIsConfirmOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Cleanup</DialogTitle>
            <DialogDescription>
              You are about to permanently remove{" "}
              <strong>{trimResult.toRemove.length} version{trimResult.toRemove.length !== 1 ? "s" : ""}</strong>:{" "}
              {trimResult.toRemove
                .sort((a, b) => a - b)
                .map((v) => `v${v}`)
                .join(", ")}
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {progress && (
            <div className="flex flex-col gap-2">
              <div className="w-full bg-neutral-bg rounded-full h-2">
                <div
                  className="bg-danger h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground text-center">
                Removing version {progress.current} of {progress.total}...
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isTrimming}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="danger"
              onClick={() => void handleConfirm()}
              disabled={isTrimming}
            >
              {isTrimming ? "Removing..." : "Remove Versions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
