import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onPlayStateChange?: (playing: boolean) => void;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
}

const YouTubePlayer = ({ videoId, onPlayStateChange }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Set thumbnail immediately
    setVideoInfo({
      title: 'Loading...',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    });

    // Load YouTube IFrame API if not already loaded
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
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            const playing = event.data === (window as any).YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            onPlayStateChange?.(playing);
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
  }, [videoId, onPlayStateChange]);

  return (
    <>
      {/* Hidden player */}
      <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden">
        <div id="yt-hidden-player" ref={containerRef} />
      </div>

      {/* Now Playing card */}
      {videoInfo && (
        <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">Now Playing</p>
          <div className="flex items-center gap-4">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-20 h-14 object-cover rounded-lg border border-border"
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
        </div>
      )}
    </>
  );
};

export default YouTubePlayer;
