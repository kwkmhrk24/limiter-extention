from typing import Optional
from datetime import datetime

from fastapi import FastAPI
from sqlmodel import Field, SQLModel, create_engine


# 1. データベースモデルの定義
class Log(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str
    duration_seconds: int
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


# 2. データベースエンジンの設定
DATABASE_URL = "sqlite:///database.db"
engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# 3. FastAPIアプリケーションの定義
app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {"message": "Hello from limiter-extention backend"}
