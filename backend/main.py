from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI
from sqlmodel import Field, SQLModel, create_engine, Session, select


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


# 4. APIエンドポイントの追加
@app.post("/api/logs", response_model=Log)
def create_log(log: Log):
    with Session(engine) as session:
        session.add(log)
        session.commit()
        session.refresh(log)
        return log

@app.get("/api/stats", response_model=List[Log])
def read_logs():
    with Session(engine) as session:
        logs = session.exec(select(Log)).all()
        return logs
