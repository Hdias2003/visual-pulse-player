import { useRef, useState, useEffect } from 'react';
import { Upload, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocalAudioPlayerProps {
  onAnalyserReady: (analyser: AnalyserNode) => void;
  onPlayStateChange: (playing: boolean) => void;
}

const LocalAudioPlayer = ({ onAnalyserReady, onPlayStateChange }: LocalAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [fileName, setFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioRef.current) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;

    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      onAnalyserReady(analyser);
    }

    audioRef.current.play();
    setIsPlaying(true);
    onPlayStateChange(true);
  };

  const togglePlay = () => {
    if (!audioRef.current || !fileName) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioCtxRef.current?.resume();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
    onPlayStateChange(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', () => { setIsPlaying(false); onPlayStateChange(false); });
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', () => {});
    };
  }, [onPlayStateChange]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      <audio ref={audioRef} />

      {!fileName ? (
        <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-card/30">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground font-mono text-sm">Drop audio file or click to browse</span>
          <span className="text-muted-foreground/50 font-mono text-xs">MP3, WAV, OGG, FLAC</span>
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
        </label>
      ) : (
        <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={togglePlay}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full border border-primary/30 text-primary hover:bg-primary/10"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalAudioPlayer;
