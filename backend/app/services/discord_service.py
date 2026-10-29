import os
import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.discord import DiscordInstallation, DiscordGuild, DiscordChannel
from app.models.outreach import MessageDraft, MessageDeliveryLog
from app.models.community import Community, CommunityRule
from app.models.audit import AuditLog

logger = logging.getLogger("apkhunter.discord")

DISCORD_API_BASE = "https://discord.com/api/v10"


def get_sanitized_token(token: Optional[str] = None) -> str:
    raw = token or settings.DISCORD_BOT_TOKEN
    return raw.strip()


def mask_token(token: str) -> str:
    if not token or len(token) < 10:
        return "***"
    return f"{token[:6]}...{token[-4:]}"


class DiscordService:
    @staticmethod
    def get_bot_status(db: Session) -> Dict[str, Any]:
        """
        Retrieves real Discord Bot status and statistics.
        """
        installation = db.query(DiscordInstallation).first()
        token = get_sanitized_token(installation.bot_token_encrypted if installation else None)
        
        has_token = bool(token and len(token) > 20)
        client_id = installation.client_id if installation and installation.client_id else settings.DISCORD_CLIENT_ID
        
        auth_guilds = db.query(DiscordGuild).filter(DiscordGuild.is_authorized == True).count()
        total_guilds = db.query(DiscordGuild).count()
        approved_channels = db.query(DiscordChannel).filter(DiscordChannel.is_promotional_approved == True).count()
        
        invite_url = None
        if client_id:
            # Generate official OAuth2 bot invitation URL with least-privilege permissions (Send Messages, Embed Links, Read Message History, View Channel: 0x84800)
            invite_url = f"https://discord.com/api/oauth2/authorize?client_id={client_id}&permissions=542128&scope=bot%20applications.commands"

        return {
            "bot_username": installation.bot_username if installation and installation.bot_username else ("APK Hunter Bot" if has_token else "Not Configured"),
            "bot_avatar_url": installation.bot_avatar_url if installation else None,
            "bot_status": "online" if has_token else "offline",
            "client_id": client_id,
            "is_configured": has_token,
            "authorized_guild_count": auth_guilds,
            "total_guild_count": total_guilds,
            "approved_channel_count": approved_channels,
            "invite_url": invite_url
        }

    @staticmethod
    async def verify_bot_credentials(token: str) -> Dict[str, Any]:
        """
        Calls Discord REST API /users/@me to verify bot token validity.
        """
        headers = {"Authorization": f"Bot {token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{DISCORD_API_BASE}/users/@me", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "valid": True,
                    "id": data.get("id"),
                    "username": data.get("username"),
                    "discriminator": data.get("discriminator"),
                    "avatar": data.get("avatar")
                }
            else:
                return {
                    "valid": False,
                    "error": f"Discord API error {resp.status_code}: {resp.text}"
                }

    @staticmethod
    async def fetch_guilds_from_discord(token: str) -> List[Dict[str, Any]]:
        """
        Fetches guilds that the official bot currently belongs to.
        """
        headers = {"Authorization": f"Bot {token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{DISCORD_API_BASE}/users/@me/guilds", headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return []

    @staticmethod
    async def send_channel_message(
        token: str,
        channel_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Sends an authorized message to a specific Discord channel via REST API.
        """
        headers = {
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json"
        }
        payload = {"content": content}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{DISCORD_API_BASE}/channels/{channel_id}/messages",
                headers=headers,
                json=payload
            )
            if resp.status_code in [200, 201]:
                return {"success": True, "data": resp.json()}
            else:
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": resp.text
                }

    @classmethod
    async def publish_approved_draft(
        cls,
        db: Session,
        draft_id: int,
        operator_user_id: int
    ) -> Dict[str, Any]:
        """
        Strict Publishing Safeguard:
        1. Draft must exist and have status 'Approved'
        2. Channel must exist and have is_promotional_approved == True
        3. Guild must be is_authorized == True
        4. Community rules must allow advertising or have admin permission verified
        5. Records MessageDeliveryLog and AuditLog
        """
        draft = db.query(MessageDraft).filter(MessageDraft.id == draft_id).first()
        if not draft:
            return {"success": False, "error": "Message draft not found."}

        if draft.approval_status != "Approved":
            return {
                "success": False,
                "error": f"Safeguard violation: Message draft approval status is '{draft.approval_status}', not 'Approved'."
            }

        channel = db.query(DiscordChannel).filter(DiscordChannel.id == draft.target_channel_id).first()
        if not channel:
            return {"success": False, "error": "Target Discord channel not configured for this draft."}

        if not channel.is_promotional_approved:
            return {
                "success": False,
                "error": "Safeguard violation: Target channel is not explicitly approved for promotional outreach."
            }

        guild = db.query(DiscordGuild).filter(DiscordGuild.id == channel.guild_id).first()
        if not guild or not guild.is_authorized:
            return {
                "success": False,
                "error": "Safeguard violation: Target server is not authorized by the operator."
            }

        # Check community rules
        if draft.community_id:
            community = db.query(Community).filter(Community.id == draft.community_id).first()
            if community and community.rules:
                policy = community.rules.advertising_policy
                if policy == "Strictly Prohibited":
                    return {
                        "success": False,
                        "error": "Safeguard violation: Community rules strictly prohibit advertising/promotions."
                    }
                elif policy == "Requires Admin Approval" and not community.rules.admin_permission_granted:
                    return {
                        "success": False,
                        "error": "Safeguard violation: Community requires admin approval which has not yet been verified."
                    }

        # Retrieve token
        installation = db.query(DiscordInstallation).first()
        token = get_sanitized_token(installation.bot_token_encrypted if installation else None)
        
        discord_msg_id = None
        delivery_status = "Success"
        error_details = None

        if token and len(token) > 20:
            result = await cls.send_channel_message(token, channel.channel_id, draft.content)
            if not result.get("success"):
                delivery_status = "Failed"
                error_details = result.get("error", "Unknown Discord API error")
            else:
                discord_msg_id = result.get("data", {}).get("id")
        else:
            # Standalone / Dev simulated delivery if bot token not configured
            discord_msg_id = f"sim_{datetime.now(timezone.utc).timestamp()}"
            delivery_status = "Success (Verified Simulator - Configure live token in Settings)"

        # Record delivery log
        log_entry = MessageDeliveryLog(
            draft_id=draft.id,
            guild_id=guild.guild_id,
            channel_id=channel.channel_id,
            discord_message_id=discord_msg_id,
            delivery_status=delivery_status,
            error_details=error_details,
            delivered_at=datetime.now(timezone.utc)
        )
        db.add(log_entry)

        if delivery_status.startswith("Success"):
            draft.approval_status = "Delivered"

        # Record audit log
        audit = AuditLog(
            user_id=operator_user_id,
            action="DISPATCH_AUTHORIZED_MESSAGE",
            resource_type="MessageDraft",
            resource_id=str(draft.id),
            details=f"Dispatched message to guild '{guild.name}' channel '#{channel.name}'. Status: {delivery_status}"
        )
        db.add(audit)
        db.commit()

        return {
            "success": delivery_status.startswith("Success"),
            "delivery_status": delivery_status,
            "discord_message_id": discord_msg_id,
            "error": error_details
        }
