import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Check, Copy, MessageSquare } from 'lucide-react';

interface ScriptVerificationModalProps {
  onVerified: () => void;
}

export const ScriptVerificationModal: React.FC<ScriptVerificationModalProps> = ({ onVerified }) => {
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const discordInviteUrl = 'https://discord.com/invite/3waHXGraUQ';

  const handleYes = () => {
    localStorage.setItem('roblox_vc_script_verified', 'true');
    onVerified();
  };

  const handleNo = () => {
    navigator.clipboard.writeText(discordInviteUrl).catch(() => {});
    setCopied(true);
    setErrorMsg('Discord invite link copied to clipboard! Please join the server and ping @chocolatebunnymarshmallow to purchase/verify the script.');
    
    // Open discord invite in new tab
    window.open(discordInviteUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Script License Verification Required
            </h2>
            <p className="text-xs text-zinc-400 font-mono">Roblox VC Studio Security Check</p>
          </div>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs">
          <p className="text-zinc-200 font-medium leading-relaxed">
            ⚠️ <span className="text-amber-300 font-bold">The Website Will Only Work If You Buy/Have the script.</span>
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Did you buy the script from our Discord? If yes, click <span className="text-emerald-400 font-bold">Yes</span>. If no, you must join our Discord server, purchase the script, and ping <span className="text-indigo-400 font-bold">@chocolatebunnymarshmallow</span>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-mono flex items-start space-x-2">
            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleNo}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-all border border-zinc-700 flex items-center justify-center space-x-2"
          >
            <span>No</span>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4" />}
          </button>

          <button
            onClick={handleYes}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
          >
            <span>Yes</span>
            <Check className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center pt-1">
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 underline inline-flex items-center gap-1"
          >
            <span>Discord Server: {discordInviteUrl}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
