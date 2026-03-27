import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Youtube, FileAudio } from 'lucide-react';
import AudioVisualizer from '@/components/AudioVisualizer';
import YouTubeInput from '@/components/YouTubeInput';
import YouTubePlayer from '@/components/YouTubePlayer';
import LocalAudioPlayer from '@/components/LocalAudioPlayer';

const Index = () => {
  const [mode, setMode] = useState<'youtube' | 'local'>('youtube');
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMode, setSimulatedMode] = useState(false);

  const handleSimulatedAnalyser = useCallback((enabled: boolean) => {
    setSimulatedMode(enabled);
  }, []);

  const handleAnalyserReady = useCallback((node: AnalyserNode) => {
    setAnalyser(node);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent">
              SoundWave
            </h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            AUDIO VISUALIZER • YOUTUBE & LOCAL FILES
          </p>
        </motion.header>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2"
        >
          <button
            onClick={() => { setMode('youtube'); setAnalyser(null); setIsPlaying(false); setSimulatedMode(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'youtube'
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            <Youtube className="h-4 w-4" />
            YouTube
          </button>
          <button
            onClick={() => { setMode('local'); setVideoIds([]); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'local'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            <FileAudio className="h-4 w-4" />
            Local File
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Visualizer */}
          <AudioVisualizer analyser={analyser} isPlaying={isPlaying} simulatedMode={simulatedMode} />

          {/* Input / Player */}
          {mode === 'youtube' ? (
            <div className="space-y-6">
              <YouTubeInput onSubmit={setVideoIds} />
              {videoIds.length > 0 && (
                <YouTubePlayer videoIds={videoIds} onPlayStateChange={handlePlayStateChange} onSimulatedAnalyser={handleSimulatedAnalyser} />
              )}
            </div>
          ) : (
            <LocalAudioPlayer
              onAnalyserReady={handleAnalyserReady}
              onPlayStateChange={handlePlayStateChange}
            />
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-8"
        >
          <p className="text-muted-foreground/40 font-mono text-xs tracking-widest">
            BUILT WITH WEB AUDIO API
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
