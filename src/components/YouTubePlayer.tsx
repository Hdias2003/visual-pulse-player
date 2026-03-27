import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubePlayerProps {
  videoId: string;
  onPlayStateChange?: (playing: boolean) => void;
  onSimulatedAnalyser?: (enabled: boolean) => void;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
}

const YouTubePlayer = ({ videoId, onPlayStateChange, onSimulatedAnalyser }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number>(0);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    setVideoInfo({
      title: 'Loading...',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    });

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const createPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new (window as any).YT.Player('yt-hidden-player', {
        videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1 },
        events: {
          onReady: (event: any) => {
            const data = event.target.getVideoData();
            setVideoInfo({
              title: data.title || 'Unknown Title',
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            });
            setDuration(event.target.getDuration() || 0);
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            const playing = event.data === (window as any).YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            onPlayStateChange?.(playing);
            onSimulatedAnalyser?.(playing);
            if (playing) {
              setDuration(playerRef.current?.getDuration?.() || 0);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, onPlayStateChange, onSimulatedAnalyser]);

  // Poll current time
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime && !isSeeking) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 250);
    return () => clearInterval(intervalRef.current);
  }, [isSeeking]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  }, []);

  const handleSeekCommit = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsSeeking(false);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(currentTime, true);
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  return (
    <>
      {/* Hidden player */}
      <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden">
        <div id="yt-hidden-player" ref={containerRef} />
      </div>

      {/* Now Playing card */}
      {videoInfo && (
        <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Now Playing</p>
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlay}
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0 rounded-full border border-primary/30 text-primary hover:bg-primary/10"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-16 h-11 object-cover rounded-lg border border-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{videoInfo.title}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                {isPlaying ? (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Playing
                  </>
                ) : (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Paused
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Seek slider */}
          {duration > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.5}
                value={currentTime}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onChange={handleSeek}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)`
                }}
              />
              <span className="text-xs font-mono text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default YouTubePlayer;
