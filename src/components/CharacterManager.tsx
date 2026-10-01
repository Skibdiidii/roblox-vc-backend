import React, { useState, useEffect } from 'react';
import { CharacterProfile, TTSVoiceOption } from '../types';
import { Users, Plus, Trash2, Volume2, Play, Pause, Sparkles, Check, Sliders } from 'lucide-react';

interface CharacterManagerProps {
  characters: CharacterProfile[];
  onAddCharacter: (newChar: Partial<CharacterProfile>) => Promise<void>;
  onDeleteCharacter: (id: string) => Promise<void>;
  backendUrl: string;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  characters,
  onAddCharacter,
  onDeleteCharacter,
  backendUrl
}) => {
  const [showModal, setShowModal] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoiceOption[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Brian');
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditioningCharId, setAuditioningCharId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`${backendUrl}/api/voices`)
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setAvailableVoices(data.voices);
        }
      })
      .catch(() => {
        // Fallback default list
        setAvailableVoices([
          { id: 'brian', name: 'Brian', displayName: 'Brian (British Void)', gender: 'male', accent: 'British', description: 'Deep, narrative British tone.', previewSample: 'Greetings from the Roblox void.' },
          { id: 'matthew', name: 'Matthew', displayName: 'Matthew (Stern Heisenberg)', gender: 'male', accent: 'US Neutral', description: 'Calculated, authoritative, gravelly voice.', previewSample: 'Say my name. We have work to do.' },
          { id: 'justin', name: 'Justin', displayName: 'Justin (Fast Hype Youth)', gender: 'male', accent: 'US Energetic', description: 'Youthful, high energy, fast-paced speech.', previewSample: 'What is up guys! Ready for the challenge!' },
          { id: 'joey', name: 'Joey', displayName: 'Joey (Chill Gamer)', gender: 'male', accent: 'US Casual', description: 'Casual, friendly everyday gamer tone.', previewSample: 'Hey everyone, just hanging out in Roblox!' },
          { id: 'geraint', name: 'Geraint', displayName: 'Geraint (Deep Dark Bass)', gender: 'male', accent: 'Welsh Deep', description: 'Sub-bass resonance, dark, commanding frequency.', previewSample: 'I am the shadows watching over this server.' },
          { id: 'joanna', name: 'Joanna', displayName: 'Joanna (Crisp AI)', gender: 'female', accent: 'US Clean', description: 'Ultra-clear, polite, articulate synthetic intelligence tone.', previewSample: 'Hello! I am your AI assistant, ready to help.' },
          { id: 'kendra', name: 'Kendra', displayName: 'Kendra (Smooth Radio)', gender: 'female', accent: 'US Broadcast', description: 'Warm, balanced broadcast-quality female voice.', previewSample: 'Broadcasting live across the Roblox Voice Chat network.' },
          { id: 'salli', name: 'Salli', displayName: 'Salli (Energetic Teen)', gender: 'female', accent: 'US Teen', description: 'Bright, cheerful, expressive female voice.', previewSample: 'Hey there! Ready to jump into the minigame?' },
          { id: 'amy', name: 'Amy', displayName: 'Amy (Refined British)', gender: 'female', accent: 'British', description: 'Elegant, polished British accent.', previewSample: 'Good day. It is a pleasure to meet you.' },
          { id: 'nicole', name: 'Nicole', displayName: 'Nicole (Australian Chill)', gender: 'female', accent: 'Australian', description: 'Laid back, friendly Australian accent.', previewSample: 'Gday mate! How are you doing today?' },
          { id: 'mizuki', name: 'Mizuki', displayName: 'Mizuki (Anime Melodic)', gender: 'female', accent: 'Japanese', description: 'High-clarity melodic anime-style voice.', previewSample: 'Konnichiwa! Let us have fun together!' },
          { id: 'hans', name: 'Hans', displayName: 'Hans (Resonant German)', gender: 'male', accent: 'German Resonant', description: 'Commanding, deep, resonant tone.', previewSample: 'Precision and efficiency are required.' }
        ]);
      });
  }, [backendUrl]);

  const handleAudition = (char: CharacterProfile) => {
    if (auditioningCharId === char.id && audioObj) {
      audioObj.pause();
      setAuditioningCharId(null);
      return;
    }

    if (audioObj) {
      audioObj.pause();
    }

    const testText = `Hello! I am ${char.name}. My designated TTS voice is ${char.voiceName || 'Brian'}.`;
    const streamUrl = `${backendUrl}/api/tts-stream?voice=${encodeURIComponent(char.voiceName || 'Brian')}&text=${encodeURIComponent(testText)}`;
    
    setAuditioningCharId(char.id);
    const audio = new Audio(streamUrl);
    setAudioObj(audio);

    const fallbackSpeak = () => {
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        synth.cancel();
        if (synth.paused) synth.resume();
        const u = new SpeechSynthesisUtterance(testText);
        u.pitch = char.pitch || 1.0;
        u.rate = char.rate || 1.0;
        synth.speak(u);
      }
      setTimeout(() => setAuditioningCharId(null), 3000);
    };

    audio.onerror = fallbackSpeak;
    audio.play().catch(fallbackSpeak);

    audio.onended = () => setAuditioningCharId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await onAddCharacter({
      name: name.trim(),
      description: description.trim() || 'Custom Roblox VC Persona',
      voiceName: selectedVoice,
      pitch,
      rate,
      category: 'custom',
      systemInstruction: systemInstruction.trim() || `You are ${name.trim()}. Speak naturally and in-character.`
    });

    setIsSubmitting(false);
    setName('');
    setDescription('');
    setSelectedVoice('Brian');
    setPitch(1.0);
    setRate(1.0);
    setSystemInstruction('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
              Character Voice Matrix
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Distinct acoustic TTS voice profiles assigned per character persona
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium px-4 py-2 rounded-lg transition-all flex items-center space-x-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Persona</span>
        </button>
      </div>

      {/* Characters Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => {
          const isAuditioning = auditioningCharId === char.id;
          const code = char.code || char.name.slice(0, 2).toUpperCase();

          return (
            <div
              key={char.id}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                {/* Character Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-mono font-bold text-xs tracking-wider">
                      {code}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-zinc-100 font-mono">{char.name}</h3>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                          {char.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{char.description}</p>
                    </div>
                  </div>

                  {char.category === 'custom' && (
                    <button
                      onClick={() => onDeleteCharacter(char.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-zinc-800 transition-colors"
                      title="Delete Persona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Voice Details Box */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">TTS Engine Voice:</span>
                    <span className="text-emerald-400 font-semibold">{char.voiceName || 'Brian'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Accent / Timbre:</span>
                    <span className="text-zinc-300">{char.voiceAccent || 'Standard'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60 text-[11px] font-mono">
                    <div className="text-zinc-400">
                      Pitch: <span className="text-zinc-200">{char.pitch || 1.0}x</span>
                    </div>
                    <div className="text-zinc-400">
                      Rate: <span className="text-zinc-200">{char.rate || 1.0}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action: Audition */}
              <button
                onClick={() => handleAudition(char)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-2 transition-all ${
                  isAuditioning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {isAuditioning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditioning Audio Stream...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audition Voice Profile</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Custom Persona Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Configure New Persona
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 font-mono text-sm"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-300 mb-1">Persona Name</label>
                <input
                  type="text"
                  placeholder="e.g. Iron Man, Rick Sanchez, Neon Ninja"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Designated TTS Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} — {v.accent} ({v.gender})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Each character receives their own dedicated acoustic voice model.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Pitch: {pitch}x</label>
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
                  <label className="block text-zinc-300 mb-1">Rate / Speed: {rate}x</label>
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

              <div>
                <label className="block text-zinc-300 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Sarcastic hero in high-tech robotic armor"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">System Prompt / Character Instructions</label>
                <textarea
                  placeholder="e.g. You are Iron Man. Speak in witty, confident, sarcastic 1-sentence replies."
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-medium hover:bg-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
