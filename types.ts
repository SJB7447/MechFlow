
export type Role = 'user' | 'assistant';
export type DiagnosticMode = 'general' | 'expert';

export interface Source {
  title: string;
  url: string;
}

export interface Message {
  role: Role;
  content: string;
  id: string;
  timestamp: Date;
  image?: string; // Base64 data string
  sources?: Source[];
}

export interface DiagnosticSession {
  messages: Message[];
  isThinking: boolean;
}
