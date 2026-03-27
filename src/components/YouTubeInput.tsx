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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    // Check for playlist
    const playlistId = extractPlaylistId(trimmed);
    if (playlistId) {
      setLoading(true);
      setError('');
      try {
        // Use the YouTube oEmbed approach - we'll fetch playlist items via noembed
        // Since we can't use the Data API without a key, we'll extract video IDs from the playlist URL
        // For now, we load the first video from the URL and tell the player it's a playlist
        const videoId = extractVideoId(trimmed);
        if (videoId) {
          // Pass both playlist info - the player will handle playlist loading via YT API
          onSubmit([`playlist:${playlistId}:${videoId}`]);
        } else {
          onSubmit([`playlist:${playlistId}`]);
        }
      } catch {
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single video
    const videoId = extractVideoId(trimmed);
    if (videoId) {
      setError('');
      onSubmit([videoId]);
    } else {
      setError('Invalid YouTube URL, video ID, or playlist link');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="Paste YouTube URL, video ID, or playlist link..."
            className="pl-10 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/80 font-semibold tracking-wide">
          {loading ? 'Loading...' : 'Load'}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs font-mono">{error}</p>}
    </form>
  );
};

export default YouTubeInput;
