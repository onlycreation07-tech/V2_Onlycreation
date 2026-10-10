import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  PhoneOff, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Zap,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LiveVoiceRoom() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [modelAudioActive, setModelAudioActive] = useState(false);
  const [statusText, setStatusText] = useState('Standby');
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Convert Float32Array to 16kHz 16-bit PCM Base64
  const floatTo16BitPCM = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Playback raw 24kHz PCM chunk from Gemini Live
  const play24kHzPCMChunk = (base64Data: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    setModelAudioActive(true);
    source.onended = () => {
      if (ctx.currentTime >= nextStartTimeRef.current) {
        setModelAudioActive(false);
      }
    };
  };

  const connectLiveRoom = async () => {
    setStatusText('Connecting to Gemini 3.8 Live API...');
    try {
      // 1. Initialize audio capture at 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000 } 
      });
      micStreamRef.current = stream;

      inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;

      // 2. Connect WebSocket
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}/api/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('Live Audio Channel Open • Zephyr Voice Persona');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            play24kHzPCMChunk(data.audio);
          }
          if (data.interrupted) {
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setModelAudioActive(false);
          }
        } catch (e) {
          console.warn('Live audio packet error:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('Live WS error:', e);
        setStatusText('Live WebSocket Standby');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText('Session Closed');
        disconnectLiveRoom();
      };

      // 3. Audio stream processor
      const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64PCM = floatTo16BitPCM(inputData);
          ws.send(JSON.stringify({ audio: base64PCM }));

          // Simple amplitude detection for speaking visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
          const avg = sum / inputData.length;
          setIsSpeaking(avg > 0.04);
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtxRef.current.destination);
    } catch (err: any) {
      console.error(err);
      alert('Could not start live microphone channel.');
      setStatusText('Mic Permission Denied');
    }
  };

  const disconnectLiveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setModelAudioActive(false);
    setStatusText('Standby');
  };

  useEffect(() => {
    return () => {
      disconnectLiveRoom();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black rounded-3xl border border-white/10 shadow-2xl min-h-[480px] text-center relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        modelAudioActive 
          ? 'bg-purple-600/30 scale-125' 
          : isSpeaking 
          ? 'bg-emerald-500/30 scale-110' 
          : 'bg-white/5 scale-90'
      }`} />

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
          }`} />
          <span className="text-xs font-mono font-bold text-white/80">gemini-3.8-live</span>
        </div>
        <span className="text-[9px] font-mono uppercase bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 font-bold">
          16kHz Input • 24kHz Output
        </span>
      </div>

      {/* Center Interactive Visualizer Orb */}
      <div className="flex flex-col items-center gap-6 my-auto relative z-10">
        <div className="relative">
          {/* Animated concentric rings */}
          {(isSpeaking || modelAudioActive) && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`absolute inset-0 rounded-full border-2 ${
                modelAudioActive ? 'border-purple-400' : 'border-emerald-400'
              }`}
            />
          )}

          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
            modelAudioActive
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-purple-500/50 scale-105'
              : isSpeaking
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/50 scale-105'
              : isConnected
              ? 'bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/20'
              : 'bg-zinc-950 border border-white/10'
          }`}>
            {modelAudioActive ? (
              <Volume2 size={44} className="text-white animate-pulse" />
            ) : isSpeaking ? (
              <Activity size={44} className="text-white animate-bounce" />
            ) : isConnected ? (
              <Radio size={40} className="text-purple-300" />
            ) : (
              <MicOff size={36} className="text-white/40" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-black text-white">
            {modelAudioActive ? 'Director Speaking...' : isSpeaking ? 'Listening to You...' : isConnected ? 'Voice Room Live' : 'Ready to Connect'}
          </h3>
          <p className="text-xs text-white/50 font-mono mt-1 max-w-xs">{statusText}</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex justify-center gap-3 relative z-10">
        {!isConnected ? (
          <button
            type="button"
            onClick={connectLiveRoom}
            className="w-full max-w-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Mic size={16} />
            <span>Join Live Voice Room</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={disconnectLiveRoom}
            className="w-full max-w-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <PhoneOff size={16} />
            <span>End Voice Call</span>
          </button>
        )}
      </div>
    </div>
  );
}
