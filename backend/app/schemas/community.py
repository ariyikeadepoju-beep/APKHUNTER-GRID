from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CommunityRuleBase(BaseModel):
    advertising_policy: str = "Not Yet Reviewed"
    rule_summary: Optional[str] = None
    rules_source: Optional[str] = None
    admin_permission_granted: bool = False
    admin_permission_proof: Optional[str] = None


class CommunityRuleResponse(CommunityRuleBase):
    id: int
    community_id: int
    verified_by_user_id: Optional[int] = None
    last_checked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunityBase(BaseModel):
    invite_code: str
    invite_url: str
    name: str
    description: Optional[str] = None
    category: str = "Streaming Infrastructure"
    member_count: int = 0
    language: str = "en"
    region: str = "Global"
    tags: Optional[str] = None
    notes: Optional[str] = None


class CommunityCreate(CommunityBase):
    discovery_source_id: Optional[int] = None


class CommunityInviteSubmit(BaseModel):
    invite_url_or_code: str
    category: Optional[str] = "Streaming Infrastructure"
    notes: Optional[str] = None


class CommunityResponse(CommunityBase):
    id: int
    suitability_score: float
    fit_tier: str
    review_status: str
    discovery_source_id: Optional[int] = None
    discord_guild_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    rules: Optional[CommunityRuleResponse] = None

    class Config:
        from_attributes = True


class CommunityReviewUpdate(BaseModel):
    review_status: str  # Unreviewed, Reviewed - Suitable, Reviewed - Ineligible, Archived
    suitability_score: Optional[float] = None
    fit_tier: Optional[str] = None
    notes: Optional[str] = None


class DiscoverySourceResponse(BaseModel):
    id: int
    name: str
    source_type: str
    url: Optional[str] = None
    is_active: bool
    discovered_count: int

    class Config:
        from_attributes = True
