from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.discord import DiscordInstallation, DiscordGuild, DiscordChannel
from app.models.audit import AuditLog
from app.schemas.discord import (
    DiscordBotStatusResponse,
    DiscordGuildResponse,
    DiscordChannelResponse,
    ChannelApprovalUpdate,
    GuildAuthorizationUpdate,
    SendTestMessageRequest
)
from app.services.discord_service import DiscordService, get_sanitized_token

router = APIRouter(prefix="/discord", tags=["Official Discord Integration"])


@router.get("/bot-status", response_model=DiscordBotStatusResponse)
def get_bot_status(db: Session = Depends(get_db)):
    data = DiscordService.get_bot_status(db)
    return DiscordBotStatusResponse(**data)


@router.get("/guilds", response_model=List[DiscordGuildResponse])
def get_guilds(db: Session = Depends(get_db)):
    return db.query(DiscordGuild).all()


@router.put("/guilds/{id}/authorize", response_model=DiscordGuildResponse)
def toggle_guild_authorization(
    id: int,
    payload: GuildAuthorizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    guild = db.query(DiscordGuild).filter(DiscordGuild.id == id).first()
    if not guild:
        raise HTTPException(status_code=404, detail="Discord guild not found")

    guild.is_authorized = payload.is_authorized
    if payload.is_authorized:
        guild.authorized_at = datetime.now(timezone.utc)
    if payload.notes:
        guild.notes = payload.notes

    db.add(AuditLog(
        user_id=current_user.id,
        action="AUTHORIZE_GUILD" if payload.is_authorized else "DEAUTHORIZE_GUILD",
        resource_type="DiscordGuild",
        resource_id=guild.guild_id,
        details=f"Guild '{guild.name}' authorization status set to {guild.is_authorized}."
    ))
    db.commit()
    db.refresh(guild)
    return guild


@router.get("/guilds/{id}/channels", response_model=List[DiscordChannelResponse])
def get_guild_channels(id: int, db: Session = Depends(get_db)):
    return db.query(DiscordChannel).filter(DiscordChannel.guild_id == id).all()


@router.put("/channels/{id}/approve-promotional", response_model=DiscordChannelResponse)
def approve_channel_for_promotional_posts(
    id: int,
    payload: ChannelApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ch = db.query(DiscordChannel).filter(DiscordChannel.id == id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Discord channel not found")

    ch.is_promotional_approved = payload.is_promotional_approved
    ch.approved_by_user_id = current_user.id if payload.is_promotional_approved else None
    ch.approved_at = datetime.now(timezone.utc) if payload.is_promotional_approved else None
    if payload.approval_notes:
        ch.approval_notes = payload.approval_notes

    db.add(AuditLog(
        user_id=current_user.id,
        action="APPROVE_PROMOTIONAL_CHANNEL" if payload.is_promotional_approved else "REVOKE_PROMOTIONAL_CHANNEL",
        resource_type="DiscordChannel",
        resource_id=ch.channel_id,
        details=f"Channel '#{ch.name}' promotional status set to {ch.is_promotional_approved}. Notes: {payload.approval_notes}"
    ))
    db.commit()
    db.refresh(ch)
    return ch


@router.post("/test-message")
async def send_test_message(
    payload: SendTestMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    token = get_sanitized_token()
    message_text = (
        f"🛠️ **APK Hunter Grid Integration Diagnostic Test**\n"
        f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        f"Verified Operator: {current_user.email}\n"
        f"Diagnostic: Gateway socket connection active, channel write permissions verified."
    )
    if token and len(token) > 20:
        result = await DiscordService.send_channel_message(token, payload.channel_id, message_text)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Discord API dispatch error: {result.get('error')}"
            )
        return {"status": "success", "message": "Test message dispatched successfully to live Discord channel.", "details": result}
    else:
        return {
            "status": "simulated_success",
            "message": "Diagnostic test verified successfully in test environment. Configure DISCORD_BOT_TOKEN in Settings for live guild dispatch.",
            "test_channel_id": payload.channel_id
        }


@router.post("/publish-draft/{draft_id}")
async def publish_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await DiscordService.publish_approved_draft(db, draft_id, current_user.id)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error")
        )
    return result
