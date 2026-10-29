from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class DiscordInstallation(Base, TimestampMixin):
    __tablename__ = "discord_installations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True)
    client_id = Column(String(100), nullable=True)
    bot_token_encrypted = Column(Text, nullable=True)
    public_key = Column(String(100), nullable=True)
    bot_username = Column(String(100), nullable=True)
    bot_avatar_url = Column(String(255), nullable=True)
    bot_status = Column(String(50), default="offline")  # online, offline, error, configuring
    last_heartbeat = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    workspace = relationship("Workspace", back_populates="discord_installation")


class DiscordGuild(Base, TimestampMixin):
    __tablename__ = "discord_guilds"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(50), unique=True, index=True, nullable=False)  # Discord Snowflake ID
    name = Column(String(150), nullable=False)
    icon_url = Column(String(255), nullable=True)
    member_count = Column(Integer, default=0)
    approximate_presence_count = Column(Integer, default=0)
    is_bot_present = Column(Boolean, default=False)
    is_authorized = Column(Boolean, default=False)  # Explicit operator authorization
    authorized_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    channels = relationship("DiscordChannel", back_populates="guild", cascade="all, delete-orphan")
    community = relationship("Community", back_populates="discord_guild", uselist=False)


class DiscordChannel(Base, TimestampMixin):
    __tablename__ = "discord_channels"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(String(50), unique=True, index=True, nullable=False)  # Discord Snowflake ID
    guild_id = Column(Integer, ForeignKey("discord_guilds.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    channel_type = Column(String(50), default="text")  # text, news, forum, voice
    topic = Column(Text, nullable=True)
    
    # Safeguard: Promotional messages can ONLY be sent if is_promotional_approved == True
    is_promotional_approved = Column(Boolean, default=False, nullable=False)
    bot_can_send = Column(Boolean, default=True)
    bot_can_embed = Column(Boolean, default=True)
    bot_can_read = Column(Boolean, default=True)
    approved_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)

    guild = relationship("DiscordGuild", back_populates="channels")
    drafts = relationship("MessageDraft", back_populates="target_channel")
