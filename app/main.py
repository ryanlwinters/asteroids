import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.settings import settings

app = FastAPI(title=settings.APP_NAME)

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger(settings.APP_NAME)

@app.get("/healthz")
def health():
    return JSONResponse({"ok": True})

@app.get("/readyz")
def ready():
    return JSONResponse({"ready": True})

# Serve static frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")