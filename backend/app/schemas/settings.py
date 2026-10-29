from typing import Dict, Any, Optional
from pydantic import BaseModel


class ScoringWeightsConfig(BaseModel):
    expressed_need_max: float = 30.0
    business_activity_max: float = 20.0
    service_match_max: float = 20.0
    signal_recency_max: float = 15.0
    permission_max: float = 15.0


class SettingItem(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Any

    class Config:
        from_attributes = True
