// Compute options for processing a gig's dataset, with rough cost estimates.
// All rates are illustrative USD figures kept in one place so they're easy to tune.

// Used when a video's duration can't be read in the browser.
const MB_PER_MINUTE = 60;
// Gemini pre-annotation, charged the same whichever provider hosts the data.
export const GEMINI_RATE_PER_VIDEO_MIN = 0.02;

export const COMPUTE_PROVIDERS = [
  {
    id: "gcp",
    name: "Google Cloud",
    blurb: "Cloud Run + Cloud Storage, same network as Gemini",
    perVideoHour: 0.9,
    storagePerGb: 0.02,
    egressPerGb: 0,
    parallelism: 16,
    recommended: true,
  },
  {
    id: "aws",
    name: "AWS",
    blurb: "EC2 GPU workers + S3, egress to Gemini",
    perVideoHour: 1.1,
    storagePerGb: 0.023,
    egressPerGb: 0.09,
    parallelism: 16,
  },
  {
    id: "azure",
    name: "Azure",
    blurb: "Azure Batch + Blob Storage, egress to Gemini",
    perVideoHour: 1.05,
    storagePerGb: 0.0208,
    egressPerGb: 0.087,
    parallelism: 12,
  },
  {
    id: "distributed",
    name: "Distributed network",
    blurb: "Jobs spread across a pool of independent GPU nodes",
    perVideoHour: 0.45,
    storagePerGb: 0.015,
    egressPerGb: 0.01,
    parallelism: 48,
    variableSpeed: true,
  },
];

// Minutes per video: the real duration when known, else estimated from file size.
export function videoMinutes(video) {
  if (video.duration) return video.duration / 60;
  return video.file.size / 1024 / 1024 / MB_PER_MINUTE;
}

// videos: [{ file, duration }]. Returns line items and a total in USD.
export function estimateCompute(provider, videos) {
  const minutes = videos.reduce((sum, v) => sum + videoMinutes(v), 0);
  const gb = videos.reduce((sum, v) => sum + v.file.size, 0) / 1024 ** 3;
  const processing = (minutes / 60) * provider.perVideoHour;
  const storage = gb * provider.storagePerGb;
  const egress = gb * provider.egressPerGb;
  const gemini = minutes * GEMINI_RATE_PER_VIDEO_MIN;
  // Longest single job bounds wall-clock time once work is spread across workers.
  const longest = Math.max(0, ...videos.map(videoMinutes));
  const turnaroundMin = Math.max(longest, minutes / provider.parallelism) * 1.5;

  return {
    minutes,
    gb,
    lines: [
      { label: "Video processing", amount: processing },
      { label: "Storage (1 month)", amount: storage },
      { label: "Data transfer", amount: egress },
      { label: "Gemini pre-annotation", amount: gemini },
    ],
    total: processing + storage + egress + gemini,
    turnaroundMin,
  };
}
