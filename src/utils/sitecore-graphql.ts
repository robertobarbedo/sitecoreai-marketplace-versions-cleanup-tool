import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { SITECORE_DATABASES, type Language, DEFAULT_LANGUAGE } from "@/src/constants";
import type { VersionInfo } from "@/src/types/version";

function escapeGraphQL(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export interface SitecoreItem {
  itemId: string;
  name: string;
  path: string;
  fields?: { nodes: { name: string; value: string }[] };
}

export async function getSitecoreContextId(client: ClientSDK): Promise<string> {
  const contextResponse = await client.query("application.context");
  const appContext = contextResponse.data as Record<string, unknown>;
  const resourceAccess = appContext?.resourceAccess as
    | Array<{ context?: { preview?: string } }>
    | undefined;
  return resourceAccess?.[0]?.context?.preview ?? "";
}

export async function queryItemByPath(
  client: ClientSDK,
  sitecoreContextId: string,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<SitecoreItem | null> {
  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: {
        query: `
          query {
            item(where: { database: "${SITECORE_DATABASES.MASTER}", path: "${escapeGraphQL(path)}", language: "${escapeGraphQL(language)}" }) {
              itemId
              name
              path
              fields(ownFields: true, excludeStandardFields: true) {
                nodes { name value }
              }
            }
          }
        `,
      },
    },
  });

  return (response as Record<string, unknown> & { data?: { data?: { item?: SitecoreItem } } })
    .data?.data?.item ?? null;
}

export async function createItem(
  client: ClientSDK,
  sitecoreContextId: string,
  parentId: string,
  templateId: string,
  itemName: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<SitecoreItem | null> {
  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: {
        query: `
          mutation {
            createItem(input: {
              database: "${SITECORE_DATABASES.MASTER}"
              name: "${escapeGraphQL(itemName)}"
              parent: "${escapeGraphQL(parentId)}"
              templateId: "${escapeGraphQL(templateId)}"
              language: "${escapeGraphQL(language)}"
            }) {
              item {
                itemId
                name
                path
                fields(ownFields: true, excludeStandardFields: true) {
                  nodes { name value }
                }
              }
            }
          }
        `,
      },
    },
  });

  type CreateResponse = Record<string, unknown> & {
    data?: { data?: { createItem?: { item?: SitecoreItem } } };
  };

  return (response as CreateResponse).data?.data?.createItem?.item ?? null;
}

export async function updateItemFieldByPath(
  client: ClientSDK,
  sitecoreContextId: string,
  itemPath: string,
  fieldName: string,
  fieldValue: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<SitecoreItem | null> {
  const item = await queryItemByPath(client, sitecoreContextId, itemPath, language);
  if (!item) return null;

  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: {
        query: `
          mutation {
            updateItem(input: {
              fields: [{ name: "${escapeGraphQL(fieldName)}", value: "${escapeGraphQL(fieldValue)}", reset: false }]
              database: "${SITECORE_DATABASES.MASTER}"
              itemId: "${escapeGraphQL(item.itemId)}"
              language: "${escapeGraphQL(language)}"
              path: "${escapeGraphQL(itemPath)}"
              version: 1
            }) {
              item {
                name
                itemId
                fields(ownFields: true, excludeStandardFields: true) {
                  nodes { name value }
                }
              }
            }
          }
        `,
      },
    },
  });

  type UpdateResponse = Record<string, unknown> & {
    data?: { data?: { updateItem?: { item?: SitecoreItem } } };
  };

  return (response as UpdateResponse).data?.data?.updateItem?.item ?? null;
}

