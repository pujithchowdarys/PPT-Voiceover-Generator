
// Enum for available voices
export enum VoiceName {
  ZEPHYR = 'Zephyr',
  KORE = 'Kore',
  PUCK = 'Puck',
  CHARON = 'Charon',
  FENRIR = 'Fenrir',
}

// Interface for a single slide's voiceover data
export interface SlideVoiceover {
  id: string; // Unique ID for React keys
  text: string;
  audioUrl: string | null;
  isLoading: boolean;
  error: string | null;
}
