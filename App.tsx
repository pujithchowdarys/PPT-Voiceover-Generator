
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateVoiceover } from './services/geminiService';
import VoiceoverItem from './components/VoiceoverItem';
import { VoiceName, SlideVoiceover } from './types';
import { AVAILABLE_VOICES } from './constants';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [voiceovers, setVoiceovers] = useState<SlideVoiceover[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.ZEPHYR);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateAllVoiceovers = useCallback(async () => {
    setIsGeneratingAll(true);
    setVoiceovers([]); // Clear previous voiceovers

    // Each non-empty line is treated as a separate "slide"
    const slideTexts = inputText.split('\n').map(line => line.trim()).filter(text => text.length > 0);

    if (slideTexts.length === 0) {
      alert('Please enter some text to generate voiceovers.');
      setIsGeneratingAll(false);
      return;
    }

    const initialVoiceovers: SlideVoiceover[] = slideTexts.map((text, index) => ({
      id: `slide-${index}-${Date.now()}`,
      text: text,
      audioUrl: null,
      isLoading: true,
      error: null,
    }));
    setVoiceovers(initialVoiceovers);

    const updatedVoiceovers: SlideVoiceover[] = [...initialVoiceovers]; // Create a mutable copy

    for (let i = 0; i < slideTexts.length; i++) {
      try {
        const audioUrl = await generateVoiceover(slideTexts[i], selectedVoice);
        updatedVoiceovers[i] = { ...updatedVoiceovers[i], audioUrl, isLoading: false };
      } catch (error) {
        console.error(`Error generating voiceover for slide ${i}:`, error);
        updatedVoiceovers[i] = { ...updatedVoiceovers[i], error: `Failed to generate voiceover: ${error instanceof Error ? error.message : String(error)}`, isLoading: false };
      }
      // Update state progressively to show progress for each slide
      setVoiceovers([...updatedVoiceovers]);
    }
    setIsGeneratingAll(false);
  }, [inputText, selectedVoice]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.txt')) {
        alert('Please upload a .txt file.');
        event.target.value = ''; // Clear the file input
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content);
        if (textareaRef.current) {
          textareaRef.current.focus(); // Focus the textarea after loading content
        }
      };
      reader.onerror = () => {
        alert('Failed to read file.');
      };
      reader.readAsText(file);
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col">
      <header className="py-4 mb-6 text-center border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          PPT Voiceover Generator
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Turn your presentation notes into natural-sounding voiceovers.
        </p>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-6">
        {/* Input Section */}
        <section className="flex-1 p-6 bg-white rounded-lg shadow-md border border-gray-200 lg:sticky lg:top-6 lg:h-fit">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Enter Your Slide Content</h2>
          <p className="text-gray-600 mb-4">
            Type or paste the content for each slide. Each new line will be treated as a separate slide for voiceover generation.
          </p>

          <textarea
            ref={textareaRef}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px] mb-4 text-gray-700"
            placeholder="Enter your slide text here.
Each line will be a separate voiceover.
For example:
Slide 1: Introduction to the project goals.
Slide 2: Key features and benefits.
Slide 3: Our team and next steps."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGeneratingAll}
          ></textarea>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <label className="block text-gray-700 text-sm font-semibold flex-shrink-0">
              Select Voice:
            </label>
            <select
              className="flex-grow p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
              disabled={isGeneratingAll}
            >
              {AVAILABLE_VOICES.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <label htmlFor="file-upload" className="flex-1 cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-md text-center transition-colors duration-200 border border-blue-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3.75 3.75M12 9.75L8.25 13.5m-1.5 6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H5.25z" />
              </svg>
              Upload .txt File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isGeneratingAll}
            />
          </div>

          <button
            onClick={handleGenerateAllVoiceovers}
            className={`w-full py-3 px-6 rounded-md text-white font-bold text-lg transition-colors duration-200
              ${isGeneratingAll
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            disabled={isGeneratingAll || inputText.trim().length === 0}
          >
            {isGeneratingAll ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Voiceovers'
            )}
          </button>
        </section>

        {/* Output Section */}
        <section className="flex-1 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Generated Voiceovers</h2>
          {voiceovers.length === 0 && !isGeneratingAll && (
            <p className="text-gray-500">Voiceovers will appear here after generation.</p>
          )}
          {voiceovers.length > 0 && (
            <div className="space-y-4">
              {voiceovers.map((vo, index) => (
                <VoiceoverItem key={vo.id} voiceover={vo} index={index} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
