import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User, Workspace
from app.models.discord import DiscordInstallation
from app.models.settings import ApplicationSetting
from app.models.audit import AuditLog
from app.services.discord_service import mask_token

router = APIRouter(prefix="/settings", tags=["Settings & Platform Configuration"])


@router.get("/")
@router.get("")
def get_settings(db: Session = Depends(get_db)):
    workspace = db.query(Workspace).first()
    installation = db.query(DiscordInstallation).first()
    weights_setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "scoring_weights").first()
    retention_setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "data_retention_days").first()

    raw_token = installation.bot_token_encrypted if installation else settings.DISCORD_BOT_TOKEN
    client_id = installation.client_id if installation and installation.client_id else settings.DISCORD_CLIENT_ID

    return {
        "workspace": {
            "name": workspace.name if workspace else "APK Hunter HQ",
            "slug": workspace.slug if workspace else "apk-hunter-hq",
            "database_type": "SQLite (WAL Mode)" if settings.is_sqlite() else "PostgreSQL"
        },
        "discord": {
            "client_id": client_id,
            "bot_token_configured": bool(raw_token and len(raw_token) > 10),
            "bot_token_masked": mask_token(raw_token),
            "bot_status": installation.bot_status if installation else "offline",
            "oauth_redirect_uri": settings.DISCORD_REDIRECT_URI
        },
        "scoring_weights": json.loads(weights_setting.value) if weights_setting else None,
        "data_retention_days": int(retention_setting.value) if retention_setting else 180,
        "setup_guide": {
            "step_1": "Go to the Discord Developer Portal: https://discord.com/developers/applications",
            "step_2": "Create a New Application named 'APK Hunter Grid Bot'.",
            "step_3": "Under 'Bot', enable 'Server Members Intent' and 'Message Content Intent' if needed.",
            "step_4": "Reset and copy your Bot Token into the input below.",
            "step_5": "Under 'OAuth2 URL Generator', select scopes 'bot' and 'applications.commands', with permissions: Send Messages, View Channels, Embed Links.",
            "step_6": "Authorize the bot to your private staging guild to begin testing."
        }
    }


@router.post("/discord-credentials")
def update_discord_credentials(
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    installation = db.query(DiscordInstallation).first()
    if not installation:
        workspace = db.query(Workspace).first()
        installation = DiscordInstallation(workspace_id=workspace.id if workspace else 1)
        db.add(installation)

    if "client_id" in payload and payload["client_id"]:
        installation.client_id = payload["client_id"].strip()
    if "bot_token" in payload and payload["bot_token"]:
        installation.bot_token_encrypted = payload["bot_token"].strip()
        installation.bot_status = "online"

    db.add(AuditLog(
        user_id=current_admin.id,
        action="UPDATE_DISCORD_CREDENTIALS",
        resource_type="DiscordInstallation",
        resource_id=str(installation.id),
        details=f"Updated Discord configuration. Client ID: {installation.client_id}. Token masked: {mask_token(installation.bot_token_encrypted)}"
    ))
    db.commit()
    return {"status": "success", "message": "Discord credentials updated successfully."}
