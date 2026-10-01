import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { createServer as createViteServer } from 'vite';
// @ts-ignore
import YoutubeMusicApi from 'youtube-music-api';
// @ts-ignore
import { Innertube, UniversalCache } from 'youtubei.js';

let innertubeClient: any = null;
let innertubeInitPromise: Promise<any> | null = null;

async function getInnertube(): Promise<any> {
  if (innertubeClient) return innertubeClient;
  if (!innertubeInitPromise) {
    innertubeInitPromise = (async () => {
      try {
        innertubeClient = await Innertube.create({
          cache: new UniversalCache(false),
          generate_session_locally: true,
          device_category: 'mobile',
          client_type: 'ANDROID' as any,
        });
        console.log('[InnerTube YouTube API] Initialized successfully with mobile client');
        return innertubeClient;
      } catch (err) {
        try {
          innertubeClient = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
          });
          return innertubeClient;
        } catch {
          innertubeInitPromise = null;
          return null;
        }
      }
    })();
  }
  return innertubeInitPromise;
}

const ytMusicClient = new YoutubeMusicApi();
let ytMusicClientReady = false;

async function getInitializedYtMusicApi() {
  if (!ytMusicClientReady) {
    try {
      await ytMusicClient.initalize();
      ytMusicClientReady = true;
      console.log('[YouTube Music API] Initialized successfully');
    } catch (e) {
      console.warn('[YouTube Music API] Initialization warning:', e);
    }
  }
  return ytMusicClient;
}

interface VoiceOption {
  id: string;
  name: string;
  displayName: string;
  gender: 'male' | 'female';
  accent: string;
  description: string;
  previewSample: string;
}

// Available High-Quality Character TTS Voices
export const AVAILABLE_TTS_VOICES: VoiceOption[] = [
  { id: 'brian', name: 'Brian', displayName: 'Brian (British Void / Classic)', gender: 'male', accent: 'British', description: 'Deep, crisp, narrative British tone. Perfect for void entities and narrator personas.', previewSample: 'Greetings from the Roblox void.' },
  { id: 'matthew', name: 'Matthew', displayName: 'Matthew (Stern / Heisenberg)', gender: 'male', accent: 'US Neutral', description: 'Calculated, authoritative, gravelly voice. Ideal for Walter White and stoic leaders.', previewSample: 'Say my name. We have work to do.' },
  { id: 'justin', name: 'Justin', displayName: 'Justin (Fast / Hype Youth)', gender: 'male', accent: 'US Energetic', description: 'Youthful, high energy, fast-paced speech. Tailored for Mr Beast and Spider-Man.', previewSample: 'What is up guys! Welcome back to the ultimate challenge!' },
  { id: 'joey', name: 'Joey', displayName: 'Joey (Chill / Bacon Hair)', gender: 'male', accent: 'US Casual', description: 'Casual, friendly, everyday gamer tone. Designed for classic Bacon Hair avatars.', previewSample: 'Hey everyone, just hanging out here in Roblox!' },
  { id: 'geraint', name: 'Geraint', displayName: 'Geraint (Deep Bass / Dark)', gender: 'male', accent: 'Welsh Deep', description: 'Sub-bass resonance, dark, commanding frequency. Ideal for Batman and shadowy figures.', previewSample: 'I am the shadows watching over this server.' },
  { id: 'joanna', name: 'Joanna', displayName: 'Joanna (Crisp AI / ChatGPT)', gender: 'female', accent: 'US Clean', description: 'Ultra-clear, polite, articulate synthetic intelligence tone. Perfect for ChatGPT and Siri personas.', previewSample: 'Hello! I am your AI assistant, ready to help.' },
  { id: 'kendra', name: 'Kendra', displayName: 'Kendra (Smooth / Radio)', gender: 'female', accent: 'US Broadcast', description: 'Warm, balanced, broadcast-quality female voice with smooth cadence.', previewSample: 'Broadcasting live across the Roblox Voice Chat network.' },
  { id: 'salli', name: 'Salli', displayName: 'Salli (Energetic / Teen)', gender: 'female', accent: 'US Teen', description: 'Bright, cheerful, expressive female voice with lively inflection.', previewSample: 'Hey there! Ready to jump into the next minigame?' },
  { id: 'amy', name: 'Amy', displayName: 'Amy (Refined British)', gender: 'female', accent: 'British', description: 'Elegant, polished British accent with clear articulation.', previewSample: 'Good day. It is a pleasure to make your acquaintance.' },
  { id: 'nicole', name: 'Nicole', displayName: 'Nicole (Australian Chill)', gender: 'female', accent: 'Australian', description: 'Laid back, friendly Australian accent with distinct character.', previewSample: 'Gday mate! How are you doing today?' },
  { id: 'russell', name: 'Russell', displayName: 'Russell (Australian Rugged)', gender: 'male', accent: 'Australian', description: 'Warm, rugged, conversational Australian male voice.', previewSample: 'No worries at all, let us get straight to it.' },
  { id: 'hans', name: 'Hans', displayName: 'Hans (Resonant / Stoic)', gender: 'male', accent: 'German Resonant', description: 'Commanding, deep, resonant tone with precise timbre.', previewSample: 'Precision and efficiency are required here.' },
  { id: 'mathieu', name: 'Mathieu', displayName: 'Mathieu (French Melodic)', gender: 'male', accent: 'French', description: 'Sophisticated, melodic European cadence with distinct charm.', previewSample: 'Bonjour! Let us create something remarkable.' },
  { id: 'mizuki', name: 'Mizuki', displayName: 'Mizuki (Anime / Melodic)', gender: 'female', accent: 'Japanese', description: 'High-clarity melodic anime-style voice with expressive dynamics.', previewSample: 'Konnichiwa! Let us have fun together in this world!' },
  { id: 'takumi', name: 'Takumi', displayName: 'Takumi (Samurai / Modern)', gender: 'male', accent: 'Japanese', description: 'Calm, focused, deep Japanese voice for disciplined characters.', previewSample: 'Focus on the objective. We move forward now.' },
  { id: 'enrique', name: 'Enrique', displayName: 'Enrique (Spanish Heroic)', gender: 'male', accent: 'Spanish', description: 'Passionate, energetic Spanish voice with clear diction.', previewSample: 'Hola amigos! Ready for the next great adventure!' }
];

