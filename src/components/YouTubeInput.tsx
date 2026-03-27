import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface YouTubeInputProps {
  onSubmit: (videoId: string) => void;
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

const YouTubeInput = ({ onSubmit }: YouTubeInputProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url.trim());
    if (videoId) {
      setError('');
      onSubmit(videoId);
    } else {
      setError('Invalid YouTube URL or video ID');
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
            placeholder="Paste YouTube URL or video ID..."
            className="pl-10 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <Button type="submit" className="bg-primary hover:bg-primary/80 font-semibold tracking-wide">
          Load
        </Button>
      </div>
      {error && <p className="text-destructive text-xs font-mono">{error}</p>}
    </form>
  );
};

export default YouTubeInput;
