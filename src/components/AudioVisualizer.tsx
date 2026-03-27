import { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const AudioVisualizer = ({ analyser, isPlaying }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const width = canvas.width;
    const height = canvas.height;

    if (!analyser) {
      // Idle animation
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() / 1000;
      const barCount = 64;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (Math.sin(time * 2 + i * 0.3) * 0.3 + 0.4) * height * 0.15;
        const x = i * (barWidth + 2);
        const y = height / 2 - barHeight / 2;

        const hue = 280 + (i / barCount) * 80;
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.3)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0.8)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);

    // Bars
    const barCount = 128;
    const step = Math.floor(bufferLength / barCount);
    const barWidth = width / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = value * height * 0.7;
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      const hue = 280 + (i / barCount) * 80 + value * 40;
      const gradient = ctx.createLinearGradient(x, height, x, y);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.4)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 80%, 1)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Glow
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.5)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, barWidth, 2);
      ctx.shadowBlur = 0;
    }

    // Mirror (subtle)
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = value * height * 0.3;
      const x = i * (barWidth + 2);
      const hue = 280 + (i / barCount) * 80;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.5)`;
      ctx.fillRect(x, height, barWidth, -barHeight * -0.5);
    }
    ctx.globalAlpha = 1;

    animFrameRef.current = requestAnimationFrame(draw);
  }, [analyser]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="w-full h-48 sm:h-64 md:h-80"
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
            Waiting for audio...
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
