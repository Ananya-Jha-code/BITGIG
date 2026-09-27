"use client";

import { AnimatePresence, motion } from "motion/react";
import { PenLine, Sparkles, VideoOff } from "lucide-react";
import Mono from "@/components/Mono";
import { formatTime, pad2 } from "@/lib/format";
import { LABEL_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Video with an instrument-style HUD: file, timecode, and the segment + SOP step under the playhead.
export default function VideoPlayer({ playback, fileName, segment, segmentKey, stepText, className }) {
  const meta = segment ? LABEL_META[segment.label] ?? LABEL_META.other : null;

  return (
    <div className={cn("relative aspect-16/7 overflow-hidden bg-ink", className)}>
      {playback.hasVideo ? (
        <video {...playback.videoProps} className="absolute inset-0 size-full object-contain" />
      ) : (
        <div className="bg-grid absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/8">
            <VideoOff className="size-5 text-white/50" aria-hidden />
          </div>
          <Mono className="text-sm tracking-wider text-white/60 uppercase">Simulated playback</Mono>
          <span className="text-sm text-white/40">
            Add <Mono className="text-white/60">{fileName}</Mono> to <Mono className="text-white/60">public/demo/</Mono>
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent px-5 py-4">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-danger" style={{ animation: playback.playing ? "live-dot 1s ease-in-out infinite" : undefined }} />
          <Mono className="text-[13px] text-white/75">CAM 01 · {fileName}</Mono>
        </span>
        <Mono className="rounded-lg bg-black/55 px-2.5 py-1 text-lg font-medium text-white backdrop-blur">{formatTime(playback.time)}</Mono>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-5 pt-12 pb-4">
        <AnimatePresence mode="wait">
          {segment ? (
            <motion.div
              key={segmentKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className={cn("inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold", meta.solid)}>{meta.name}</span>
              <span className="text-base font-medium text-white">
                <Mono className="mr-2 text-white/55">STEP {pad2(segment.sop_step + 1)}</Mono>
                {stepText}
              </span>
              {segment.source === "ai" && !segment.edited ? (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-semibold text-white">
                  <Sparkles className="size-3.5" /> Gemini
                </span>
              ) : segment.edited ? (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-2.5 text-xs font-semibold text-ink">
                  <PenLine className="size-3.5" /> Expert-edited
                </span>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Mono className="text-sm text-white/50">No segment at playhead</Mono>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
