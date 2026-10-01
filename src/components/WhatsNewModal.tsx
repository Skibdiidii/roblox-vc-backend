import React, { useEffect, useRef } from 'react';
import { Sparkles, X, History, Flame, Music, Bot, CheckCircle2 } from 'lucide-react';

interface PatchNote {
  version: string;
  date: string;
  title: string;
  badge?: string;
  changes: string[];
}

const PATCH_NOTES: PatchNote[] = [
  {
    version: "v3.2.0",
    date: "Current Release",
    title: "Mistral Lightweight AI & Smart DJ Intent Engine",
    badge: "LATEST",
    changes: [
      "Configured Mistral AI intelligent lightweight model pipeline for sub-second conversational latency in Roblox VC.",
      "Enhanced Natural Music Intent Parser: AI automatically detects and plays songs from phrases like 'play music (song)', 'put on carti', 'music plzzz fein'.",
      "Integrated Live YouTube Music DJ with real-time web audio browser synchronization.",
      "Real Roblox emote dancing engine (/e dance, /e dance2, /e dance3) with R15/R6 animations.",
      "Automated periodic System Tips broadcaster to guide players on AI voice and music commands."
    ]
  },
  {
    version: "v3.1.0",
    date: "Previous Update",
    title: "Context-Aware Following & Smart Motor Controls",
    changes: [
      "Targeted Player Follow: say 'go to [player] and follow them' or 'walk with me' to track any user in the server.",
      "Smart Chair Seating & Floor Sitting: AI autonomously navigates and sits on nearby seats and benches.",
      "Expanded physical action gestures including Spin, Wave, Sleep/Lay Down, Laugh, and Look-At.",
      "DuckDuckGo instant web search grounding for live trivia, facts, and question answering in Roblox chat."
    ]
  },
  {
    version: "v3.0.0",
    date: "Major Release",
    title: "YouTube Music Player & Live Audio Mixer",
    changes: [
      "Integrated YouTube Music player with instant query search, popular genre playlists, and live stream previews.",
      "Master Audio Mixer with independent volume sliders for background music and character TTS.",
      "Full synchronization between Roblox executor scripts and web browser playback."
    ]
  },
  {
    version: "v2.5.0",
    date: "Feature Update",
    title: "16+ High-Fidelity Character Voices & Persona Tuning",
    changes: [
      "Added 16 distinct voice options (British, American, French, Japanese, Australian accents).",
      "Custom Persona creator with pitch, speech rate, and system prompt customization.",
      "ElevenLabs voice engine and zero-config Google TTS integration."
    ]
  },
  {
    version: "v2.0.0",
    date: "Feature Update",
    title: "Real-Time VC Hearing Feed & Screen Awareness",
    changes: [
      "Added live VC hearing log feed with volume decibel tracking and audio waveforms.",
      "Screen context awareness inspecting player locale, avatar accessories, and server list.",
      "Automatic void safety net repositioning fallen characters."
    ]
  },
  {
    version: "v1.0.0",
    date: "Initial Release",
    title: "Roblox AI Mimic Core Engine",
    changes: [
      "Universal Roblox Lua script compatible with Delta, Fluxus, Wave, Solara, and Synapse X.",
      "Live request logger and bi-directional HTTP communication bridge."
    ]
  }
];

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">What's New & Updates</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  v3.2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Latest improvements, Mistral AI model pipeline & music DJ enhancements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="p-5 overflow-y-auto space-y-6 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
        >
          {PATCH_NOTES.map((note, index) => (
            <div
              key={note.version}
              className={`p-4 rounded-xl border ${
                index === 0
                  ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {note.version}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{note.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {note.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3 text-emerald-400" />
                      {note.badge}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{note.date}</span>
                </div>
              </div>

              <ul className="space-y-1.5 mt-3">
                {note.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start text-xs text-slate-300 space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="text-center py-2 text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <History className="w-3.5 h-3.5" />
            <span>You have reached the beginning of the changelog</span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Scroll up/down anytime to review past version releases.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
