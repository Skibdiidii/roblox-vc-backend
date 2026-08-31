import React, { useState } from 'react';
import {
  Activity,
  Mic,
  Disc,
  Users,
  Radio,
  Volume2,
  Cpu,
  Menu,
  X
} from 'lucide-react';

export type TabType = 'feed' | 'matrix' | 'synth' | 'audio';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  serverOnline: boolean;
  activeRequestsCount: number;
  uptimeSeconds: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverOnline,
  activeRequestsCount,
  uptimeSeconds
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; tag?: string }[] = [
    { id: 'feed', label: 'Live Stream Feed', icon: Radio, tag: 'LIVE' },
    { id: 'matrix', label: 'Character Voice Matrix', icon: Users, tag: 'VOICES' },
    { id: 'synth', label: 'Voice Synth Studio', icon: Mic },
    { id: 'audio', label: 'Music & DJ Deck', icon: Disc },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 font-mono font-bold text-sm tracking-wider shadow-inner">
              VC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-zinc-100 uppercase font-mono">
                  Roblox VC Studio
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 hidden sm:inline">
                  v3.4
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Port 3000 // Voice Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Controls */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[38px] ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.tag && (
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Server Telemetry Badge & Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
                }`}
              />
              <span className="text-zinc-300 text-[11px]">
                {serverOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 text-[11px]">
                {formatUptime(uptimeSeconds)}
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs font-mono">
            <span className="text-zinc-400">Server Status:</span>
            <span className={serverOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {serverOnline ? 'ONLINE' : 'OFFLINE'} ({formatUptime(uptimeSeconds)})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-mono font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900 border border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

