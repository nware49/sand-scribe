import AsyncStorage from "@react-native-async-storage/async-storage";

const MESSAGES_KEY = "@beach_messages_history";
const MAX_MESSAGES = 50;

export interface SentMessage {
  id: string;
  text: string;
  timestamp: number;
}

export async function saveMessage(text: string): Promise<SentMessage> {
  const message: SentMessage = {
    id: Date.now().toString(),
    text,
    timestamp: Date.now(),
  };

  try {
    const existingData = await AsyncStorage.getItem(MESSAGES_KEY);
    const messages: SentMessage[] = existingData ? JSON.parse(existingData) : [];
    
    // Add new message at the beginning
    messages.unshift(message);
    
    // Keep only the most recent messages
    const trimmedMessages = messages.slice(0, MAX_MESSAGES);
    
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmedMessages));
    
    return message;
  } catch (error) {
    console.error("Failed to save message:", error);
    throw error;
  }
}

export async function getMessages(): Promise<SentMessage[]> {
  try {
    const data = await AsyncStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
}

export async function clearMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MESSAGES_KEY);
  } catch (error) {
    console.error("Failed to clear messages:", error);
    throw error;
  }
}
