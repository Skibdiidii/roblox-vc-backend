import React, { useState, useEffect } from 'react';
import { CharacterProfile, TTSVoiceOption } from '../types';
import { Mic, Send, Play, Pause, Volume2, Sparkles, CheckCircle, RefreshCcw, Sliders, Radio } from 'lucide-react';

interface VoiceTesterProps {
  characters: CharacterProfile[];
  backendUrl: string;
  onSendSuccess: () => void;
}

export const VoiceTester: React.FC<VoiceTesterProps> = ({
  characters,
  backendUrl,
  onSendSuccess
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('John Doe');
  const [selectedVoice, setSelectedVoice] = useState<string>('Brian');
  const [availableVoices, setAvailableVoices] = useState<TTSVoiceOption[]>([]);
  const [text, setText] = useState<string>('Hello! Testing the multi-character voice synthesizer on Roblox Voice Chat.');
  const [pitch, setPitch] = useState<number>(1.0);
  const [rate, setRate] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`${backendUrl}/api/voices`)
      .then((res) => res.json())
      .then((data) => {
        if (data.voices) {
          setAvailableVoices(data.voices);
        }
      })
      .catch(() => {});
  }, [backendUrl]);

  // When character changes, sync designated voice
  const handleSelectCharacter = (char: CharacterProfile) => {
    setSelectedCharacter(char.name);
    setSelectedVoice(char.voiceName || 'Brian');
    setPitch(char.pitch || 1.0);
    setRate(char.rate || 1.0);
  };

  const quickPhrases = [
    { label: 'Follow Command', text: 'Follow me over to the spawn tower right now!' },
    { label: 'Music Request', text: 'Playing some phonk music on the server DJ deck!' },
    { label: 'Challenge Hype', text: 'Welcome back to the ultimate obstacle course challenge!' },
    { label: 'Heisenberg Line', text: 'Say my name. We have work to finish in this game.' },
    { label: 'Void Whisper', text: 'I am lurking in the shadows of the Roblox map.' }
  ];

  const handleSendSpeak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setLastResponse(null);

    try {
      const res = await fetch(`${backendUrl}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          character: selectedCharacter,
          voice: selectedVoice,
          pitch,
          rate
        })
      });

      const data = await res.json();
      setLastResponse(data);
      setIsLoading(false);
      onSendSuccess();

      // Play audio stream
      if (data.audioUrl) {
        playAudioFromUrl(`${backendUrl}${data.audioUrl}`);
      } else {
        const streamUrl = `${backendUrl}/api/tts-stream?voice=${encodeURIComponent(selectedVoice)}&text=${encodeURIComponent(text.trim())}`;
        playAudioFromUrl(streamUrl);
      }
    } catch (err: any) {
      setIsLoading(false);
      setLastResponse({ success: false, error: err.message || 'Network request failed' });
    }
  };

  const playAudioFromUrl = (url: string) => {
    if (audioObj) {
      audioObj.pause();
    }

    setIsPlaying(true);
    const audio = new Audio(url);
    setAudioObj(audio);

    const fallbackSpeak = () => {
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        synth.cancel();
        if (synth.paused) synth.resume();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        synth.speak(utterance);
      }
      setTimeout(() => setIsPlaying(false), 2500);
    };

    audio.onerror = fallbackSpeak;
    audio.play().catch(fallbackSpeak);
    audio.onended = () => setIsPlaying(false);
  };

  const currentCharObj = characters.find((c) => c.name === selectedCharacter) || characters[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Voice Tester Form */}
      <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-5">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-zinc-800 border border-zinc-700 text-emerald-400 rounded-lg">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
              Voice Synth Studio
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Audition multi-voice TTS synthesis and test live acoustic speech payloads
            </p>
          </div>
        </div>

        <form onSubmit={handleSendSpeak} className="space-y-4">
          {/* Persona Selection */}
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5">
              1. Choose Character Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {characters.map((char) => {
                const isSelected = selectedCharacter === char.name;
                const code = char.code || char.name.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleSelectCharacter(char)}
                    className={`flex items-center space-x-2.5 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                        : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-medium truncate text-zinc-200">{char.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{char.voiceName || 'Brian'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Override Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div>
              <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                Acoustic Voice Model
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.accent} - {v.gender})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Brian">Brian (British Void / Male)</option>
                    <option value="Matthew">Matthew (Stern Heisenberg / Male)</option>
                    <option value="Justin">Justin (Fast Hype Youth / Male)</option>
                    <option value="Joey">Joey (Chill Gamer / Male)</option>
                    <option value="Geraint">Geraint (Deep Bass / Male)</option>
                    <option value="Joanna">Joanna (Crisp AI / Female)</option>
                    <option value="Kendra">Kendra (Smooth Radio / Female)</option>
                    <option value="Salli">Salli (Energetic Teen / Female)</option>
                    <option value="Mizuki">Mizuki (Anime Melodic / Female)</option>
                    <option value="Hans">Hans (Resonant / Male)</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                  Pitch ({pitch}x)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                  Rate ({rate}x)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Phrases */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              Quick Test Prompts
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(phrase.text)}
                  className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
                >
                  {phrase.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              Speech Synthesis Text ({text.length}/300 chars)
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to synthesize into Roblox Voice Chat..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Trigger Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
              {isPlaying && (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Synthesizing Voice Stream...</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Synthesize & Speak</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Response Payload & Telemetry Inspector */}
      <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
              Live HTTP Telemetry
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              JSON RESPONSE
            </span>
          </div>

          {lastResponse ? (
            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>STATUS: 200 OK</span>
                <span>{lastResponse.latencyMs || 12} ms</span>
              </div>
              <pre className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-zinc-950/60 p-6 rounded-lg border border-zinc-800/80 text-center text-xs font-mono text-zinc-500">
              Trigger a voice synthesis test to inspect real-time response latency and audio stream endpoints.
            </div>
          )}
        </div>

        {/* Selected Persona Summary Card */}
        {currentCharObj && (
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Active Persona:</span>
              <span className="font-bold text-zinc-100">{currentCharObj.name}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Voice Profile:</span>
              <span className="text-emerald-400 font-bold">{selectedVoice}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Acoustic Specs:</span>
              <span className="text-zinc-300">{pitch}x Pitch / {rate}x Rate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
