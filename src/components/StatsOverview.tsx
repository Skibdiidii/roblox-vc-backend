import React from 'react';
import { ServerStats } from '../types';
import { Volume2, Ear, Zap, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StatsOverviewProps {
  stats: ServerStats | null;
  isOnline: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isOnline }) => {
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {/* Total Spoken Streams */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-emerald-400">
          <Volume2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Spoken Streams</p>
          <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
            {stats ? stats.totalRequests : 0}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-zinc-400 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{stats ? stats.successfulRequests : 0} OK</span>
          </div>
        </div>
      </div>

      {/* Heard Voice Clips */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-cyan-400">
          <Ear className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Heard VC Clips</p>
          <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
            {stats ? stats.totalHeardClips || 0 : 0}
          </p>
          <p className="text-[10px] text-cyan-400 font-mono">
            Avg: {stats ? `${stats.avgVolumeDecibels || 0} dB` : '0 dB'}
          </p>
        </div>
      </div>

      {/* Average Latency */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-amber-400">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Average Latency</p>
          <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
            {stats ? `${stats.averageLatencyMs} ms` : '0 ms'}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">HTTP roundtrip</p>
        </div>
      </div>

      {/* Server Uptime */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-300">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Uptime</p>
          <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
            {stats ? formatUptime(stats.uptimeSeconds) : '0s'}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">Node.js / Express</p>
        </div>
      </div>

      {/* Personas & Voice Matrix */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Active Voices</p>
          <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">
            {stats ? `${stats.activeCharactersCount} Personas` : 'Loading...'}
          </p>
          <p className="text-[10px] text-indigo-400 font-mono">
            {isOnline ? 'CORS Open // READY' : 'Offline'}
          </p>
        </div>
      </div>
    </div>
  );
};
