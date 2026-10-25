export interface VersionInfo {
  version: number;
  versionName: string;
  updatedDate: string;
  updatedBy: string;
  workflowState: string;
  workflowStateName: string;
  isFinalState: boolean;
  isLive: boolean;
}

export interface TrimSettings {
  minimumNumber: number;
  numberOfDays: number;
}

export const DEFAULT_TRIM_SETTINGS: TrimSettings = {
  minimumNumber: 3,
  numberOfDays: 30,
};
