import type { VersionInfo, TrimSettings } from "@/src/types/version";

export interface TrimResult {
  toKeep: number[];
  toRemove: number[];
}

/**
 * Determines which versions should be removed based on the 3-rule retention algorithm.
 *
 * Rule 1 - Minimum Count: Always keep the N newest versions.
 * Rule 2 - Age Protection: Never trim versions updated within the last N days.
 * Rule 3 - Publish Chain: Walk backward from the latest version, protecting every version
 *          until a final-state workflow version is found.
 */
export function calculateVersionsToTrim(
  versions: VersionInfo[],
  settings: TrimSettings,
): TrimResult {
  if (versions.length === 0) {
    return { toKeep: [], toRemove: [] };
  }

  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const protectedVersions = new Set<number>();

  // Rule 0: Never trim the live version or anything newer than it
  const liveVersion = versions.find((v) => v.isLive);
  if (liveVersion) {
    for (const ver of sorted) {
      protectedVersions.add(ver.version);
      if (ver.version === liveVersion.version) break;
    }
  }

  // Rule 3: Protect the publish chain (from latest backward until a final state is found)
  for (const ver of sorted) {
    protectedVersions.add(ver.version);
    if (ver.isFinalState) {
      break;
    }
  }

  // Rule 2: Protect versions updated within the last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.numberOfDays);

  for (const ver of sorted) {
    if (ver.updatedDate) {
      const updatedDate = parseSitecoreDate(ver.updatedDate);
      if (updatedDate && updatedDate >= cutoffDate) {
        protectedVersions.add(ver.version);
      }
    }
  }

  // Rule 1: Always keep the N newest versions
  const toKeep: number[] = [];
  const toRemove: number[] = [];

  let count = 0;
  for (const ver of sorted) {
    count++;
    if (count <= settings.minimumNumber) {
      toKeep.push(ver.version);
    } else if (protectedVersions.has(ver.version)) {
      toKeep.push(ver.version);
    } else {
      toRemove.push(ver.version);
    }
  }

  return { toKeep, toRemove };
}

function parseSitecoreDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Sitecore stores dates as "yyyyMMddTHHmmssZ" or ISO format
  if (dateStr.length === 16 && dateStr[8] === "T" && dateStr[15] === "Z") {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const min = parseInt(dateStr.substring(11, 13));
    const sec = parseInt(dateStr.substring(13, 15));
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseSitecoreDate(dateStr);
  if (!date) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function formatAbsoluteDate(dateStr: string): string {
  const date = parseSitecoreDate(dateStr);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
