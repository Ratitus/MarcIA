export interface ChatMessage {
  role: string;
  text: string;
  files?: { data: string; mimeType: string; name: string; isText: boolean }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
export {};

