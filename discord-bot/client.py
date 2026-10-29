import discord
from discord.ext import commands
import logging
from config import bot_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("apkhunter.bot")

intents = discord.Intents.default()
intents.guilds = True

bot = commands.Bot(command_prefix=bot_config.COMMAND_PREFIX, intents=intents)


@bot.event
async def on_ready():
    logger.info(f"Official APK Hunter Grid Bot connected as {bot.user} (ID: {bot.user.id})")
    logger.info(f"Connected Guilds: {len(bot.guilds)}")
    for guild in bot.guilds:
        logger.info(f" - Guild: {guild.name} (ID: {guild.id}) | Members: {guild.member_count}")


@bot.event
async def on_guild_join(guild: discord.Guild):
    logger.info(f"Bot joined new guild: {guild.name} (ID: {guild.id}). Awaiting human operator authorization.")


@bot.command(name="ping")
async def ping(ctx: commands.Context):
    """Diagnostic latency command."""
    latency_ms = round(bot.latency * 1000)
    await ctx.send(f"🏓 **APK Hunter Grid Bot** — Gateway Latency: `{latency_ms}ms` | System Operational")


@bot.command(name="status")
async def status(ctx: commands.Context):
    """Displays operator authorization and compliance status."""
    embed = discord.Embed(
        title="APK Hunter Grid Official Bot Diagnostic",
        description="B2B Prospect Intelligence & Streaming Infrastructure Service Agent",
        color=0x06B6D4
    )
    embed.add_field(name="Current Guild", value=ctx.guild.name, inline=True)
    embed.add_field(name="Channel", value=f"#{ctx.channel.name}", inline=True)
    embed.add_field(name="Compliance", value="Permission-Based / Anti-Spam Safeguards Active", inline=False)
    embed.set_footer(text="APK Hunter Grid • Human-in-the-Loop Architecture")
    await ctx.send(embed=embed)
