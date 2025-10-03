import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.settings import settings
from pathlib import Path

app = FastAPI(title=settings.APP_NAME)
static_dir = Path(__file__).resolve().parent.parent / "static"

logging.basicConfig(level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s %(message)s")

@app.get("/healthz")  # k8s liveness
def health(): return JSONResponse({"ok": True})

@app.get("/readyz")   # k8s readiness
def ready(): return JSONResponse({"ready": True})

# Home: portfolio
@app.get("/", response_class=HTMLResponse)
def home():
    return (static_dir / "portfolio.html").read_text()

# Play Asteroids
@app.get("/play", response_class=HTMLResponse)
def play():
    return (static_dir / "asteroids.html").read_text()

# Serve assets (css/js/images)
app.mount("/static", StaticFiles(directory=static_dir, html=False), name="static")