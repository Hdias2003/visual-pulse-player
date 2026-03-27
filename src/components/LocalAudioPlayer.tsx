import { useRef, useState, useEffect } from 'react';
import { Upload, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocalAudioPlayerProps {
  onAnalyserReady: (analyser: AnalyserNode) => void;
  onPlayStateChange: (playing: boolean) => void;
}

const ACCEPTED_TYPES = 'audio/*,video/mp4,video/webm,video/ogg,video/x-matroska,video/quicktime';

const LocalAudioPlayer = ({ onAnalyserReady, onPlayStateChange }: LocalAudioPlayerProps) => {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [fileName, setFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideo, setIsVideo] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mediaRef.current) return;

    const fileIsVideo = file.type.startsWith('video/');
    setIsVideo(fileIsVideo);
    setFileName(file.name);

    const url = URL.createObjectURL(file);
    mediaRef.current.src = url;

    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(mediaRef.current);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      onAnalyserReady(analyser);
    }

    mediaRef.current.play();
    setIsPlaying(true);
    onPlayStateChange(true);
  };

  const togglePlay = () => {
    if (!mediaRef.current || !fileName) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      audioCtxRef.current?.resume();
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
    onPlayStateChange(!isPlaying);
  };

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const updateTime = () => {
      setCurrentTime(media.currentTime);
      setDuration(media.duration || 0);
    };
    const handleEnded = () => { setIsPlaying(false); onPlayStateChange(false); };
    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('ended', handleEnded);
    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('ended', handleEnded);
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
      {/* Hidden video/audio element — never shown */}
      <video ref={mediaRef} className="hidden" playsInline />

      {!fileName ? (
        <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-card/30">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground font-mono text-sm">Drop audio or video file to play</span>
          <span className="text-muted-foreground/50 font-mono text-xs">MP3, WAV, OGG, FLAC, MP4, WebM, MKV</span>
          <input type="file" accept={ACCEPTED_TYPES} onChange={handleFile} className="hidden" />
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate text-foreground">{fileName}</p>
                {isVideo && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 shrink-0">
                    VIDEO • AUDIO ONLY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (mediaRef.current) {
                      mediaRef.current.currentTime = time;
                      setCurrentTime(time);
                    }
                  }}
                  className="flex-1 h-1.5 accent-primary cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:rounded-full"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)`
                  }}
                />
                <span className="text-xs font-mono text-muted-foreground w-10">{formatTime(duration)}</span>
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
