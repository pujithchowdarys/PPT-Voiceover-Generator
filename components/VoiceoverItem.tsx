
import React from 'react';
import { SlideVoiceover } from '../types';

interface VoiceoverItemProps {
  voiceover: SlideVoiceover;
  index: number;
}

const VoiceoverItem: React.FC<VoiceoverItemProps> = ({ voiceover, index }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-md shadow-sm mb-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Slide {index + 1}</h3>
      <p className="text-gray-600 mb-4 italic">"{voiceover.text}"</p>

      {voiceover.isLoading && (
        <div className="flex items-center justify-center text-blue-500">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating voiceover...
        </div>
      )}

      {voiceover.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{voiceover.error}</span>
        </div>
      )}

      {voiceover.audioUrl && !voiceover.isLoading && (
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <audio controls className="w-full sm:w-auto flex-grow bg-gray-200 rounded-md">
            <source src={voiceover.audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          <a
            href={voiceover.audioUrl}
            download={`slide_${index + 1}_voiceover.wav`}
            className="flex items-center justify-center sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors duration-200 min-w-[120px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export default VoiceoverItem;
