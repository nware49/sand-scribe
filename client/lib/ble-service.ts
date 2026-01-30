// BLE Service for Beach Messages
// Note: Real BLE functionality requires react-native-ble-plx and a development build
// This is a simulated service for Expo Go demonstration

export const BLE_CONFIG = {
  deviceName: "Helen's Display",
  serviceUUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
  characteristicUUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
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

// Simulated BLE Service for Expo Go
// In a real implementation, you would use react-native-ble-plx
class BLEService {
  private connectionState: BLEConnectionState = "disconnected";
  private listeners: Set<(state: BLEConnectionState) => void> = new Set();
  private simulatedDevice: BLEDevice | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;

  getConnectionState(): BLEConnectionState {
    return this.connectionState;
  }

  subscribe(listener: (state: BLEConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.connectionState));
  }

  private setConnectionState(state: BLEConnectionState) {
    this.connectionState = state;
    this.notifyListeners();
  }

  // Start scanning for the target device
  async startScan(): Promise<void> {
    if (this.connectionState === "scanning" || this.connectionState === "connected") {
      return;
    }

    this.setConnectionState("scanning");

    // Simulate finding the device after a delay
    this.scanTimeout = setTimeout(() => {
      this.simulatedDevice = {
        id: "simulated-device-id",
        name: BLE_CONFIG.deviceName,
        rssi: -65,
      };
      this.connect();
    }, 2000);
  }

  stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    if (this.connectionState === "scanning") {
      this.setConnectionState("disconnected");
    }
  }

  async connect(): Promise<void> {
    if (!this.simulatedDevice) {
      this.setConnectionState("error");
      return;
    }

    this.setConnectionState("connecting");

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    this.setConnectionState("connected");
  }

  async disconnect(): Promise<void> {
    this.simulatedDevice = null;
    this.setConnectionState("disconnected");
  }

  // Send a message to the BLE characteristic
  async sendMessage(message: string): Promise<boolean> {
    if (this.connectionState !== "connected") {
      throw new Error("Not connected to device");
    }

    // Simulate sending the message
    // In a real implementation, this would write to the BLE characteristic
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate occasional failures for realistic behavior
    const success = Math.random() > 0.05; // 95% success rate
    
    if (!success) {
      throw new Error("Failed to send message");
    }

    return true;
  }

  isConnected(): boolean {
    return this.connectionState === "connected";
  }

  getDeviceName(): string {
    return this.simulatedDevice?.name || BLE_CONFIG.deviceName;
  }
}

// Export a singleton instance
export const bleService = new BLEService();
