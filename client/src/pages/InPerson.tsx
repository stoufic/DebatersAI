import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDebateStore } from '../hooks/useDebateStore';
import type { Analysis as AnalysisType } from '../types';

export default function InPerson() {
  const {} = useDebateStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript] = useState('');
  const [analysis] = useState<AnalysisType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.start();

      // Volume monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(avg / 100);
        }
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      setIsListening(true);
      setError(null);
    } catch (e) {
      setError('Microphone access denied. Please allow microphone access to use In-Person mode.');
    }
  };

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
    audioContextRef.current?.close();
    cancelAnimationFrame(animationRef.current || 0);
    setIsListening(false);
    setVolume(0);
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">In-Person Debate</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Place your phone between two debaters. The AI will listen, analyze, and fact-check their arguments.
          </p>
        </motion.div>

        {/* Audio Visualizer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-12 mb-8 text-center"
        >
          <div className="relative w-40 h-40 mx-auto mb-8">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening ? 'bg-primary' : 'bg-surface'
            }`}>
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            {/* Volume bars */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={isListening ? {
                    height: Math.random() * 30 + 10 + volume * 40,
                  } : { height: 10 }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={isListening ? {
                    height: Math.random() * 30 + 10 + volume * 40,
                  } : { height: 10 }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 ${
              isListening
                ? 'bg-con-red hover:bg-con-red/80'
                : 'gradient-bg hover:scale-105 glow-primary'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>

          {error && (
            <p className="text-con-red mt-4">{error}</p>
          )}
        </motion.div>

        {/* Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Live Transcript</h2>
            <div className="bg-surface rounded-xl p-4 max-h-48 overflow-y-auto">
              <p className="font-mono text-sm text-text-secondary leading-relaxed">
                {transcript || 'Waiting for speech...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Analysis Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Sentiment */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
            <div className="space-y-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Debater 1</p>
                <div className="h-3 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-bg"
                    animate={{ width: `${((analysis?.sentiment_user || 0) + 1) * 50}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">Debater 2</p>
                <div className="h-3 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-bg"
                    animate={{ width: `${((analysis?.sentiment_opponent || 0) + 1) * 50}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Topic Detection */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Topic Detection</h2>
            {analysis?.topic ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold">{analysis.topic}</p>
                    <p className="text-text-secondary text-sm">
                      {analysis.sub_topics?.join(', ') || 'General discussion'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary">Analyzing conversation...</p>
            )}
          </div>

          {/* Key Claims */}
          <div className="glass-card p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Key Arguments</h2>
            <div className="space-y-3">
              {analysis?.key_claims?.length ? (
                analysis.key_claims.map((claim, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    claim.stance === 'pro' ? 'border-pro-green/30 bg-pro-green/10' : 'border-con-red/30 bg-con-red/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-semibold ${claim.stance === 'pro' ? 'text-pro-green' : 'text-con-red'}`}>
                        {claim.stance.toUpperCase()}
                      </span>
                      <span className="text-text-secondary text-sm">{claim.topic}</span>
                    </div>
                    <p className="font-mono text-sm">{claim.claim}</p>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary">Arguments will appear as they are detected...</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
