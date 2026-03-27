import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubePlayerProps {
  videoIds: string[];
  onPlayStateChange?: (playing: boolean) => void;
  onSimulatedAnalyser?: (enabled: boolean) => void;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
}

const YouTubePlayer = ({ videoIds, onPlayStateChange, onSimulatedAnalyser }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number>(0);
  const [currentInfo, setCurrentInfo] = useState<VideoInfo | null>(null);
  const [queue, setQueue] = useState<VideoInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const updateVideoInfo = useCallback((player: any, vidId?: string) => {
    const data = player.getVideoData?.();
    const id = vidId || data?.video_id || '';
    if (!id) return;
    
    setCurrentInfo({
      id,
      title: data?.title || 'Unknown Title',
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    });
    setDuration(player.getDuration?.() || 0);
  }, []);

  const updateQueueFromPlaylist = useCallback((player: any) => {
    try {
      if (!player.getPlaylist) return;
      const playlist = player.getPlaylist() || [];
      const idx = player.getPlaylistIndex?.() || 0;
      setCurrentIndex(idx);
      
      const upcoming: VideoInfo[] = [];
      // Limiting loop to 4 items to prevent UI lag
      const maxItems = Math.min(idx + 5, playlist.length);
      for (let i = idx + 1; i < maxItems; i++) {
        upcoming.push({
          id: playlist[i],
          title: `Next in Playlist`, // Titles aren't available until loaded by YT
          thumbnail: `https://img.youtube.com/vi/${playlist[i]}/default.jpg`,
        });
      }
      setQueue(upcoming);
    } catch (e) {
      console.error("Playlist update failed", e);
    }
  }, []);

  useEffect(() => {
    const input = videoIds[0] || '';
    const isPlaylistInput = input.startsWith('playlist:');

    setIsPlaylist(isPlaylistInput);
    setQueue([]);
    setCurrentIndex(0);

    let playlistId = '';
    let startVideoId = '';

    if (isPlaylistInput) {
      const parts = input.split(':');
      playlistId = parts[1];
      startVideoId = parts[2] || '';
    } else {
      startVideoId = input;
    }

    if (!startVideoId && !playlistId) return;

    setCurrentInfo({
      id: startVideoId,
      title: 'Loading...',
      thumbnail: startVideoId ? `https://img.youtube.com/vi/${startVideoId}/hqdefault.jpg` : '',
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

      const playerVars: any = { 
        autoplay: 1, 
        controls: 0, 
        modestbranding: 1,
        rel: 0 
      };

      playerRef.current = new (window as any).YT.Player('yt-hidden-player', {
        // If playlist, don't set videoId here; let loadPlaylist handle it
        videoId: isPlaylistInput ? undefined : (startVideoId || undefined),
        playerVars,
        events: {
          onReady: (event: any) => {
            if (isPlaylistInput) {
              event.target.loadPlaylist({
                list: playlistId,
                listType: 'playlist',
                index: 0
              });
            } else {
              event.target.playVideo();
            }
            updateVideoInfo(event.target, startVideoId);
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            const state = event.data;
            const playing = state === YT.PlayerState.PLAYING;

            setIsPlaying(playing);
            onPlayStateChange?.(playing);
            onSimulatedAnalyser?.(playing);

            if (playing) {
              updateVideoInfo(event.target);
              if (isPlaylistInput) {
                // Safety delay to prevent blocking the main thread during render
                setTimeout(() => updateQueueFromPlaylist(event.target), 1200);
              }
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
  }, [videoIds]); // Simplified dependencies to prevent re-initialization loops

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime && !isSeeking && isPlaying) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500); // Increased to 500ms for better performance
    return () => clearInterval(intervalRef.current);
  }, [isSeeking, isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const skipNext = () => playerRef.current?.nextVideo?.();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    playerRef.current?.seekTo?.(currentTime, true);
  };

  return (
    <>
      <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden">
        <div id="yt-hidden-player" ref={containerRef} />
      </div>

      {currentInfo && (
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
            {currentInfo.thumbnail && (
              <img
                src={currentInfo.thumbnail}
                alt={currentInfo.title}
                className="w-16 h-11 object-cover rounded-lg border border-border shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentInfo.title}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                {isPlaying ? (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Playing{isPlaylist ? ` • Track ${currentIndex + 1}` : ''}
                  </>
                ) : (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Paused
                  </>
                )}
              </p>
            </div>
            {isPlaylist && (
              <Button
                onClick={skipNext}
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>

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
                onChange={handleSeek}
                onMouseUp={handleSeekCommit}
                className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-secondary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)`
                }}
              />
              <span className="text-xs font-mono text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          )}

          {isPlaylist && queue.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Up Next</p>
              <div className="space-y-1.5">
                {queue.map((item, idx) => (
                  <div key={item.id + idx} className="flex items-center gap-3 py-1">
                    <span className="text-xs font-mono text-muted-foreground/50 w-4 text-right">{currentIndex + idx + 2}</span>
                    <img src={item.thumbnail} alt="" className="w-10 h-7 object-cover rounded border border-border/50 shrink-0" />
                    <p className="text-xs text-muted-foreground truncate flex-1">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default YouTubePlayer;