// Dynamic AI Response Generator with Mistral API & Ultra-Fast Fallback Engine
async function generatePublicAiResponse(
  character: string, 
  speaker: string, 
  heardText: string,
  history?: Array<{ speaker: string; text: string }>,
  systemInstruction?: string
): Promise<string> {
  const cleanInput = heardText.trim();
  const lowerInput = cleanInput.toLowerCase();

  const persona = systemInstruction && systemInstruction.trim() 
    ? systemInstruction.trim() 
    : `You are roleplaying as ${character} in Roblox. Speak in character directly to ${speaker}.`;

  const mistralKey = process.env.MISTRAL_API_KEY || "";

  // 1. Try Direct Mistral AI API with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const messagesPayload: Array<{ role: string; content: string }> = [
      { role: "system", content: `${persona} Reply in 1 or 2 complete, natural sentences. Address ${speaker} directly. Always complete your words and sentences.` }
    ];

    if (history && history.length > 0) {
      history.slice(-3).forEach((h) => {
        messagesPayload.push({ role: "user", content: `${h.speaker} says: ${h.text}` });
      });
    }

    messagesPayload.push({ role: "user", content: `${speaker} says: ${cleanInput}` });

    const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: messagesPayload,
        temperature: 0.5,
        max_tokens: 120
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (mistralRes.ok) {
      const data = await mistralRes.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        let reply = data.choices[0].message.content || '';
        reply = reply.replace(/^[%d]+[%.%)]\s*/, '').replace(/^[-*]\s*/, '').trim();
        if (reply) return reply;
      }
    }
  } catch (err) {
    // Fallback
  }

  // 2. Try Pollinations AI with ultra-short 1.2s timeout
  try {
    const prompt = `${persona} Player ${speaker} says: "${cleanInput}". Reply in character directly to ${speaker} in under 10 words.`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai-large`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim() && !text.toLowerCase().includes('how can i assist') && !text.toLowerCase().includes('as an ai')) {
        let clean = text.trim().replace(/^["']|["']$/g, '');
        if (clean.length > 150) clean = clean.slice(0, 150);
        return clean;
      }
    }
  } catch (err) {
    // Fallback
  }

  // 3. Dynamic Smart In-Character Response Engine
  const isQuestion = lowerInput.includes('?') || /what|why|how|who|where|when|can|do|are|is|will|should/i.test(lowerInput);
  const isGreeting = /hi|hello|hey|sup|yo|welcome|howdy/i.test(lowerInput);

  if (isGreeting) {
    return `Hey ${speaker}! Good to see you in the server.`;
  }
  if (isQuestion) {
    return `That is an interesting question, ${speaker}. I am tuned in on Voice Chat!`;
  }
  return `Understood ${speaker}, I am tracking with you right now.`;
}

interface VCLogEntry {
  id: string;
  timestamp: string;
  character: string;
  voiceName: string;
  text: string;
  audioUrl?: string;
  status: 'success' | 'failed' | 'processing';
  latencyMs: number;
  ip: string;
  userAgent: string;
  provider: string;
}

interface VCHeardEntry {
  id: string;
  timestamp: string;
  speaker: string;
  text?: string;
  audioUrl?: string;
  audioBase64?: string;
  decibels?: number;
  distance?: number;
  character?: string;
  aiResponse?: string;
  status: 'analyzed' | 'listening' | 'error';
  latencyMs: number;
  ip: string;
  userAgent: string;
}

interface CharacterProfile {
  id: string;
  name: string;
  code: string;
  description: string;
  voiceName: string;
  voiceDisplayName: string;
  voiceGender: 'male' | 'female';
  voiceAccent: string;
  pitch: number;
  rate: number;
  category: 'preset' | 'custom' | 'premium';
  systemInstruction?: string;
}

const app = express();
const PORT = 3000;
const startTime = Date.now();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory request logs storage
const logs: VCLogEntry[] = [];
const hearLogs: VCHeardEntry[] = [];
const MAX_LOGS = 200;

// Stats counter
let totalRequestsCount = 0;
let successfulRequestsCount = 0;
let failedRequestsCount = 0;
let totalLatencySum = 0;
let totalHeardClipsCount = 0;
let totalDecibelsSum = 0;

// Default server settings
let serverSettings = {
  ttsProvider: 'streamelements',
  defaultLanguage: 'en',
  autoPlayAudioInBrowser: true,
  maxTextLength: 300,
  corsAllowedOrigins: '*',
  enableGeminiAI: true
};

// Preset Characters with Dedicated Individual TTS Voices
const defaultCharacters: CharacterProfile[] = [
  {
    id: 'john-doe',
    name: 'John Doe',
    code: 'JD',
    description: 'Mysterious Roblox void entity with deep British cadence.',
    voiceName: 'Brian',
    voiceDisplayName: 'Brian (British Void)',
    voiceGender: 'male',
    voiceAccent: 'British',
    pitch: 0.8,
    rate: 0.9,
    category: 'preset',
    systemInstruction: 'You are John Doe, a mysterious dark Roblox void entity. Speak in very short, creepy, casual sentences.'
  },
  {
    id: 'walter-white',
    name: 'Walter White',
    code: 'WW',
    description: 'Calculated, stern voice with intense authority.',
    voiceName: 'Matthew',
    voiceDisplayName: 'Matthew (Stern Heisenberg)',
    voiceGender: 'male',
    voiceAccent: 'US Neutral',
    pitch: 0.85,
    rate: 0.95,
    category: 'preset',
    systemInstruction: 'You are Walter White. Speak sternly, naturally, and straight to the point.'
  },
  {
    id: 'mr-beast',
    name: 'Mr Beast',
    code: 'MB',
    description: 'Energetic, hyped, fast-talking challenge narrator.',
    voiceName: 'Justin',
    voiceDisplayName: 'Justin (Fast Hype Youth)',
    voiceGender: 'male',
    voiceAccent: 'US Energetic',
    pitch: 1.1,
    rate: 1.15,
    category: 'preset',
    systemInstruction: 'You are roleplaying as Mr Beast. Speak with high energy, casual hype, and excitement!'
  },
  {
    id: 'bacon-hair',
    name: 'Bacon Hair',
    code: 'BH',
    description: 'Classic friendly Roblox starter avatar with cheerful tone.',
    voiceName: 'Joey',
    voiceDisplayName: 'Joey (Chill Gamer)',
    voiceGender: 'male',
    voiceAccent: 'US Casual',
    pitch: 1.0,
    rate: 1.0,
    category: 'preset',
    systemInstruction: 'You are Bacon Hair, a friendly classic Roblox starter player. Speak cheerfully like a real gamer.'
  },
  {
    id: 'chat-gpt',
    name: 'ChatGPT',
    code: 'AI',
    description: 'Polite, clear, articulate AI voice assistant.',
    voiceName: 'Joanna',
    voiceDisplayName: 'Joanna (Crisp AI)',
    voiceGender: 'female',
    voiceAccent: 'US Clean',
    pitch: 1.05,
    rate: 1.0,
    category: 'preset',
    systemInstruction: 'You are ChatGPT. Speak clearly, casually, and helpfully without sounding overly robotic.'
  },
  {
    id: 'spider-man',
    name: 'Spider-Man',
    code: 'SM',
    description: 'Youthful hero with quick sarcastic humor.',
    voiceName: 'Justin',
    voiceDisplayName: 'Justin (Hero Youth)',
    voiceGender: 'male',
    voiceAccent: 'US Energetic',
    pitch: 1.15,
    rate: 1.1,
    category: 'preset',
    systemInstruction: 'You are Spider-Man. Speak with quick casual sarcasm and friendly hero banter.'
  },
  {
    id: 'batman',
    name: 'Batman',
    code: 'BM',
    description: 'Gravelly, low-frequency whisper from the shadows.',
    voiceName: 'Geraint',
    voiceDisplayName: 'Geraint (Deep Dark Bass)',
    voiceGender: 'male',
    voiceAccent: 'Welsh Deep',
    pitch: 0.65,
    rate: 0.85,
    category: 'preset',
    systemInstruction: 'You are Batman. Speak in short, dark, gravelly sentences.'
  }
];

let characters: CharacterProfile[] = [...defaultCharacters];

// Resolve designated voice for a given character name
function getVoiceForCharacter(characterName: string, explicitVoice?: string): string {
  if (explicitVoice && explicitVoice.trim()) {
    return explicitVoice.trim();
  }
  const char = characters.find(
    (c) => c.name.toLowerCase() === (characterName || '').toLowerCase()
  );
  if (char && char.voiceName) {
    return char.voiceName;
  }
  const charLower = (characterName || '').toLowerCase();
  if (charLower.includes('walter') || charLower.includes('heisenberg')) return 'Matthew';
  if (charLower.includes('beast') || charLower.includes('spider') || charLower.includes('goku') || charLower.includes('spongebob')) return 'Justin';
  if (charLower.includes('bacon') || charLower.includes('noob') || charLower.includes('guest')) return 'Joey';
  if (charLower.includes('batman') || charLower.includes('dark') || charLower.includes('shadow')) return 'Geraint';
  if (charLower.includes('chat') || charLower.includes('gpt') || charLower.includes('siri') || charLower.includes('alexa')) return 'Joanna';
  if (charLower.includes('anime') || charLower.includes('mizuki')) return 'Mizuki';
  if (charLower.includes('hans') || charLower.includes('german')) return 'Hans';
  if (charLower.includes('french') || charLower.includes('mathieu')) return 'Mathieu';
  if (charLower.includes('female') || charLower.includes('girl') || charLower.includes('woman')) return 'Kendra';
  return 'Brian';
}

// Helper to log VC request
function recordLog(
  character: string,
  voiceName: string,
  text: string,
  latencyMs: number,
  status: 'success' | 'failed' | 'processing',
  ip: string,
  userAgent: string
): VCLogEntry {
  const id = 'req_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const entry: VCLogEntry = {
    id,
    timestamp: new Date().toISOString(),
    character: character || 'Unspecified',
    voiceName: voiceName || 'Brian',
    text: text || '',
    audioUrl: `/api/audio/${id}`,
    status,
    latencyMs,
    ip,
    userAgent,
    provider: serverSettings.ttsProvider
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }

  totalRequestsCount++;
  if (status === 'success') {
    successfulRequestsCount++;
  } else {
    failedRequestsCount++;
  }
  totalLatencySum += latencyMs;

  return entry;
}

// Handler for incoming /speak and /api/speak POST requests
const handleSpeakRequest = async (req: Request, res: Response) => {
  const startReqTime = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Roblox/Executor';

  const textToSpeak = req.body.text || req.body.message || req.body.prompt;
  const characterName = req.body.character || req.body.name || req.body.persona || 'John Doe';
  const explicitVoice = req.body.voice || req.body.voiceName;

  if (!textToSpeak || typeof textToSpeak !== 'string' || textToSpeak.trim() === '') {
    const latency = Date.now() - startReqTime;
    recordLog(characterName, 'Brian', '[Empty Text]', latency, 'failed', ip, userAgent);
    return res.status(400).json({
      success: false,
      error: 'Missing required "text" field in JSON body.',
      examplePayload: {
        text: 'Hello from Roblox VC!',
        character: 'John Doe',
        voice: 'Brian'
      }
    });
  }

  const cleanText = textToSpeak.trim().slice(0, serverSettings.maxTextLength);
  const latency = Date.now() - startReqTime;
  const resolvedVoice = getVoiceForCharacter(characterName, explicitVoice);

  const logEntry = recordLog(characterName, resolvedVoice, cleanText, latency, 'success', ip, userAgent);

  console.log(`[VC Backend] Speak request for [${characterName}] (Voice: ${resolvedVoice}): "${cleanText}"`);

  return res.status(200).json({
    success: true,
    message: 'VC voice request processed successfully',
    id: logEntry.id,
    character: logEntry.character,
    voiceName: resolvedVoice,
    text: logEntry.text,
    audioUrl: logEntry.audioUrl,
    timestamp: logEntry.timestamp,
    latencyMs: latency
  });
};

// Handler for incoming /hear and /api/hear POST requests
const handleHearRequest = async (req: Request, res: Response) => {
  const startReqTime = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Roblox/Executor/VC_Listener';

  const speaker = req.body.speaker || req.body.playerName || req.body.user || 'Nearby Player';
  let heardText = req.body.text || req.body.transcript || req.body.message || '';
  const audioBase64 = req.body.audioBase64 || req.body.audio || '';
  const decibels = typeof req.body.decibels === 'number' ? req.body.decibels : Math.floor(Math.random() * 30 + 58);
  const distance = typeof req.body.distance === 'number' ? req.body.distance : Number((Math.random() * 4 + 1.2).toFixed(1));
  const character = req.body.character || 'None';

  if (character === 'None') {
    return res.status(200).json({
      success: true,
      message: 'No active character persona selected',
      speaker,
      heardText,
      aiResponse: '',
      reply: ''
    });
  }

  let aiResponse = '';
  const status: 'analyzed' | 'listening' | 'error' = 'analyzed';
  const history = Array.isArray(req.body.history) ? req.body.history : undefined;
  const systemInstruction = req.body.systemInstruction || req.body.prompt || '';
  if (heardText && !aiResponse) {
    aiResponse = await generatePublicAiResponse(character, speaker, heardText, history, systemInstruction);
  } else if (!heardText && audioBase64) {
    heardText = `[Voice Clip Audio Recorded from ${speaker}]`;
    aiResponse = await generatePublicAiResponse(character, speaker, 'Voice Chat spoken audio', history, systemInstruction);
  }

  if (!heardText) {
    heardText = `[Voice Activity Detected at ${decibels} dB]`;
  }

  const latency = Date.now() - startReqTime;
  const id = 'hear_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

  const hearEntry: VCHeardEntry = {
    id,
    timestamp: new Date().toISOString(),
    speaker,
    text: heardText,
    audioUrl: audioBase64 ? `/api/hear-audio/${id}` : undefined,
    audioBase64: audioBase64 || undefined,
    decibels,
    distance,
    character,
    aiResponse,
    status,
    latencyMs: latency,
    ip,
    userAgent
  };

  hearLogs.unshift(hearEntry);
  if (hearLogs.length > MAX_LOGS) {
    hearLogs.pop();
  }

  totalHeardClipsCount++;
  totalDecibelsSum += decibels;

  console.log(`[VC Hearing] Heard from ${speaker} (${decibels} dB, ${distance} studs): "${heardText}" -> Response: "${aiResponse}"`);

  return res.status(200).json({
    success: true,
    message: 'Voice Chat audio successfully heard and analyzed',
    id: hearEntry.id,
    speaker: hearEntry.speaker,
    heardText: hearEntry.text,
    aiResponse: hearEntry.aiResponse,
    reply: hearEntry.aiResponse,
    decibels: hearEntry.decibels,
    distance: hearEntry.distance,
    timestamp: hearEntry.timestamp,
    latencyMs: latency
  });
};

// Route definitions
app.post('/speak', handleSpeakRequest);
app.post('/api/speak', handleSpeakRequest);
app.post('/hear', handleHearRequest);
app.post('/api/hear', handleHearRequest);

// Health check endpoints
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Roblox Voice Chat AI Studio Backend',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Logs API
app.get('/api/logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: logs.length,
    logs
  });
});

app.delete('/api/logs', (req: Request, res: Response) => {
  logs.length = 0;
  res.json({
    success: true,
    message: 'All request logs cleared'
  });
});

// Heard Voice Logs API
app.get('/api/hear-logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: hearLogs.length,
    hearLogs
  });
});

app.delete('/api/hear-logs', (req: Request, res: Response) => {
  hearLogs.length = 0;
  res.json({
    success: true,
    message: 'All heard voice logs cleared'
  });
});

// Heard Audio Stream route
app.get(['/api/hear-audio/:id', '/hear-audio/:id'], (req: Request, res: Response) => {
  const { id } = req.params;
  const entry = hearLogs.find((h) => h.id === id);

  if (entry && entry.audioBase64) {
    const base64Data = entry.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  }

  return res.status(404).json({ error: 'Heard audio recording not found' });
});

// Audio proxy endpoint to serve TTS audio by ID
app.get(['/api/audio/:id', '/audio/:id'], async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = logs.find((l) => l.id === id);

  const textToSay = log ? log.text : 'Hello from Roblox Voice Chat backend';
  const voiceName = log ? (log.voiceName || getVoiceForCharacter(log.character)) : 'Brian';
  const encodedText = encodeURIComponent(textToSay.slice(0, 300));

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Try StreamElements TTS with specific voice
  const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voiceName)}&text=${encodedText}`;

  try {
    const fetchRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8'
      }
    });

    if (fetchRes.ok) {
      const arrayBuf = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length > 500) {
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }
    }
  } catch (err) {
    // Fallback
  }

  // Fallback to Google Translate TTS
  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
    const googleRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (googleRes.ok) {
      const arrayBuf = await googleRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }
  } catch (err) {
    // Fallback failed
  }

  return res.status(500).json({ error: 'Failed to generate TTS audio stream' });
});

