import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface YouTubeInputProps {
  onSubmit: (videoIds: string[]) => void;
}

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractPlaylistId = (url: string): string | null => {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

const YouTubeInput = ({ onSubmit }: YouTubeInputProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setError('');
    setLoading(true);

    // 1. Check for Playlist first
    const playlistId = extractPlaylistId(trimmed);
    const videoId = extractVideoId(trimmed);

    if (playlistId) {
      // If we have a playlist ID, prioritize playlist mode.
      // Format: playlist:LIST_ID:START_VIDEO_ID (if available)
      const submitValue = videoId 
        ? `playlist:${playlistId}:${videoId}` 
        : `playlist:${playlistId}`;
      
      onSubmit([submitValue]);
      setLoading(false);
      return;
    }

    // 2. Check for Single Video if no playlist was found
    if (videoId) {
      onSubmit([videoId]);
    } else {
      setError('Invalid YouTube URL, video ID, or playlist link');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => { 
              setUrl(e.target.value); 
              if (error) setError(''); 
            }}
            placeholder="Paste YouTube URL, video ID, or playlist link..."
            className="pl-10 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="bg-primary hover:bg-primary/80 font-semibold tracking-wide min-w-[80px]"
        >
          {loading ? 'Loading...' : 'Load'}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs font-mono animate-in fade-in slide-in-from-top-1">{error}</p>}
    </form>
  );
};

export default YouTubeInput;
