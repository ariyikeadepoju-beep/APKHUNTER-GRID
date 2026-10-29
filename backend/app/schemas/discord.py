from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class DiscordChannelResponse(BaseModel):
    id: int
    channel_id: str
    guild_id: int
    name: str
    channel_type: str
    topic: Optional[str] = None
    is_promotional_approved: bool
    bot_can_send: bool
    bot_can_embed: bool
    bot_can_read: bool
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None

    class Config:
        from_attributes = True


class DiscordGuildResponse(BaseModel):
    id: int
    guild_id: str
    name: str
    icon_url: Optional[str] = None
    member_count: int
    approximate_presence_count: int
    is_bot_present: bool
    is_authorized: bool
    authorized_at: Optional[datetime] = None
    notes: Optional[str] = None
    channels: List[DiscordChannelResponse] = []

    class Config:
        from_attributes = True


class ChannelApprovalUpdate(BaseModel):
    is_promotional_approved: bool
    approval_notes: Optional[str] = None


class GuildAuthorizationUpdate(BaseModel):
    is_authorized: bool
    notes: Optional[str] = None


class DiscordBotStatusResponse(BaseModel):
    bot_username: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    bot_status: str
    client_id: Optional[str] = None
    is_configured: bool
    authorized_guild_count: int
    total_guild_count: int
    approved_channel_count: int
    invite_url: Optional[str] = None


class SendTestMessageRequest(BaseModel):
    channel_id: str
    test_note: Optional[str] = "APK Hunter Grid Integration Diagnostic Test"
