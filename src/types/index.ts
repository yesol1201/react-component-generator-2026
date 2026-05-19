export type Provider = 'anthropic' | 'google';

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
}

export interface StreamingState {
  id: string;
  prompt: string;
  streamingCode: string;
  createdAt: Date;
}
