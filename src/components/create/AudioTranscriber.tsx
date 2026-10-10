import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw, 
  Volume2, 
  Download 
} from 'lucide-react';
import { motion } from 'motion/react';
import { geminiService } from '../../services/geminiService';

export default function AudioTranscriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setTranscription(null);
    } catch (err: any) {
      console.error(err);
      alert('Microphone access denied or unavailable.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Handle Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setTranscription(null);
    }
  };

  // Transcribe via gemini-3.5-transcribe
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';
        const res = await geminiService.transcribeAudio(base64Data, mimeType);
        setTranscription(res.transcription);
        setLoading(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Transcription failed');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Spec Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-zinc-950/80 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
            <Mic size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white">Audio & Speech Transcriber</h3>
              <span className="text-[8px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                gemini-3.5-transcribe
              </span>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">High-precision verbatim speech-to-text with timestamps</p>
          </div>
        </div>
      </div>

      {/* Recording & Upload Area */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mic Record Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            isRecording
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-white/5 border-white/10 hover:bg-white/[0.08] text-white'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </div>
          <span className="text-xs font-bold">{isRecording ? 'Stop Recording' : 'Record with Mic'}</span>
          <span className="text-[9px] text-white/40">{isRecording ? 'Recording active...' : 'Live voice capture'}</span>
        </button>

        {/* Upload Audio File */}
        <label className="p-6 rounded-3xl border border-dashed border-white/15 hover:border-emerald-500/40 bg-white/5 hover:bg-white/[0.08] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-cyan-400 flex items-center justify-center">
            <Upload size={20} />
          </div>
          <span className="text-xs font-bold text-white">Upload Audio</span>
          <span className="text-[9px] text-white/40">MP3, WAV, WEBM, M4A</span>
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Audio Preview Player */}
      {audioUrl && (
        <div className="p-3 bg-zinc-950/70 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
          <audio src={audioUrl} controls className="w-full h-8" />
        </div>
      )}

      {/* Action Button */}
      {audioBlob && (
        <button
          type="button"
          onClick={handleTranscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-black font-black text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Transcribing with gemini-3.5-transcribe...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Transcribe Audio Now</span>
            </>
          )}
        </button>
      )}

      {/* Output Transcription Box */}
      {transcription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/80 rounded-3xl border border-white/10 p-5 flex flex-col gap-3 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check size={12} /> Verbatim Transcript Ready
            </span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-[10px] font-bold text-white/70 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {transcription}
          </div>
        </motion.div>
      )}
    </div>
  );
}
