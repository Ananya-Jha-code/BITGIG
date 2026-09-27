"use client";

import { Keyboard, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RATES = [0.5, 1, 2];

export default function Transport({ playback, onPrev, onNext }) {
  const progress = (playback.time / playback.duration) * 100;

  return (
    <div className="relative flex items-center gap-2 bg-card px-4 py-3">
      <div className="absolute inset-x-0 top-0 h-1 bg-secondary" aria-hidden>
        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </div>

      <Button variant="ghost" size="icon-lg" onClick={onPrev} aria-label="Previous segment" className="rounded-full">
        <SkipBack className="size-5" />
      </Button>
      <button
        type="button"
        onClick={playback.togglePlay}
        aria-label={playback.playing ? "Pause" : "Play"}
        className="flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_20px_-8px_rgba(214,36,122,0.8)] transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {playback.playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
      </button>
      <Button variant="ghost" size="icon-lg" onClick={onNext} aria-label="Next segment" className="rounded-full">
        <SkipForward className="size-5" />
      </Button>

      <div className="ml-3 text-lg">
        <Mono className="font-medium text-foreground">{formatTime(playback.time)}</Mono>
        <Mono className="text-muted-foreground"> / {formatTime(playback.duration)}</Mono>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center rounded-full bg-secondary p-1" role="group" aria-label="Playback speed">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => playback.setRate(r)}
              aria-pressed={playback.rate === r}
              className={cn(
                "h-8 rounded-full px-3 font-mono text-[13px] font-medium transition-colors duration-150",
                playback.rate === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}×
            </button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-lg" aria-label="Keyboard shortcuts" className="rounded-full text-muted-foreground">
              <Keyboard className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono text-xs">
            Space play · ←/→ seek · [ ] segment · Enter confirm
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
