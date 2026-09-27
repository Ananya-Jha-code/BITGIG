"""Download only the LSV files listed in demo/manifest.json.

The full LSV dataset is ~315 GB. Never clone it. This pulls the handful of source
videos we actually use into demo/videos/raw/ (gitignored).

    python demo/scripts/fetch_lsv.py --list
    python demo/scripts/fetch_lsv.py
    python demo/scripts/fetch_lsv.py --slice DJI-036 --slice DJI-082
    python demo/scripts/fetch_lsv.py --all
"""

from __future__ import annotations

import argparse
import shutil
import sys

from lsv import RAW_DIR, iter_clips, load_manifest

REPO_ID = "YinkaiW/LSV"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slice", action="append", default=[], help="LSV Slice_ID to fetch; repeatable")
    parser.add_argument("--all", action="store_true", help="fetch every clip in the manifest, not just download:true")
    parser.add_argument("--list", action="store_true", help="print the download plan and exit")
    parser.add_argument("--protocols", action="store_true", help="also fetch the raw LSV protocol text files")
    args = parser.parse_args()

    manifest = load_manifest()
    wanted = set(args.slice)
    selected = [
        clip
        for _gig, clip in iter_clips(manifest, include_broll=True)
        if (clip["slice_id"] in wanted if wanted else (args.all or clip.get("download")))
    ]

    if not selected:
        print("Nothing selected. Try --list to see available slices.")
        return 1

    total_mb = sum(clip.get("source_size_mb") or 0 for clip in selected)
    print(f"{len(selected)} file(s), about {total_mb / 1024:.2f} GB (sizes are unknown for some slices)")
    for clip in selected:
        size = clip.get("source_size_mb")
        size_text = f"{size:>7.1f} MB" if size else "      ? MB"
        print(f"  {clip['slice_id']:<9} {size_text}  {clip['source_file']}")
    if args.list:
        return 0

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("\nMissing dependency. Run: pip install -r demo/scripts/requirements.txt", file=sys.stderr)
        return 1

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for clip in selected:
        destination = RAW_DIR / clip["source_file"].split("/")[-1]
        if destination.exists():
            print(f"skip (already present) {destination.name}")
            continue
        print(f"downloading {clip['slice_id']} -> {destination.name}")
        cached = hf_hub_download(
            repo_id=REPO_ID,
            repo_type="dataset",
            filename=clip["source_file"],
        )
        shutil.copy2(cached, destination)

    if args.protocols:
        protocol_dir = RAW_DIR.parent.parent / "sops" / "lsv_original"
        protocol_dir.mkdir(parents=True, exist_ok=True)
        for relative in ("DJI/DJI-Protocol/Mock_Cas9_Delivery.txt", "DJI/DJI-Protocol/Mock_Transformation.txt"):
            cached = hf_hub_download(repo_id=REPO_ID, repo_type="dataset", filename=relative)
            shutil.copy2(cached, protocol_dir / relative.split("/")[-1])
        print(f"protocol text copied to {protocol_dir}")

    print(f"\nDone. Next: python demo/scripts/make_clips.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
