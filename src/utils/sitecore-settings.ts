import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { queryItemByPath, createItem, updateItemFieldByPath } from "./sitecore-graphql";
import type { Language } from "@/src/constants";
import { DEFAULT_TRIM_SETTINGS, type TrimSettings } from "@/src/types/version";

const VERSIONING_CENTER_TEMPLATE_ID = "{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}";
const SETTINGS_ITEM_TEMPLATE_ID = "{D2923FEE-DA4E-49BE-830C-E27764DFA269}";
const MODULES_PARENT_ID = "{08477468-D438-43D4-9D6A-6D84A611971C}";

const VERSIONING_CENTER_PATH = "/sitecore/system/Modules/VersioningCenter";
const SETTINGS_PATH = "/sitecore/system/Modules/VersioningCenter/Settings";

export async function loadTrimSettings(
  client: ClientSDK,
  sitecoreContextId: string,
  language: Language,
): Promise<TrimSettings> {
  try {
    const settingsItem = await queryItemByPath(client, sitecoreContextId, SETTINGS_PATH, language);

    if (settingsItem?.fields?.nodes) {
      const valueField = settingsItem.fields.nodes.find((f) => f.name === "Value");
      if (valueField?.value) {
        try {
          const parsed = JSON.parse(valueField.value);
          return { ...DEFAULT_TRIM_SETTINGS, ...parsed };
        } catch {
          return DEFAULT_TRIM_SETTINGS;
        }
      }
    }

    return DEFAULT_TRIM_SETTINGS;
  } catch (error) {
    console.error("Error loading retention settings:", error);
    return DEFAULT_TRIM_SETTINGS;
  }
}

export async function saveTrimSettings(
  client: ClientSDK,
  sitecoreContextId: string,
  settings: TrimSettings,
  language: Language,
): Promise<void> {
  try {
    let versioningCenterItem = await queryItemByPath(
      client,
      sitecoreContextId,
      VERSIONING_CENTER_PATH,
      language,
    );

    if (!versioningCenterItem) {
      versioningCenterItem = await createItem(
        client,
        sitecoreContextId,
        MODULES_PARENT_ID,
        VERSIONING_CENTER_TEMPLATE_ID,
        "VersioningCenter",
        language,
      );

      if (!versioningCenterItem) {
        throw new Error("Failed to create VersioningCenter folder");
      }
    }

    const versioningCenterId = versioningCenterItem.itemId;

    let settingsItem = await queryItemByPath(
      client,
      sitecoreContextId,
      SETTINGS_PATH,
      language,
    );

    if (!settingsItem) {
      settingsItem = await createItem(
        client,
        sitecoreContextId,
        versioningCenterId,
        SETTINGS_ITEM_TEMPLATE_ID,
        "Settings",
        language,
      );

      if (!settingsItem) {
        throw new Error("Failed to create Settings item");
      }
    }

    const json = JSON.stringify(settings);
    await updateItemFieldByPath(client, sitecoreContextId, SETTINGS_PATH, "Value", json, language);
  } catch (error) {
    console.error("Error saving retention settings:", error);
    throw error;
  }
}
