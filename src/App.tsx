import React, { useState, useEffect, useRef } from 'react';
import { VCRequestLog, VCHeardLog, CharacterProfile, ServerStats } from './types';
import { Navbar, TabType } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { LiveRequestLogs } from './components/LiveRequestLogs';
import { VcHearingFeed } from './components/VcHearingFeed';
import { VoiceTester } from './components/VoiceTester';
import { CharacterManager } from './components/CharacterManager';
import { YouTubeMusicPlayer, YouTubeTrack } from './components/YouTubeMusicPlayer';
import { ScriptVerificationModal } from './components/ScriptVerificationModal';
import { Radio, Disc, Mic, Volume2 } from 'lucide-react';

export default function App() {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return localStorage.getItem('roblox_vc_script_verified') === 'true';
  });

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [logs, setLogs] = useState<VCRequestLog[]>([]);
  const [hearLogs, setHearLogs] = useState<VCHeardLog[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [lastProcessedLogId, setLastProcessedLogId] = useState<string | null>(null);


  // Background Music & Master Mixer
  const [bgMusicPlaying, setBgMusicPlaying] = useState<boolean>(false);
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.3);
  const [ttsVolume, setTtsVolume] = useState<number>(1.0);
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>({
    id: "r_g3vQZ52r4",
    title: "METAMORPHOSIS - INTERWORLD (Slowed + Reverb)",
    channel: "INTERWORLD",
    duration: "2:45",
    url: "https://www.youtube.com/watch?v=r_g3vQZ52r4",
    embedUrl: "https://www.youtube-nocookie.com/embed/r_g3vQZ52r4?autoplay=1&enablejsapi=1",
    category: "Phonk"
  });

  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const backendUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Sync iframe volume & play state
  useEffect(() => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      const vol = Math.round(bgMusicVolume * 100);
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }),
          '*'
        );
        if (bgMusicPlaying) {
          ytIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } else {
          ytIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            '*'
          );
        }
      } catch {
        // Handled silently
      }
    }
  }, [bgMusicPlaying, bgMusicVolume, currentTrack?.id]);

  const handlePlaySpecificTrack = (track: YouTubeTrack) => {
    setCurrentTrack(track);
    setBgMusicPlaying(true);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        const newLogs: VCRequestLog[] = data.logs || [];

        if (newLogs.length > 0) {
          const newestLog = newLogs[0];
          if (
            autoPlayAudio &&
            lastProcessedLogId !== null &&
            newestLog.id !== lastProcessedLogId &&
            newestLog.status === 'success'
          ) {
            playNewIncomingAudio(newestLog);
          }
          setLastProcessedLogId(newestLog.id);
        }

        setLogs(newLogs);
        setIsOnline(true);
      }
    } catch {
      setIsOnline(false);
    }
  };

  const fetchHearLogs = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/hear-logs`);
      if (res.ok) {
        const data = await res.json();
        setHearLogs(data.hearLogs || []);
      }
    } catch {
      // Handled silently
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Handled silently
    }
  };

  const fetchCharacters = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/characters`);
      if (res.ok) {
        const data = await res.json();
        setCharacters(data.characters || []);
      }
    } catch {
      // Handled silently
    }
  };

  const playNewIncomingAudio = (log: VCRequestLog) => {
    const audioUrl = log.audioUrl || `/api/audio/${log.id}`;
    const audio = new Audio(audioUrl);
    audio.volume = ttsVolume;

    const fallbackSpeak = () => {
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        synth.cancel();
        if (synth.paused) synth.resume();
        const utterance = new SpeechSynthesisUtterance(log.text);
        synth.speak(utterance);
      }
    };

    audio.onerror = fallbackSpeak;
    audio.play().catch(fallbackSpeak);
  };

  // Poll server state every 2 seconds
  useEffect(() => {
    fetchLogs();
    fetchHearLogs();
    fetchStats();
    fetchCharacters();

    const interval = setInterval(() => {
      fetchLogs();
      fetchHearLogs();
      fetchStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoPlayAudio, lastProcessedLogId]);

  const handleClearLogs = async () => {
    try {
      await fetch(`${backendUrl}/api/logs`, { method: 'DELETE' });
      setLogs([]);
      fetchStats();
    } catch {
      // Handled silently
    }
  };

  const handleClearHearLogs = async () => {
    try {
      await fetch(`${backendUrl}/api/hear-logs`, { method: 'DELETE' });
      setHearLogs([]);
      fetchStats();
    } catch {
      // Handled silently
    }
  };

  const handleAddCharacter = async (newChar: Partial<CharacterProfile>) => {
    try {
      const res = await fetch(`${backendUrl}/api/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChar)
      });
      if (res.ok) {
        fetchCharacters();
        fetchStats();
      }
    } catch {
      // Handled silently
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/characters/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCharacters();
        fetchStats();
      }
    } catch {
      // Handled silently
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Studio Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={isOnline}
        activeRequestsCount={logs.length}
        uptimeSeconds={stats?.uptimeSeconds || 0}
      />

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Telemetry Overview */}
        <StatsOverview stats={stats} isOnline={isOnline} />

        {/* Tab View Routing */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spoken Audio Stream */}
              <LiveRequestLogs
                logs={logs}
                onClearLogs={handleClearLogs}
                onRefresh={fetchLogs}
                autoPlayAudio={autoPlayAudio}
                setAutoPlayAudio={setAutoPlayAudio}
              />

              {/* Heard VC Listener & Recognition */}
              <VcHearingFeed
                hearLogs={hearLogs}
                onClearHearLogs={handleClearHearLogs}
                onRefresh={fetchHearLogs}
                backendUrl={backendUrl}
              />
            </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <CharacterManager
            characters={characters}
            onAddCharacter={handleAddCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            backendUrl={backendUrl}
          />
        )}

        {activeTab === 'synth' && (
          <VoiceTester
            characters={characters}
            backendUrl={backendUrl}
            onSendSuccess={() => {
              fetchLogs();
              fetchStats();
            }}
          />
        )}

        {activeTab === 'audio' && (
          <YouTubeMusicPlayer
            backendUrl={backendUrl}
            currentTrack={currentTrack}
            isPlaying={bgMusicPlaying}
            onPlayTrack={handlePlaySpecificTrack}
            onStop={() => setBgMusicPlaying(false)}
            bgVolume={bgMusicVolume}
            onVolumeChange={setBgMusicVolume}
            ttsVolume={ttsVolume}
            onTtsVolumeChange={setTtsVolume}
          />
        )}
      </main>

      {/* Persistent Background Audio Stream IFrame (Hidden / Minimal) */}
      {currentTrack && (
        <div className="hidden">
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?enablejsapi=1&autoplay=1&controls=0&playsinline=1`}
            title="Background Audio Player"
            allow="autoplay"
            className="w-0 h-0"
          />
        </div>
      )}

      {/* Studio Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-mono text-zinc-500">
          Roblox VC AI Studio Engine • Multi-Voice Acoustic Profiles • Real-time HTTP Stream on Port 3000
        </div>
      </footer>

      {/* Script Verification Modal */}
      {!isVerified && <ScriptVerificationModal onVerified={() => setIsVerified(true)} />}
    </div>
  );
}
