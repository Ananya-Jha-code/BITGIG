"""Local-disk file storage for the demo. Swap for a bucket if we deploy for real."""

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"
DEMO_DIR = BACKEND_DIR.parent / "demo"

UPLOAD_DIR.mkdir(exist_ok=True)


def save_upload(file: UploadFile) -> tuple[Path, str]:
    """Save an uploaded file. Returns (path on disk, public URL path).

    The original filename is kept after a short prefix so the AI cache can
    still be looked up by the video's name.
    """
    name = f"{uuid4().hex[:8]}_{Path(file.filename or 'upload').name}"
    path = UPLOAD_DIR / name
    with path.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    return path, f"/uploads/{name}"
