import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.settings import ApplicationSetting
from app.models.audit import AuditLog
from app.schemas.settings import ScoringWeightsConfig
from app.services.scoring_engine import DEFAULT_WEIGHTS

router = APIRouter(prefix="/lead-scoring", tags=["Lead Scoring Engine"])


@router.get("/weights", response_model=ScoringWeightsConfig)
def get_weights(db: Session = Depends(get_db)):
    setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "scoring_weights").first()
    if setting:
        data = json.loads(setting.value)
        return ScoringWeightsConfig(**data)
    return ScoringWeightsConfig(**DEFAULT_WEIGHTS)


@router.put("/weights", response_model=ScoringWeightsConfig)
def update_weights(
    payload: ScoringWeightsConfig,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "scoring_weights").first()
    if not setting:
        setting = ApplicationSetting(key="scoring_weights", description="Scoring criteria weights")
        db.add(setting)

    setting.value = json.dumps(payload.model_dump())
    
    db.add(AuditLog(
        user_id=current_admin.id,
        action="UPDATE_SCORING_WEIGHTS",
        resource_type="ApplicationSetting",
        resource_id="scoring_weights",
        details=f"Updated scoring weights: {setting.value}"
    ))
    db.commit()
    return payload
