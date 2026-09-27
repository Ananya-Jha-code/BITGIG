"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  Playback clock for the workspace and consensus review.
  Uses the <video> element when it loads; if the source is missing it falls back to a
  simulated clock so the timeline and SOP sync still work without a demo file.
*/
export function usePlayback({ src, fallbackDuration }) {
  const videoRef = useRef(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  const hasVideo = Boolean(src) && !videoFailed;
  const duration = hasVideo && videoDuration ? videoDuration : fallbackDuration;

  useEffect(() => {
    if (!playing) return;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = hasVideo && videoRef.current ? videoRef.current.currentTime : timeRef.current + dt * rate;
      if (next >= duration) {
        next = duration;
        setPlaying(false);
      }
      timeRef.current = next;
      setTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, rate, hasVideo, duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!hasVideo || !video) return;
    video.playbackRate = rate;
    if (playing) video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [playing, rate, hasVideo]);

  const seek = useCallback(
    (t) => {
      const next = Math.min(duration, Math.max(0, t));
      timeRef.current = next;
      setTime(next);
      if (hasVideo && videoRef.current) videoRef.current.currentTime = next;
    },
    [duration, hasVideo]
  );

  const togglePlay = useCallback(() => {
    if (!playing && timeRef.current >= duration) seek(0);
    setPlaying((p) => !p);
  }, [playing, duration, seek]);

  const videoProps = {
    ref: videoRef,
    src,
    playsInline: true,
    muted: true,
    preload: "metadata",
    onLoadedMetadata: (e) => setVideoDuration(e.currentTarget.duration),
    onError: () => setVideoFailed(true),
  };

  return { time, duration, playing, rate, setRate, seek, togglePlay, hasVideo, videoProps };
}
