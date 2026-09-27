"""Transcode raw LSV videos into small clips that can live in git.

Source files are 4K and 180 MB to 1 GB for under two minutes of footage. At 720p /
15 fps / CRF 30 with no audio the same clip lands around 3-8 MB, which the Gemini
Files API and the annotation player both handle comfortably.

    python demo/scripts/make_clips.py
    python demo/scripts/make_clips.py --slice DJI-034 --force
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys

from lsv import CLIPS_DIR, RAW_DIR, iter_clips, load_manifest


def find_ffmpeg() -> str | None:
    system = shutil.which("ffmpeg")
    if system:
        return system
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slice", action="append", default=[], help="LSV Slice_ID to transcode; repeatable")
    parser.add_argument("--force", action="store_true", help="overwrite clips that already exist")
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        print(
            "ffmpeg not found. Either install it (winget install Gyan.FFmpeg) or\n"
            "run: pip install -r demo/scripts/requirements.txt",
            file=sys.stderr,
        )
        return 1

    manifest = load_manifest()
    settings = manifest["transcode"]
    wanted = set(args.slice)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    made = 0
    for _gig, clip in iter_clips(manifest, include_broll=True):
        if wanted and clip["slice_id"] not in wanted:
            continue
        source = RAW_DIR / clip["source_file"].split("/")[-1]
        if not source.exists():
            continue
        destination = CLIPS_DIR / f"{clip['clip_slug']}.mp4"
        if destination.exists() and not args.force:
            print(f"skip (exists) {destination.name}")
            continue

        command = [
            ffmpeg,
            "-y",
            "-i",
            str(source),
            "-vf",
            f"scale=-2:{settings['height']},fps={settings['fps']}",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            str(settings["crf"]),
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
        ]
        command += ["-an"] if not settings.get("audio") else ["-c:a", "aac", "-b:a", "64k"]
        command.append(str(destination))

        print(f"transcoding {clip['slice_id']} -> {destination.name}")
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            print(result.stderr[-2000:], file=sys.stderr)
            return result.returncode
        size_mb = destination.stat().st_size / 1e6
        print(f"  {size_mb:.1f} MB")
        made += 1

    if made == 0:
        print(f"No raw sources found in {RAW_DIR}. Run fetch_lsv.py first.")
        return 1
    print(f"\n{made} clip(s) written to {CLIPS_DIR}")
    print("Next: python demo/scripts/build_gold.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
