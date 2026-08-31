import React, { useState, useEffect, useRef } from 'react';
import { VCHeardLog } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  Ear,
  Trash2,
  RefreshCw,
  Search,
  Activity,
  Play,
  Square,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface VcHearingFeedProps {
  hearLogs: VCHeardLog[];
  onClearHearLogs: () => void;
  onRefresh: () => void;
  backendUrl: string;
}

export const VcHearingFeed: React.FC<VcHearingFeedProps> = ({
  hearLogs,
  onClearHearLogs,
  onRefresh,
  backendUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minDb, setMinDb] = useState<number>(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentDecibels, setCurrentDecibels] = useState<number>(0);
  const [micStatusText, setMicStatusText] = useState('Browser Mic Idle');
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const sampleVoicePrompts = [
    { speaker: 'BaconGuy99', text: 'Hey John Doe, can you jump for me?', decibels: 78, distance: 3.2 },
    { speaker: 'NoobMaster2026', text: 'Is anyone listening on Voice Chat?', decibels: 84, distance: 4.8 },
    { speaker: 'Robloxian_Alex', text: 'Follow me to the spawn area!', decibels: 71, distance: 2.1 },
    { speaker: 'CoolGamer_99', text: 'What song is playing right now?', decibels: 88, distance: 5.5 },
    { speaker: 'ShadowNinja', text: 'Hey! Are you an AI bot or a real player?', decibels: 76, distance: 1.8 }
  ];

  const startMicListening = async () => {
    try {
      setMicStatusText('Requesting mic permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMicActive(true);
      setMicStatusText('Live VC Mic Active');

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        animFrameRef.current = requestAnimationFrame(updateLevel);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const db = Math.min(100, Math.round((average / 255) * 100));
        setCurrentDecibels(db);
      };

      updateLevel();
    } catch {
      setMicStatusText('Microphone access denied');
    }
  };

  const stopMicListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsMicActive(false);
    setCurrentDecibels(0);
    setMicStatusText('Browser Mic Idle');
  };

  const handleSimulateHeardVoice = async (sample: { speaker: string; text: string; decibels: number; distance: number }) => {
    try {
      await fetch(`${backendUrl}/hear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: sample.speaker,
          text: sample.text,
          decibels: sample.decibels,
          distance: sample.distance,
          character: 'John Doe'
        })
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to simulate heard voice:', e);
    }
  };

  const handlePlayAiAudio = (text: string, id: string) => {
    if (currentlyPlayingId === id) {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      setCurrentlyPlayingId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    setCurrentlyPlayingId(id);
    const streamUrl = `${backendUrl}/api/tts-stream?text=${encodeURIComponent(text)}`;
    const audio = new Audio(streamUrl);
    currentAudioRef.current = audio;

    const fallbackSpeak = () => {
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        synth.cancel();
        if (synth.paused) synth.resume();
        const u = new SpeechSynthesisUtterance(text);
        synth.speak(u);
      }
      setTimeout(() => setCurrentlyPlayingId(null), 2500);
    };

    audio.onerror = fallbackSpeak;
    audio.play().catch(fallbackSpeak);
    audio.onended = () => setCurrentlyPlayingId(null);
  };

  const filteredHearLogs = hearLogs.filter((log) => {
    const matchesSearch =
      (log.speaker && log.speaker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.text && log.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.aiResponse && log.aiResponse.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDb = (log.decibels || 0) >= minDb;
    return matchesSearch && matchesDb;
  });

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono flex items-center gap-2">
              <Ear className="w-4 h-4 text-cyan-400" />
              Live VC Hearing & Speech Recognition
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AUDIO STREAM
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Real-time audio listener capturing nearby players' voice chat & intent
          </p>
        </div>

        {/* Mic & Refresh Controls */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          {isMicActive ? (
            <button
              onClick={stopMicListening}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Mic</span>
            </button>
          ) : (
            <button
              onClick={startMicListening}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 hover:bg-zinc-800"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Listen Mic</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClearHearLogs}
            disabled={hearLogs.length === 0}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mic Status & Quick Simulator */}
      <div className="p-3 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-zinc-400">{micStatusText}</span>
          {isMicActive && (
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400 font-bold">{currentDecibels} dB</span>
              <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-75"
                  style={{ width: `${currentDecibels}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-zinc-500 text-[11px]">Simulate VC:</span>
          {sampleVoicePrompts.slice(0, 3).map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSimulateHeardVoice(s)}
              className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60"
            >
              {s.speaker}
            </button>
          ))}
        </div>
      </div>

      {/* Heard Stream Items */}
      <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
        {filteredHearLogs.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-xs font-mono">
            {hearLogs.length === 0
              ? 'No player voice chat heard yet. Speak into the microphone or click a simulated player above.'
              : 'No matching voice events found.'}
          </div>
        ) : (
          filteredHearLogs.map((log) => {
            const isPlayingThis = currentlyPlayingId === log.id;
            return (
              <div
                key={log.id}
                className="p-3.5 hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-4 font-mono"
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-cyan-400 text-xs shrink-0">
                    VC
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-zinc-100">{log.speaker}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded">
                        {log.decibels || 65} dB
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {log.distance ? `${log.distance}m` : 'Nearby'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-sans mb-1.5">
                      Heard: "{log.text}"
                    </p>

                    {log.aiResponse && (
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-xs font-mono flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-emerald-400 font-semibold mr-1">AI Response:</span>
                          <span className="text-zinc-300 font-sans">"{log.aiResponse}"</span>
                        </div>
                        <button
                          onClick={() => handlePlayAiAudio(log.aiResponse!, log.id)}
                          className={`p-1.5 rounded text-xs shrink-0 ${
                            isPlayingThis
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                          }`}
                          title="Play AI Spoken Response"
                        >
                          {isPlayingThis ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
