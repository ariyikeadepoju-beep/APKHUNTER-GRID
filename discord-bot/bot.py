import asyncio
import logging
from client import bot
from config import bot_config

logger = logging.getLogger("apkhunter.bot.main")


def run():
    token = bot_config.DISCORD_BOT_TOKEN
    if not token or len(token) < 20:
        logger.warning(
            "DISCORD_BOT_TOKEN not configured or placeholder detected.\n"
            "The bot requires an official bot token from https://discord.com/developers/applications.\n"
            "Configure DISCORD_BOT_TOKEN in your environment or via the APK Hunter Grid Settings UI."
        )
        return

    try:
        logger.info("Connecting APK Hunter Grid Bot to Discord Gateway...")
        bot.run(token)
    except Exception as e:
        logger.error(f"Error launching Discord bot client: {e}")


if __name__ == "__main__":
    run()
