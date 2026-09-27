"use client";

import { VideoOff } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import HumanEditedMark from "@/components/HumanEditedMark";
import Mono from "@/components/Mono";
import { formatTime, pad2 } from "@/lib/format";
import { LABEL_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Video with an instrument-style HUD: file, timecode, and the segment + SOP step under the playhead.
export default function VideoPlayer({ playback, fileName, segment, stepText, className }) {
  const meta = segment ? LABEL_META[segment.label] ?? LABEL_META.other : null;

  return (
    <div className={cn("relative aspect-[11/5] overflow-hidden rounded-t-xl bg-[#0e0d10]", className)}>
      {playback.hasVideo ? (
        <video {...playback.videoProps} className="absolute inset-0 size-full object-contain" />
      ) : (
        <div className="bg-grid absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-90">
          <VideoOff className="size-5 text-muted-foreground" aria-hidden />
          <Mono className="text-xs uppercase tracking-wider text-muted-foreground">No video source · simulated playback</Mono>
          <span className="text-xs text-muted-foreground/70">
            Add <Mono>{fileName}</Mono> to <Mono>public/demo/</Mono> to play the real clip
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent px-4 py-3">
        <Mono className="text-[11px] text-foreground/70">CAM 01 · {fileName}</Mono>
        <Mono className="rounded-md bg-black/50 px-2 py-1 text-sm text-foreground">{formatTime(playback.time)}</Mono>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-linear-to-t from-black/70 to-transparent px-4 pt-10 pb-3">
        {segment ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-black/60 px-2 text-xs font-medium">
              <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
              {meta.name}
            </span>
            <span className="text-sm text-foreground/90">
              <Mono className="mr-1.5 text-muted-foreground">STEP {pad2(segment.sop_step + 1)}</Mono>
              {stepText}
            </span>
            {segment.source === "ai" && !segment.edited ? <GeminiChip size="xs" /> : segment.edited ? <HumanEditedMark compact /> : null}
          </div>
        ) : (
          <Mono className="text-[11px] text-muted-foreground">No segment at playhead</Mono>
        )}
      </div>
    </div>
  );
}
