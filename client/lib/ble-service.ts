// BLE Service for Sand Scribe
//
// Real Bluetooth Low Energy implementation backed by react-native-ble-plx.
// This requires a custom native build (expo-dev-client / EAS build) and a
// physical device — BLE is NOT available in Expo Go or on web. In those
// environments the service degrades gracefully to a "disconnected" state and
// reports `isBleAvailable() === false` so the UI can explain why.

import { Platform, PermissionsAndroid } from "react-native";
import type {
  BleManager as BleManagerType,
  Device,
  Subscription,
} from "react-native-ble-plx";

export const BLE_CONFIG = {
  deviceName: "Helen's Display",
  serviceUUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
  characteristicUUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
};

// --- Wire format knobs --------------------------------------------------------
// These default to "plain UTF-8, written with response, chunked to fit the MTU,
// terminated by a newline". Adjust to match your ESP32 firmware's expectations.
const WIRE_CONFIG = {
  // Bytes per BLE write. Keep below the negotiated ATT MTU minus 3 bytes of
  // overhead. 180 is safe for the common 185-byte iOS MTU.
  chunkSize: 180,
  // Appended to the end of every message so the firmware knows it's complete.
  // Set to "" to disable.
  terminator: "\n",
  // Pause between chunks so a slow peripheral doesn't drop writes.
  interChunkDelayMs: 20,
  // How long to scan before giving up.
  scanTimeoutMs: 15000,
  // Requested MTU on connect (Android honors this; iOS negotiates its own).
  requestMtu: 247,
};

export type BLEConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

// --- UTF-8 -> base64 ----------------------------------------------------------
// react-native-ble-plx writes/reads base64 strings. We encode without pulling
// in extra dependencies so this stays portable across the web/Expo Go fallback.
const B64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8ToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate — combine with the following low surrogate.
      const next = str.charCodeAt(++i);
      const cp = 0x10000 + ((code & 0x3ff) << 10) + (next & 0x3ff);
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function bytesToBase64(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out +=
      i + 1 < bytes.length
        ? B64_CHARS[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)]
        : "=";
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : "=";
  }
  return out;
}

function chunkBytes(bytes: number[], size: number): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < bytes.length; i += size) {
    chunks.push(bytes.slice(i, i + size));
  }
  return chunks;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Lazy, guarded manager ----------------------------------------------------
// require()-ing the native module on web or in Expo Go throws, so we load it
// lazily and remember whether BLE is usable.
let manager: BleManagerType | null = null;
let bleUnavailable = false;

function getManager(): BleManagerType | null {
  if (manager) return manager;
  if (bleUnavailable) return null;
  if (Platform.OS === "web") {
    bleUnavailable = true;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BleManager } = require("react-native-ble-plx");
    manager = new BleManager();
    return manager;
  } catch (err) {
    console.warn(
      "[BLE] Native module unavailable (Expo Go or missing dev build). " +
        "Build with expo-dev-client / EAS to enable Bluetooth.",
      err,
    );
    bleUnavailable = true;
    return null;
  }
}

async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  const apiLevel =
    typeof Platform.Version === "number"
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);

  // Android 11 and below scan with the location permission.
  if (apiLevel < 31) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // Android 12+ uses the dedicated Bluetooth runtime permissions.
  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
  return Object.values(result).every(
    (status) => status === PermissionsAndroid.RESULTS.GRANTED,
  );
}

class BLEService {
  private connectionState: BLEConnectionState = "disconnected";
  private listeners: Set<(state: BLEConnectionState) => void> = new Set();
  private connectedDevice: Device | null = null;
  private disconnectSub: Subscription | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  getConnectionState(): BLEConnectionState {
    return this.connectionState;
  }

