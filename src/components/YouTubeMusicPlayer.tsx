import React, { useState, useEffect } from 'react';
import { Search, Music, Play, Square, Volume2, Sparkles, Flame, Coffee, Zap, Smile, RefreshCw, ExternalLink, Radio, Disc, Sliders } from 'lucide-react';

export interface YouTubeTrack {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views?: string;
  url: string;
  embedUrl: string;
  category?: string;
}

interface YouTubeMusicPlayerProps {
  backendUrl: string;
  currentTrack: YouTubeTrack | null;
  isPlaying: boolean;
  onPlayTrack: (track: YouTubeTrack) => void;
  onStop: () => void;
  bgVolume: number;
  onVolumeChange: (vol: number) => void;
  ttsVolume: number;
  onTtsVolumeChange: (vol: number) => void;
}

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({
  backendUrl,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onStop,
  bgVolume,
  onVolumeChange,
  ttsVolume,
  onTtsVolumeChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [customYtUrl, setCustomYtUrl] = useState('');

  // Fetch initial catalog
  useEffect(() => {
    fetchSongs('');
  }, []);

  const fetchSongs = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/yt/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tracks) {
          setSearchResults(data.tracks);
        }
      }
    } catch (err) {
      console.error('Failed to search songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchSongs(searchQuery);
    }
  };

  const handleQueryChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      try {
        const res = await fetch(`${backendUrl}/api/yt/suggestions?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions.slice(0, 5));
          }
        }
      } catch {
        // Fallback
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      fetchSongs('');
    } else {
      fetchSongs(cat);
    }
  };

  const handlePlayDirectUrl = () => {
    if (!customYtUrl.trim()) return;

    let vId = customYtUrl.trim();
    if (customYtUrl.includes('youtu.be/')) {
      vId = customYtUrl.split('youtu.be/')[1]?.split('?')[0] || vId;
    } else if (customYtUrl.includes('watch?v=')) {
      vId = customYtUrl.split('watch?v=')[1]?.split('&')[0] || vId;
    }

    const customTrack: YouTubeTrack = {
      id: vId,
      title: `Custom YouTube Track (${vId})`,
      channel: 'Direct YouTube Stream',
      duration: 'Custom',
      url: `https://www.youtube.com/watch?v=${vId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&enablejsapi=1`,
      category: 'Direct URL'
    };

    onPlayTrack(customTrack);
  };

  const categories = [
    { label: 'All Catalog', cat: 'All', icon: Sparkles },
    { label: 'Phonk', cat: 'Phonk', icon: Zap },
    { label: 'Lofi Chill', cat: 'Lofi', icon: Coffee },
    { label: 'Trap & Rap', cat: 'Trap', icon: Flame },
    { label: 'Gaming & Memes', cat: 'Roblox & Gaming', icon: Smile },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Master Header & Playing Status */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <Disc className={`w-4 h-4 ${isPlaying ? 'text-emerald-400 animate-spin' : 'text-zinc-400'}`} />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
                Studio Music Engine & DJ Deck
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Synchronized YouTube background audio stream routed to Roblox Voice Chat
            </p>
          </div>

          {/* Quick Play Status Pill */}
          <div className="flex items-center space-x-3">
            {isPlaying && currentTrack ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="truncate max-w-[200px]">{currentTrack.title}</span>
                <button
                  onClick={onStop}
                  className="p-1 hover:bg-zinc-800 rounded text-rose-400 ml-1"
                  title="Stop Playback"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>
            ) : (
              <div className="text-xs font-mono text-zinc-500 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                DJ DECK IDLE
              </div>
            )}
          </div>
        </div>

        {/* Dual Master Mixer Faders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300 mb-1.5">
              <span>Background Music Volume:</span>
              <span className="text-emerald-400 font-bold">{Math.round(bgVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bgVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300 mb-1.5">
              <span>VC Voice Speech Volume:</span>
              <span className="text-indigo-400 font-bold">{Math.round(ttsVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ttsVolume}
              onChange={(e) => onTtsVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Search Bar & Direct Stream URL */}
        <div className="space-y-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search any YouTube song, artist, phonk, or soundtrack..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-24 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(sug);
                    setSuggestions([]);
                    fetchSongs(sug);
                  }}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Genre Category Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.cat;
              return (
                <button
                  key={cat.cat}
                  onClick={() => handleCategoryClick(cat.cat)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Track Results List (No Images / Clean Minimal Layout) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
          <span>Results Catalog ({searchResults.length} Tracks)</span>
          <span>InnerTube & YouTube Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {searchResults.map((track) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;

            return (
              <div
                key={track.id}
                className={`bg-zinc-900/80 border transition-all rounded-xl p-3.5 flex items-center justify-between gap-3 ${
                  isThisPlaying
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isThisPlaying ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-medium text-zinc-100 truncate">
                      {track.title}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                      <span className="truncate text-zinc-300">{track.channel}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{track.duration}</span>
                      {track.category && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400/80">{track.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isThisPlaying ? (
                    <button
                      onClick={onStop}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-medium flex items-center space-x-1.5"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      <span>Play</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
