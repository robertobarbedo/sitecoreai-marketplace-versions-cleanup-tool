import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { XMC } from "@sitecore-marketplace-sdk/xmc";

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
}

let client: ClientSDK | undefined = undefined;

async function getMarketplaceClient() {
  if (client) {
    return client;
  }

  const config = {
    target: window.parent,
    modules: [XMC],
  };

  client = await ClientSDK.init(config);
  return client;
}

export function useMarketplaceClient() {
  const [state, setState] = useState<MarketplaceClientState>({
    client: null,
    error: null,
    isLoading: false,
    isInitialized: false,
  });

  const isInitializingRef = useRef(false);

  const initializeClient = useCallback(async (attempt = 1): Promise<void> => {
    let shouldProceed = false;
    setState((prev) => {
      if (prev.isLoading || prev.isInitialized || isInitializingRef.current) {
        return prev;
      }
      shouldProceed = true;
      isInitializingRef.current = true;
      return { ...prev, isLoading: true, error: null };
    });

    if (!shouldProceed) return;

    try {
      const sdkClient = await getMarketplaceClient();
      setState({
        client: sdkClient,
        error: null,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return initializeClient(attempt + 1);
      }

      setState({
        client: null,
        error: error instanceof Error ? error : new Error("Failed to initialize MarketplaceClient"),
        isLoading: false,
        isInitialized: false,
      });
    } finally {
      isInitializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    initializeClient();

    return () => {
      isInitializingRef.current = false;
      setState({
        client: null,
        error: null,
        isLoading: false,
        isInitialized: false,
      });
    };
  }, [initializeClient]);

  return useMemo(
    () => ({ ...state, initialize: initializeClient }),
    [state, initializeClient],
  );
}