  subscribe(listener: (state: BLEConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.connectionState));
  }

  private setConnectionState(state: BLEConnectionState) {
    this.connectionState = state;
    this.notifyListeners();
  }

  // Whether real Bluetooth is usable in this runtime (false on web / Expo Go).
  isBleAvailable(): boolean {
    return getManager() !== null;
  }

  // Scan for the target device and connect to the first match.
  async startScan(): Promise<void> {
    if (
      this.connectionState === "scanning" ||
      this.connectionState === "connecting" ||
      this.connectionState === "connected"
    ) {
      return;
    }

    const bleManager = getManager();
    if (!bleManager) {
      // No radio here — stay disconnected rather than showing a hard error.
      this.setConnectionState("disconnected");
      return;
    }

    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) {
      console.warn("[BLE] Bluetooth permissions denied");
      this.setConnectionState("error");
      return;
    }

    this.setConnectionState("scanning");

    this.scanTimeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      if (this.connectionState === "scanning") {
        this.setConnectionState("error");
      }
    }, WIRE_CONFIG.scanTimeoutMs);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn("[BLE] Scan error", error);
        this.clearScanTimeout();
        bleManager.stopDeviceScan();
        this.setConnectionState("error");
        return;
      }

      if (!device) return;

      const name = device.name ?? device.localName ?? "";
      const matchesName = name === BLE_CONFIG.deviceName;
      const matchesService = (device.serviceUUIDs ?? []).some(
        (uuid) => uuid.toLowerCase() === BLE_CONFIG.serviceUUID.toLowerCase(),
      );

      if (matchesName || matchesService) {
        this.clearScanTimeout();
        bleManager.stopDeviceScan();
        this.connect(device.id).catch((err) => {
          console.warn("[BLE] Connect failed", err);
          this.setConnectionState("error");
        });
      }
    });
  }

  private clearScanTimeout() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  stopScan(): void {
    const bleManager = getManager();
    this.clearScanTimeout();
    if (bleManager) {
      bleManager.stopDeviceScan();
    }
    if (this.connectionState === "scanning") {
      this.setConnectionState("disconnected");
    }
  }

  async connect(deviceId: string): Promise<void> {
    const bleManager = getManager();
    if (!bleManager) {
      this.setConnectionState("error");
      return;
    }

    this.setConnectionState("connecting");

    const device = await bleManager.connectToDevice(deviceId, {
      requestMTU: WIRE_CONFIG.requestMtu,
    });
    await device.discoverAllServicesAndCharacteristics();

    this.connectedDevice = device;

    // Reflect unexpected drops back into the UI.
    this.disconnectSub = device.onDisconnected(() => {
      this.connectedDevice = null;
      this.disconnectSub?.remove();
      this.disconnectSub = null;
      this.setConnectionState("disconnected");
    });

    this.setConnectionState("connected");
  }

  async disconnect(): Promise<void> {
    this.clearScanTimeout();
    this.disconnectSub?.remove();
    this.disconnectSub = null;

    const bleManager = getManager();
    bleManager?.stopDeviceScan();

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (err) {
        console.warn("[BLE] Error during disconnect", err);
      }
      this.connectedDevice = null;
    }

    this.setConnectionState("disconnected");
  }

  // Write a message to the BLE characteristic, chunked to fit the MTU.
  async sendMessage(message: string): Promise<boolean> {
    if (this.connectionState !== "connected" || !this.connectedDevice) {
      throw new Error("Not connected to device");
    }

    const payload = WIRE_CONFIG.terminator
      ? message + WIRE_CONFIG.terminator
      : message;
    const bytes = utf8ToBytes(payload);
    const chunks = chunkBytes(bytes, WIRE_CONFIG.chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const base64 = bytesToBase64(chunks[i]);
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        BLE_CONFIG.serviceUUID,
        BLE_CONFIG.characteristicUUID,
        base64,
      );
      if (i < chunks.length - 1 && WIRE_CONFIG.interChunkDelayMs > 0) {
        await delay(WIRE_CONFIG.interChunkDelayMs);
      }
    }

    return true;
  }

  isConnected(): boolean {
    return this.connectionState === "connected";
  }

  getDeviceName(): string {
    return this.connectedDevice?.name ?? BLE_CONFIG.deviceName;
  }
}

// Export a singleton instance
export const bleService = new BLEService();
