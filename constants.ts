
import { VoiceName } from './types';

// List of available voices for the TTS model
export const AVAILABLE_VOICES: { label: string; value: VoiceName }[] = [
  { label: 'Zephyr (Default)', value: VoiceName.ZEPHYR },
  { label: 'Kore', value: VoiceName.KORE },
  { label: 'Puck', value: VoiceName.PUCK },
  { label: 'Charon', value: VoiceName.CHARON },
  { label: 'Fenrir', value: VoiceName.FENRIR },
];

// Model name for Text-to-Speech
export const TTS_MODEL_NAME = 'gemini-2.5-flash-preview-tts';
