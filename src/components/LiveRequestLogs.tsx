import React, { useState } from 'react';
import { VCRequestLog } from '../types';
import { Play, Pause, Trash2, Search, Volume2, RefreshCw, Clock, CheckCircle, Radio } from 'lucide-react';

interface LiveRequestLogsProps {
  logs: VCRequestLog[];
  onClearLogs: () => void;
  onRefresh: () => void;
  autoPlayAudio: boolean;
  setAutoPlayAudio: (val: boolean) => void;
}

export const LiveRequestLogs: React.FC<LiveRequestLogsProps> = ({
  logs,
  onClearLogs,
  onRefresh,
  autoPlayAudio,
  setAutoPlayAudio
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState('ALL');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  const characters = Array.from(new Set(logs.map((l) => l.character)));

  const handlePlayAudio = (log: VCRequestLog) => {
    if (playingId === log.id && audioObj) {
      audioObj.pause();
      setPlayingId(null);
      return;
    }

    if (audioObj) {
      audioObj.pause();
    }

    const audioUrl = log.audioUrl || `/api/audio/${log.id}`;
    const newAudio = new Audio(audioUrl);
    setAudioObj(newAudio);
    setPlayingId(log.id);

    let hasSpoken = false;
    const fallbackSpeak = () => {
      if (!hasSpoken && 'speechSynthesis' in window) {
        hasSpoken = true;
        const synth = window.speechSynthesis;
        synth.cancel();
        if (synth.paused) synth.resume();
        const utterance = new SpeechSynthesisUtterance(log.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synth.speak(utterance);
      }
    };

    newAudio.onerror = fallbackSpeak;
    newAudio.play().catch(fallbackSpeak);

    newAudio.onended = () => {
      setPlayingId(null);
    };
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.character.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCharacter =
      selectedCharacterFilter === 'ALL' || log.character === selectedCharacterFilter;
    return matchesSearch && matchesCharacter;
  });

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Live VC Spoken Stream
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SECURE STREAM
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Voice synthesis events and real-time audio streams dispatched to Roblox
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-xs font-mono text-zinc-300 cursor-pointer bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => setAutoPlayAudio(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Auto-Play</span>
          </label>

          <button
            onClick={onRefresh}
            className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
            title="Clear Stream History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search spoken logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
        </div>

        {characters.length > 0 && (
          <select
            value={selectedCharacterFilter}
            onChange={(e) => setSelectedCharacterFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Personas ({logs.length})</option>
            {characters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Log Feed Items */}
      <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-xs font-mono">
            {logs.length === 0
              ? 'Waiting for incoming Voice Chat requests from Roblox or Voice Synth Studio...'
              : 'No matching stream records found.'}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isPlayingThis = playingId === log.id;
            const code = log.character.slice(0, 2).toUpperCase();

            return (
              <div
                key={log.id}
                className="p-3.5 hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-4 font-mono"
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-xs shrink-0">
                    {code}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-zinc-100">{log.character}</span>
                      {log.voiceName && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                          {log.voiceName}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1 py-0.2 rounded">
                        {log.latencyMs}ms
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 break-words leading-relaxed font-sans">
                      "{log.text}"
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  <button
                    onClick={() => handlePlayAudio(log)}
                    className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      isPlayingThis
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                    title="Play Synthesized Audio"
                  >
                    {isPlayingThis ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