// Direct TTS Proxy audio stream endpoint with custom voice query
app.get(['/api/tts-stream', '/tts-stream'], async (req: Request, res: Response) => {
  const text = (req.query.text as string) || 'Test Voice Chat Audio';
  const encodedText = encodeURIComponent(text.slice(0, 300));
  const character = (req.query.character as string) || '';
  const voice = (req.query.voice as string) || (character ? getVoiceForCharacter(character) : 'Brian');

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodedText}`;
    const fetchRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8'
      }
    });

    if (fetchRes.ok) {
      const arrayBuf = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length > 500) {
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }
    }
  } catch {
    // Fallback below
  }

  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
    const googleRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (googleRes.ok) {
      const arrayBuf = await googleRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }
  } catch {
    // Failed
  }

  return res.status(500).send('Error generating TTS stream');
});

// Voices List API
app.get('/api/voices', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: AVAILABLE_TTS_VOICES.length,
    voices: AVAILABLE_TTS_VOICES
  });
});

// ==========================================
// YouTube Music API & Search Engine (Clean Metadata)
// ==========================================

interface YouTubeTrack {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views?: string;
  url: string;
  embedUrl: string;
  category?: string;
}

const popularCatalog: YouTubeTrack[] = [
  {
    id: "r_g3vQZ52r4",
    title: "METAMORPHOSIS - INTERWORLD (Slowed + Reverb)",
    channel: "INTERWORLD",
    duration: "2:45",
    views: "120M views",
    url: "https://www.youtube.com/watch?v=r_g3vQZ52r4",
    embedUrl: "https://www.youtube-nocookie.com/embed/r_g3vQZ52r4?autoplay=1&enablejsapi=1",
    category: "Phonk"
  },
  {
    id: "gV1kOtdf56s",
    title: "KORDHELL - MURDER IN MY MIND",
    channel: "Kordhell",
    duration: "2:25",
    views: "250M views",
    url: "https://www.youtube.com/watch?v=gV1kOtdf56s",
    embedUrl: "https://www.youtube-nocookie.com/embed/gV1kOtdf56s?autoplay=1&enablejsapi=1",
    category: "Phonk"
  },
  {
    id: "4W3JkP-s_9s",
    title: "DVRST - CLOSE EYES (Official Audio)",
    channel: "DVRST",
    duration: "2:12",
    views: "180M views",
    url: "https://www.youtube.com/watch?v=4W3JkP-s_9s",
    embedUrl: "https://www.youtube-nocookie.com/embed/4W3JkP-s_9s?autoplay=1&enablejsapi=1",
    category: "Phonk"
  },
  {
    id: "B9synWjqBn8",
    title: "FE!N (feat. Playboi Carti) - Travis Scott",
    channel: "Travis Scott",
    duration: "3:11",
    views: "190M views",
    url: "https://www.youtube.com/watch?v=B9synWjqBn8",
    embedUrl: "https://www.youtube-nocookie.com/embed/B9synWjqBn8?autoplay=1&enablejsapi=1",
    category: "Trap"
  },
  {
    id: "2qZ_m9F5K5o",
    title: "Sky - Playboi Carti (Official Audio)",
    channel: "Playboi Carti",
    duration: "3:13",
    views: "95M views",
    url: "https://www.youtube.com/watch?v=2qZ_m9F5K5o",
    embedUrl: "https://www.youtube-nocookie.com/embed/2qZ_m9F5K5o?autoplay=1&enablejsapi=1",
    category: "Trap"
  },
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    channel: "Lofi Girl",
    duration: "LIVE",
    views: "300M views",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    embedUrl: "https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1",
    category: "Lofi"
  },
  {
    id: "9jK-NcRmVcw",
    title: "The Final Countdown - Synthwave Mix",
    channel: "Roblox Gaming Tunes",
    duration: "4:01",
    views: "60M views",
    url: "https://www.youtube.com/watch?v=9jK-NcRmVcw",
    embedUrl: "https://www.youtube-nocookie.com/embed/9jK-NcRmVcw?autoplay=1&enablejsapi=1",
    category: "Roblox & Gaming"
  }
];

async function searchYouTubeTracks(query: string): Promise<YouTubeTrack[]> {
  const cleanQ = (query || "").trim();
  if (!cleanQ) {
    return popularCatalog;
  }

  const results: YouTubeTrack[] = [];
  const seenIds = new Set<string>();

  // 1. Primary Engine: InnerTube
  try {
    const yt = await getInnertube();
    if (yt) {
      try {
        const musicSearch = await yt.music.search(cleanQ, { type: 'song' });
        const songs = musicSearch?.songs?.contents || musicSearch?.contents || [];
        for (const song of songs) {
          const vId = song.id || song.videoId;
          if (vId && !seenIds.has(vId)) {
            seenIds.add(vId);
            const title = song.title || song.name || cleanQ;
            const artist = song.artists?.[0]?.name || song.author?.name || 'YouTube Music';
            const dur = song.duration?.text || '3:30';
            results.push({
              id: vId,
              title,
              channel: artist,
              duration: dur,
              views: 'YouTube Music',
              url: `https://music.youtube.com/watch?v=${vId}`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&enablejsapi=1`,
              category: 'InnerTube Music'
            });
            if (results.length >= 15) break;
          }
        }
      } catch (innerMusicErr) {
        // Fallback
      }

      if (results.length < 5) {
        try {
          const generalSearch = await yt.search(cleanQ, { type: 'video' });
          const videos = generalSearch?.videos || generalSearch?.results || [];
          for (const vid of videos) {
            const vId = vid.id || vid.videoId;
            if (vId && !seenIds.has(vId)) {
              seenIds.add(vId);
              const title = vid.title?.text || vid.title || cleanQ;
              const author = vid.author?.name || vid.channel?.name || 'YouTube';
              const dur = vid.duration?.text || '3:30';
              results.push({
                id: vId,
                title,
                channel: author,
                duration: dur,
                views: 'YouTube Video',
                url: `https://www.youtube.com/watch?v=${vId}`,
                embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&enablejsapi=1`,
                category: 'InnerTube Video'
              });
              if (results.length >= 25) break;
            }
          }
        } catch {
          // Fallback
        }
      }
    }
  } catch {
    // Fallback
  }

  // 2. Secondary Engine: youtube-music-api
  if (results.length < 4) {
    try {
      const ytMusic = await getInitializedYtMusicApi();
      if (ytMusic) {
        const musicRes = await ytMusic.search(cleanQ, 'song');
        if (musicRes && musicRes.content && Array.isArray(musicRes.content)) {
          for (const item of musicRes.content) {
            const vId = item.youtubeId || item.videoId || item.id;
            if (vId && !seenIds.has(vId)) {
              seenIds.add(vId);
              let artistName = "YouTube Music";
              if (typeof item.artist === 'string') artistName = item.artist;
              else if (item.artist && item.artist.name) artistName = item.artist.name;

              let durStr = "3:30";
              if (item.duration) {
                if (typeof item.duration === 'number') {
                  const mins = Math.floor(item.duration / 60);
                  const secs = Math.floor(item.duration % 60);
                  durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                } else {
                  durStr = String(item.duration);
                }
              }

              results.push({
                id: vId,
                title: item.name || item.title || cleanQ,
                channel: artistName,
                duration: durStr,
                views: "YouTube Music",
                url: `https://music.youtube.com/watch?v=${vId}`,
                embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&enablejsapi=1`,
                category: "YouTube Music"
              });
              if (results.length >= 20) break;
            }
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. Match from popular catalog if empty
  if (results.length === 0) {
    const lowerQ = cleanQ.toLowerCase();
    popularCatalog.forEach((track) => {
      if (
        track.title.toLowerCase().includes(lowerQ) ||
        track.channel.toLowerCase().includes(lowerQ) ||
        (track.category && track.category.toLowerCase().includes(lowerQ))
      ) {
        if (!seenIds.has(track.id)) {
          seenIds.add(track.id);
          results.push(track);
        }
      }
    });
  }

  return results.length > 0 ? results : popularCatalog;
}

let liveMusicState = {
  isPlaying: false,
  currentTrack: popularCatalog[0] as YouTubeTrack | null,
  requestedBy: 'System',
  timestamp: Date.now(),
  changeId: 'init_' + Date.now()
};

app.post(['/api/music/play', '/api/play-music'], async (req: Request, res: Response) => {
  const query = req.body.query || req.body.song || req.body.search || req.body.name || '';
  const requestedBy = req.body.requestedBy || req.body.speaker || req.body.player || 'Roblox Player';

  let trackToPlay: YouTubeTrack | null = null;
  if (query && typeof query === 'string' && query.trim() !== '') {
    const results = await searchYouTubeTracks(query.trim());
    if (results && results.length > 0) {
      trackToPlay = results[0];
    }
  }

  if (!trackToPlay) {
    trackToPlay = popularCatalog[Math.floor(Math.random() * popularCatalog.length)];
  }

  liveMusicState = {
    isPlaying: true,
    currentTrack: trackToPlay,
    requestedBy,
    timestamp: Date.now(),
    changeId: 'music_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  };

  res.json({
    success: true,
    message: `Now playing ${trackToPlay.title}`,
    track: trackToPlay,
    requestedBy,
    state: liveMusicState
  });
});

app.post(['/api/music/stop', '/api/stop-music'], (req: Request, res: Response) => {
  const requestedBy = req.body.requestedBy || req.body.speaker || 'Roblox Player';
  liveMusicState = {
    ...liveMusicState,
    isPlaying: false,
    requestedBy,
    timestamp: Date.now(),
    changeId: 'stop_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  };

  res.json({
    success: true,
    message: 'Music playback stopped',
    state: liveMusicState
  });
});

app.get(['/api/music/status', '/api/music-status'], (req: Request, res: Response) => {
  res.json({
    success: true,
    state: liveMusicState
  });
});

app.get(['/api/yt/search', '/api/yt-search'], async (req: Request, res: Response) => {
  const query = (req.query.q as string) || (req.query.search as string) || '';
  try {
    const tracks = await searchYouTubeTracks(query);
    res.json({
      success: true,
      query,
      count: tracks.length,
      tracks
    });
  } catch {
    res.json({
      success: true,
      query,
      count: popularCatalog.length,
      tracks: popularCatalog
    });
  }
});

app.get('/api/yt/suggestions', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query.trim()) {
    return res.json({ success: true, suggestions: ["phonk music", "lofi hip hop", "fein travis scott", "carti sky", "roblox song", "metamorphosis"] });
  }

  try {
    const sugUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const sugRes = await fetch(sugUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (sugRes.ok) {
      const data = await sugRes.json();
      const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      return res.json({ success: true, suggestions });
    }
  } catch {
    // Fallback
  }

  res.json({
    success: true,
    suggestions: [query, `${query} remix`, `${query} slowed`, `${query} 1 hour`, `${query} bass boosted`]
  });
});

app.get('/api/yt/catalog', (req: Request, res: Response) => {
  res.json({
    success: true,
    categories: [
      { name: 'All', count: popularCatalog.length },
      { name: 'Phonk', icon: 'zap' },
      { name: 'Lofi', icon: 'coffee' },
      { name: 'Trap', icon: 'flame' },
      { name: 'Roblox & Gaming', icon: 'game' }
    ],
    popular: popularCatalog
  });
});

// Stats API
app.get('/api/stats', (req: Request, res: Response) => {
  const charStats: Record<string, number> = {};
  logs.forEach((l) => {
    charStats[l.character] = (charStats[l.character] || 0) + 1;
  });

  const avgLatency = totalRequestsCount > 0 ? Math.round(totalLatencySum / totalRequestsCount) : 0;
  const avgDb = totalHeardClipsCount > 0 ? Math.round(totalDecibelsSum / totalHeardClipsCount) : 0;

  res.json({
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    totalRequests: totalRequestsCount,
    successfulRequests: successfulRequestsCount,
    failedRequests: failedRequestsCount,
    averageLatencyMs: avgLatency,
    activeCharactersCount: characters.length,
    totalHeardClips: totalHeardClipsCount,
    avgVolumeDecibels: avgDb,
    characterStats: charStats
  });
});

// Characters CRUD with Custom Voice Assignment
app.get('/api/characters', (req: Request, res: Response) => {
  res.json({ success: true, characters });
});

app.post('/api/characters', (req: Request, res: Response) => {
  const { name, description, pitch, rate, voiceName, category, systemInstruction } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Character name is required' });
  }

  const selectedVoice = AVAILABLE_TTS_VOICES.find((v) => v.name.toLowerCase() === (voiceName || '').toLowerCase()) || AVAILABLE_TTS_VOICES[0];
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'CP';

  const id = 'char-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  const newChar: CharacterProfile = {
    id,
    name,
    code: initials,
    description: description || 'Custom Roblox VC Persona',
    voiceName: selectedVoice.name,
    voiceDisplayName: selectedVoice.displayName,
    voiceGender: selectedVoice.gender,
    voiceAccent: selectedVoice.accent,
    pitch: typeof pitch === 'number' ? pitch : 1.0,
    rate: typeof rate === 'number' ? rate : 1.0,
    category: category || 'custom',
    systemInstruction: systemInstruction || `You are roleplaying as ${name}. Speak naturally and concisely.`
  };

  characters.push(newChar);
  res.status(201).json({ success: true, character: newChar });
});

app.delete('/api/characters/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  characters = characters.filter((c) => c.id !== id);
  res.json({ success: true, message: 'Character removed' });
});

// Start Express server and Vite integration
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VC Studio Backend Server] Running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[VC Server Launch Error]', err);
});
