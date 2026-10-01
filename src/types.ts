export interface VCRequestLog {
  id: string;
  timestamp: string;
  character: string;
  voiceName?: string;
  text: string;
  audioUrl?: string;
  status: 'success' | 'failed' | 'processing';
  latencyMs: number;
  ip?: string;
  userAgent?: string;
  provider?: string;
}

export interface VCHeardLog {
  id: string;
  timestamp: string;
  speaker: string;
  text?: string;
  audioUrl?: string;
  audioBase64?: string;
  decibels?: number;
  distance?: number;
  character?: string;
  aiResponse?: string;
  status: 'analyzed' | 'listening' | 'error';
  latencyMs: number;
  ip?: string;
  userAgent?: string;
}

export interface TTSVoiceOption {
  id: string;
  name: string;
  displayName: string;
  gender: 'male' | 'female';
  accent: string;
  description: string;
  previewSample: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  code: string; // e.g. "JD", "WW", "MB", "BH", "AI"
  description: string;
  voiceName: string;
  voiceDisplayName: string;
  voiceGender: 'male' | 'female';
  voiceAccent: string;
  pitch: number; // 0.5 to 2.0
  rate: number;  // 0.5 to 2.0
  category: 'preset' | 'custom' | 'premium';
  systemInstruction?: string;
}

export interface BackendSettings {
  ttsProvider: 'streamelements' | 'google_tts';
  defaultLanguage: string;
  autoPlayAudioInBrowser: boolean;
  maxTextLength: number;
  corsAllowedOrigins: string;
  enableGeminiAI: boolean;
}

export interface ServerStats {
  uptimeSeconds: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  activeCharactersCount: number;
  totalHeardClips?: number;
  avgVolumeDecibels?: number;
  characterStats: Record<string, number>;
}
