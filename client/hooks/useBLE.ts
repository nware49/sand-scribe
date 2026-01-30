import { useState, useEffect, useCallback } from "react";
import { bleService, BLEConnectionState } from "@/lib/ble-service";

export function useBLE() {
  const [connectionState, setConnectionState] = useState<BLEConnectionState>(
    bleService.getConnectionState()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = bleService.subscribe((state) => {
      setConnectionState(state);
      if (state === "error") {
        setError("Failed to connect to device");
      } else {
        setError(null);
      }
    });

    // Auto-start scanning on mount
    bleService.startScan();

    return () => {
      unsubscribe();
      bleService.stopScan();
    };
  }, []);

  const reconnect = useCallback(() => {
    setError(null);
    bleService.startScan();
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    try {
      await bleService.sendMessage(message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      return false;
    }
  }, []);

  const isConnected = connectionState === "connected";
  const isScanning = connectionState === "scanning";
  const isConnecting = connectionState === "connecting";

  return {
    connectionState,
    isConnected,
    isScanning,
    isConnecting,
    error,
    reconnect,
    sendMessage,
    deviceName: bleService.getDeviceName(),
  };
}
