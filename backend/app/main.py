import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.annotation.routes import router as annotation_router
from app.core.routes import router as core_router
from app.core.storage import DEMO_DIR, UPLOAD_DIR
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Don't let a database outage block startup: POST /ai/segment works without it.
    try:
        init_db()
    except Exception:
        logging.getLogger(__name__).exception("init_db failed; DB-backed endpoints will error until it's reachable")
    yield


app = FastAPI(lifespan=lifespan)

# Demo only: no auth, no cookies, so an open CORS policy is fine.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(core_router)
app.include_router(annotation_router)

# Videos: gig.video_url is a path under one of these mounts.
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/demo", StaticFiles(directory=DEMO_DIR), name="demo")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