export async function queryItemVersions(
  client: ClientSDK,
  sitecoreContextId: string,
  itemId: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<VersionInfo[]> {
  const listResponse = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: {
        query: `
          query {
            item(where: { database: "${SITECORE_DATABASES.MASTER}", itemId: "${escapeGraphQL(itemId)}", language: "${escapeGraphQL(language)}" }) {
              versions { version }
            }
          }
        `,
      },
    },
  });

  type ListResponse = Record<string, unknown> & {
    data?: { data?: { item?: { versions: { version: number }[] } } };
  };

  const versionEntries = (listResponse as ListResponse).data?.data?.item?.versions;
  if (!versionEntries || versionEntries.length === 0) {
    return [];
  }

  const versions: VersionInfo[] = [];

  for (const entry of versionEntries) {
    const versionResponse = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: {
          query: `
            query {
              item(where: { database: "${SITECORE_DATABASES.MASTER}", itemId: "${escapeGraphQL(itemId)}", language: "${escapeGraphQL(language)}", version: ${entry.version} }) {
                version
                versionName
                updated: field(name: "__Updated") { value }
                updatedBy: field(name: "__Updated by") { value }
                workflow { workflowState { displayName final } }
              }
            }
          `,
        },
      },
    });

    type VersionItemResponse = {
      version: number;
      versionName: string;
      updated: { value: string } | null;
      updatedBy: { value: string } | null;
      workflow: { workflowState: { displayName: string; final: boolean } | null } | null;
    };

    type VersionResponse = Record<string, unknown> & {
      data?: { data?: { item?: VersionItemResponse } };
    };

    const item = (versionResponse as VersionResponse).data?.data?.item;
    if (item) {
      const wfState = item.workflow?.workflowState;

      versions.push({
        version: item.version,
        versionName: item.versionName ?? "",
        updatedDate: item.updated?.value ?? "",
        updatedBy: extractUsername(item.updatedBy?.value ?? ""),
        workflowState: wfState?.displayName ?? "",
        workflowStateName: wfState?.displayName ?? "No workflow",
        isFinalState: wfState?.final ?? false,
        isLive: false,
      });
    }
  }

  return versions;
}

export async function queryItemVersionsWithWorkflow(
  client: ClientSDK,
  sitecoreContextId: string,
  itemId: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<VersionInfo[]> {
  return queryItemVersions(client, sitecoreContextId, itemId, language);
}

export async function queryLiveVersionNumber(
  client: ClientSDK,
  liveContextId: string,
  itemPath: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<number | null> {
  try {
    const response = await client.mutate("xmc.live.graphql", {
      params: {
        query: { sitecoreContextId: liveContextId },
        body: {
          query: `
            query {
              item(path: "${escapeGraphQL(itemPath)}", language: "${escapeGraphQL(language)}") {
                version
              }
            }
          `,
        },
      },
    });

    type LiveResponse = Record<string, unknown> & {
      data?: { data?: { item?: { version: number } | null } };
    };

    return (response as LiveResponse).data?.data?.item?.version ?? null;
  } catch {
    return null;
  }
}

export async function deleteItemVersion(
  client: ClientSDK,
  sitecoreContextId: string,
  itemId: string,
  language: Language,
  versionNumber: number,
): Promise<void> {
  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: {
        query: `
          mutation {
            deleteItemVersion(input: {
              database: "${SITECORE_DATABASES.MASTER}"
              itemId: "${escapeGraphQL(itemId)}"
              language: "${escapeGraphQL(language)}"
              version: ${versionNumber}
            }) {
              __typename
            }
          }
        `,
      },
    },
  });

  type DeleteResponse = Record<string, unknown> & {
    data?: {
      data?: { deleteItemVersion?: { __typename?: string } | null };
      errors?: Array<{ message?: string }>;
    };
  };

  const typed = response as DeleteResponse;

  const graphqlErrors = typed.data?.errors;
  if (graphqlErrors && graphqlErrors.length > 0) {
    const msg = graphqlErrors.map((e) => e.message).filter(Boolean).join("; ");
    console.error("[deleteItemVersion] GraphQL errors:", graphqlErrors);
    throw new Error(msg || "Unknown GraphQL error");
  }

  if (!typed.data?.data?.deleteItemVersion) {
    console.error("[deleteItemVersion] unexpected response:", typed);
    throw new Error("The server did not confirm the deletion. Check the browser console for details.");
  }
}

function extractUsername(fullUser: string): string {
  if (!fullUser) return "";
  const parts = fullUser.split("\\");
  return parts[parts.length - 1];
}
