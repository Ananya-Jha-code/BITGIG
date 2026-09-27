"use client";

import { useRef, useState } from "react";
import { Film, FolderOpen, Upload, X } from "lucide-react";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// Reads a video's duration in the browser; resolves null if the file can't be decoded.
function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (value) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

function formatSize(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

// videos: [{ id, file, duration }]. Each video becomes one task.
export default function DatasetUpload({ videos, onChange }) {
  const filesRef = useRef(null);
  const folderRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  async function addFiles(list) {
    const incoming = [...list].filter((f) => f.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f.name));
    if (!incoming.length) return;
    const seen = new Set(videos.map((v) => v.id));
    const fresh = incoming
      .map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, file, duration: null }))
      .filter((v) => !seen.has(v.id));
    let next = [...videos, ...fresh];
    onChange(next);
    const durations = await Promise.all(fresh.map((v) => readDuration(v.file)));
    const byId = Object.fromEntries(fresh.map((v, i) => [v.id, durations[i]]));
    next = next.map((v) => (v.id in byId ? { ...v, duration: byId[v.id] } : v));
    onChange(next);
  }

  function remove(id) {
    onChange(videos.filter((v) => v.id !== id));
  }

  const totalBytes = videos.reduce((n, v) => n + v.file.size, 0);
  const totalSeconds = videos.reduce((n, v) => n + (v.duration ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-strong px-6 text-center transition-colors duration-150",
          videos.length ? "py-6" : "py-10",
          dragging && "border-primary bg-primary-soft/40"
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
          <Upload className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">Drop your video dataset here</span>
          <span className="text-sm text-muted-foreground">Each video becomes one task for your experts. MP4, MOV or WebM.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => filesRef.current?.click()} className="rounded-full bg-card">
            <Film data-icon="inline-start" />
            Choose videos
          </Button>
          <Button type="button" variant="outline" onClick={() => folderRef.current?.click()} className="rounded-full bg-card">
            <FolderOpen data-icon="inline-start" />
            Choose folder
          </Button>
        </div>
        <input
          ref={filesRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={folderRef}
          type="file"
          webkitdirectory=""
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {videos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between bg-secondary/60 px-4 py-2.5 text-sm">
            <span className="font-semibold">
              <Mono>{videos.length}</Mono> {videos.length === 1 ? "video" : "videos"}
            </span>
            <Mono className="text-muted-foreground">
              {formatSize(totalBytes)}
              {totalSeconds > 0 && ` · ${formatTime(totalSeconds).slice(0, 5)} total`}
            </Mono>
          </div>
          <ul className="max-h-64 divide-y divide-border overflow-y-auto bg-elevated">
            {videos.map((v, i) => (
              <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                <Mono className="w-8 text-xs text-muted-foreground">{String(i + 1).padStart(3, "0")}</Mono>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.file.name}</span>
                <Mono className="text-xs text-muted-foreground">{v.duration ? formatTime(v.duration).slice(0, 5) : "--:--"}</Mono>
                <Mono className="w-20 text-right text-xs text-muted-foreground">{formatSize(v.file.size)}</Mono>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(v.id)} aria-label={`Remove ${v.file.name}`}>
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
