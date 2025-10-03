import os

class Settings:
    APP_NAME = os.getenv("APP_NAME", "asteroids")
    PORT = int(os.getenv("PORT", "8080"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()