"use client";

import { Keyboard, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RATES = [0.5, 1, 2];

export default function Transport({ playback, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-2 rounded-b-xl border-t border-border bg-card px-3 py-2">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous segment">
        <SkipBack />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={playback.togglePlay}
        aria-label={playback.playing ? "Pause" : "Play"}
        className="border border-border"
      >
        {playback.playing ? <Pause /> : <Play />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next segment">
        <SkipForward />
      </Button>

      <div className="ml-2 text-sm">
        <Mono className="text-foreground">{formatTime(playback.time)}</Mono>
        <Mono className="text-muted-foreground"> / {formatTime(playback.duration)}</Mono>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border p-0.5" role="group" aria-label="Playback speed">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => playback.setRate(r)}
              aria-pressed={playback.rate === r}
              className={cn(
                "h-6 rounded-md px-2 font-mono text-[11px] transition-colors duration-150",
                playback.rate === r ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}×
            </button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" className="text-muted-foreground">
              <Keyboard />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono text-[11px]">
            Space play/pause · ←/→ seek 1s · [ ] prev/next segment
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
