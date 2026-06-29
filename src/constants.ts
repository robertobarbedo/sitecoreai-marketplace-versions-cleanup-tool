export const SITECORE_DATABASES = {
  MASTER: "master",
  EXPERIENCE_EDGE: "experienceedge",
} as const;

export const DEFAULT_LANGUAGE = (process.env.NEXT_PUBLIC_PRIMARY_LANGUAGE ?? "en") as string;

export type Language = string;
