
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { VoiceName } from '../types';
import { TTS_MODEL_NAME } from '../constants';

// Utility to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Utility to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Generates a voiceover from text using the Gemini TTS model.
 * @param text The text to convert to speech.
 * @param voiceName The name of the voice to use.
 * @returns A promise that resolves to a base64 encoded audio URL.
 */
export async function generateVoiceover(text: string, voiceName: VoiceName): Promise<string> {
  // Create a new GoogleGenAI instance for each call to ensure the latest API key is used
  // This helps mitigate race conditions if the API key is re-selected.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio data received from the API.');
    }

    // The audio is raw PCM data. To play it in a browser, we create an AudioContext
    // and decode the raw data into an AudioBuffer, then create a playable Blob URL.
    // Fix: Removed deprecated `window.webkitAudioContext` as modern browsers standardize on `window.AudioContext`.
    const outputAudioContext = new window.AudioContext({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000, // Sample rate as returned by the API
      1,     // Number of channels (mono)
    );

    // Convert AudioBuffer to WAV Blob for download
    const wavBlob = await audioBufferToWavBlob(audioBuffer, outputAudioContext);
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error('Error in generateVoiceover:', error);
    throw error;
  }
}

/**
 * Converts an AudioBuffer to a WAV Blob.
 * This is needed because raw PCM needs a header for typical audio playback/download.
 */
async function audioBufferToWavBlob(audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44; // 2 bytes per sample, 44-byte header
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const format = 1; // PCM
  const sampleRate = audioContext.sampleRate;
  const byteRate = sampleRate * numOfChan * 2; // 2 bytes per sample
  const blockAlign = numOfChan * 2;
  const bitDepth = 16;

  // Write WAV header
  let offset = 0;
  /* RIFF identifier */
  writeString(view, offset, 'RIFF'); offset += 4;
  /* file length */
  view.setUint32(offset, length - 8, true); offset += 4;
  /* RIFF type */
  writeString(view, offset, 'WAVE'); offset += 4;
  /* format chunk identifier */
  writeString(view, offset, 'fmt '); offset += 4;
  /* format chunk length */
  view.setUint32(offset, 16, true); offset += 4;
  /* sample format (raw PCM) */
  view.setUint16(offset, format, true); offset += 2;
  /* channel count */
  view.setUint16(offset, numOfChan, true); offset += 2;
  /* sample rate */
  view.setUint32(offset, sampleRate, true); offset += 4;
  /* byte rate (sample rate * block align) */
  view.setUint32(offset, byteRate, true); offset += 4;
  /* block align (channels * bytes per sample) */
  view.setUint16(offset, blockAlign, true); offset += 2;
  /* bits per sample */
  view.setUint16(offset, bitDepth, true); offset += 2;
  /* data chunk identifier */
  writeString(view, offset, 'data'); offset += 4;
  /* data chunk length */
  view.setUint32(offset, length - offset - 4, true); offset += 4;

  // Write audio data
  floatTo16BitPCM(view, offset, audioBuffer.getChannelData(0));

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) {
    view.setUint8(offset + i, s.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}