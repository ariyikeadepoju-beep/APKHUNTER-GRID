import os
from pydantic_settings import BaseSettings


class BotConfig(BaseSettings):
    DISCORD_BOT_TOKEN: str = os.getenv("DISCORD_BOT_TOKEN", "")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api/v1")
    COMMAND_PREFIX: str = "!hunter "

    class Config:
        env_file = ".env"
        extra = "ignore"


bot_config = BotConfig()
