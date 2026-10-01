import React, { useState } from 'react';
import { BackendSettings } from '../types';
import { Settings, Save, ShieldCheck, Key, Volume2, Check, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  settings: BackendSettings;
  onSaveSettings: (newSettings: Partial<BackendSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSaveSettings }) => {
  const [ttsProvider, setTtsProvider] = useState(settings.ttsProvider || 'google_tts');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(settings.elevenLabsApiKey || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(settings.elevenLabsVoiceId || '');
  const [autoPlayAudioInBrowser, setAutoPlayAudioInBrowser] = useState(settings.autoPlayAudioInBrowser ?? true);
  const [maxTextLength, setMaxTextLength] = useState(settings.maxTextLength || 300);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    await onSaveSettings({
      ttsProvider,
      elevenLabsApiKey: elevenLabsApiKey.trim(),
      elevenLabsVoiceId: elevenLabsVoiceId.trim(),
      autoPlayAudioInBrowser,
      maxTextLength
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">VC Backend Server Settings</h2>
            <p className="text-xs text-slate-400">
              Configure Text-To-Speech engine providers, CORS options, and request limits
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* TTS Provider Selection */}
          <div className="space-y-3">
            <label className="block font-medium text-slate-200">
              Select Text-to-Speech (TTS) Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  ttsProvider === 'google_tts'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="tts"
                  value="google_tts"
                  checked={ttsProvider === 'google_tts'}
                  onChange={() => setTtsProvider('google_tts')}
                  className="mt-0.5 text-indigo-600 accent-indigo-500"
                />
                <div>
                  <p className="font-semibold text-sm">Google TTS Engine (Default)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Fast, reliable, zero-config audio streaming for all character personas.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  ttsProvider === 'elevenlabs'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="tts"
                  value="elevenlabs"
                  checked={ttsProvider === 'elevenlabs'}
                  onChange={() => setTtsProvider('elevenlabs')}
                  className="mt-0.5 text-indigo-600 accent-indigo-500"
                />
                <div>
                  <p className="font-semibold text-sm">ElevenLabs Voice AI</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ultra-realistic AI voice cloning (Requires your ElevenLabs API Key).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ElevenLabs API Key (If selected) */}
          {ttsProvider === 'elevenlabs' && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <Key className="w-4 h-4" />
                <span>ElevenLabs API Configuration</span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ElevenLabs API Key</label>
                <input
                  type="password"
                  placeholder="xi-api-key-..."
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Default ElevenLabs Voice ID</label>
                <input
                  type="text"
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Web Dashboard Playback Options */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoPlayAudioInBrowser}
                onChange={(e) => setAutoPlayAudioInBrowser(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <p className="font-semibold text-slate-200">Auto-Play Audio in Web Dashboard</p>
                <p className="text-[11px] text-slate-400">
                  Automatically play character voice audio whenever incoming voice dispatch events are triggered.
                </p>
              </div>
            </label>

            <div>
              <label className="block text-slate-300 mb-1">Maximum Text Payload Length (Characters)</label>
              <input
                type="number"
                min={50}
                max={1000}
                value={maxTextLength}
                onChange={(e) => setMaxTextLength(parseInt(e.target.value) || 300)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" />
                Settings Saved Successfully!
              </span>
            ) : (
              <span className="text-slate-500">CORS: Enabled for all origins (*).</span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
