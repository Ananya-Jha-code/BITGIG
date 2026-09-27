import os
from collections.abc import Iterator

from dotenv import load_dotenv
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app import models  # noqa: F401  (registers tables on SQLModel.metadata)

load_dotenv()

# Supabase: Project Settings -> Database -> Connection string (Session pooler, URI).
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 15})


def init_db() -> None:
    """Create any missing tables. No migrations; fine for a hackathon."""
    SQLModel.metadata.create_all(engine)
    # create_all never alters existing tables, so add columns introduced later by hand.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS video_url VARCHAR"))


def get_session() -> Iterator[Session]:
    """FastAPI dependency: `session: Session = Depends(get_session)`."""
    with Session(engine) as session:
        yield session
