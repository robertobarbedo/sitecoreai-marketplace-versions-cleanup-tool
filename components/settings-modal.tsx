"use client";

import { useState, useEffect } from "react";
import type { ClientSDK, ApplicationContext } from "@sitecore-marketplace-sdk/client";
import type { TrimSettings } from "@/src/types/version";
import { DEFAULT_TRIM_SETTINGS } from "@/src/types/version";
import { loadTrimSettings, saveTrimSettings } from "@/src/utils/sitecore-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: TrimSettings) => void;
  client: ClientSDK;
  appContext: ApplicationContext;
  language: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
  client,
  appContext,
  language,
}: SettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [minimumNumber, setMinimumNumber] = useState(DEFAULT_TRIM_SETTINGS.minimumNumber);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_TRIM_SETTINGS.numberOfDays);
  const [validationErrors, setValidationErrors] = useState<{ minimumNumber?: string; numberOfDays?: string }>({});

  const validate = (field: "minimumNumber" | "numberOfDays", value: number) => {
    if (field === "minimumNumber") {
      if (!Number.isInteger(value) || value < 1 || value > 1000)
        return "Must be a whole number between 1 and 1,000.";
    }
    if (field === "numberOfDays") {
      if (!Number.isInteger(value) || value < 0 || value > 3650)
        return "Must be a whole number between 0 and 3,650.";
    }
    return undefined;
  };

  const handleMinimumNumberChange = (raw: string) => {
    const value = parseInt(raw);
    const parsed = isNaN(value) ? 0 : value;
    setMinimumNumber(parsed);
    setValidationErrors((prev) => ({ ...prev, minimumNumber: validate("minimumNumber", parsed) }));
  };

  const handleNumberOfDaysChange = (raw: string) => {
    const value = parseInt(raw);
    const parsed = isNaN(value) ? 0 : value;
    setNumberOfDays(parsed);
    setValidationErrors((prev) => ({ ...prev, numberOfDays: validate("numberOfDays", parsed) }));
  };

  const hasValidationErrors = !!(validationErrors.minimumNumber || validationErrors.numberOfDays);

  const getContextId = () => {
    const resourceAccess = appContext.resourceAccess as
      | Array<{ context?: { preview?: string } }>
      | undefined;
    return resourceAccess?.[0]?.context?.preview ?? "";
  };

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
          const contextId = getContextId();
          if (!contextId) throw new Error("No context ID available");

          const settings = await loadTrimSettings(client, contextId, language);
          setMinimumNumber(settings.minimumNumber);
          setNumberOfDays(settings.numberOfDays);
        } catch (err) {
          console.error("Error loading settings:", err);
          setError(err instanceof Error ? err.message : "Failed to load settings");
        } finally {
          setIsLoading(false);
        }
      };

      void load();
    }
  }, [isOpen, client, appContext, language]);

  const handleSave = async () => {
    const minErr = validate("minimumNumber", minimumNumber);
    const daysErr = validate("numberOfDays", numberOfDays);
    if (minErr || daysErr) {
      setValidationErrors({ minimumNumber: minErr, numberOfDays: daysErr });
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const contextId = getContextId();
      if (!contextId) throw new Error("No context ID available");

      const settings: TrimSettings = {
        minimumNumber,
        numberOfDays,
      };

      await saveTrimSettings(client, contextId, settings, language);
      setSuccessMessage("Settings saved successfully!");
      onSettingsSaved(settings);

      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Retention Settings</DialogTitle>
          <DialogDescription>
            Configure version retention rules. Changes apply to the trim preview immediately.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading settings...</div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="minimumNumber" className="text-sm font-medium">
                Minimum versions to keep
              </label>
              <p className="text-xs text-muted-foreground">
                Always keep at least this many newest versions, regardless of age.
              </p>
              <Input
                id="minimumNumber"
                type="number"
                min={1}
                max={1000}
                value={minimumNumber}
                onChange={(e) => handleMinimumNumberChange(e.target.value)}
                className={`text-sm h-9 ${validationErrors.minimumNumber ? "border-danger focus-visible:ring-danger" : ""}`}
              />
              {validationErrors.minimumNumber && (
                <p className="text-xs text-danger-fg">{validationErrors.minimumNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="numberOfDays" className="text-sm font-medium">
                Minimum days to keep
              </label>
              <p className="text-xs text-muted-foreground">
                Always keep versions updated within this many days, regardless of count.
              </p>
              <Input
                id="numberOfDays"
                type="number"
                min={0}
                max={3650}
                value={numberOfDays}
                onChange={(e) => handleNumberOfDaysChange(e.target.value)}
                className={`text-sm h-9 ${validationErrors.numberOfDays ? "border-danger focus-visible:ring-danger" : ""}`}
              />
              {validationErrors.numberOfDays && (
                <p className="text-xs text-danger-fg">{validationErrors.numberOfDays}</p>
              )}
            </div>

            {error && (
              <div className="p-2 bg-danger-bg border border-danger/20 rounded-md">
                <p className="text-xs text-danger-fg">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-2 bg-success-bg border border-success/20 rounded-md">
                <p className="text-xs text-success-fg">{successMessage}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6 pt-4 border-t border-border-color">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || isLoading || hasValidationErrors}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>

        <p className="text-[10px] text-muted-foreground text-center -mt-2">
          Developed by Roberto Barbedo
        </p>
      </DialogContent>
    </Dialog>
  );
}
