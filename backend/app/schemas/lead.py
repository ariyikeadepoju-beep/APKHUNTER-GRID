from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class LeadEvidenceCreate(BaseModel):
    signal_type: str
    description: str
    source_url: Optional[str] = None
    signal_date: Optional[datetime] = None


class LeadEvidenceResponse(LeadEvidenceCreate):
    id: int
    lead_id: int
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LeadScoreResponse(BaseModel):
    id: int
    lead_id: int
    expressed_need_score: float
    business_activity_score: float
    service_match_score: float
    signal_recency_score: float
    permission_score: float
    total_score: float
    explanation: str

    class Config:
        from_attributes = True


class LeadServiceMatchResponse(BaseModel):
    id: int
    lead_id: int
    recommended_service: str
    match_strength: str
    evidence_rationale: str

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    display_name: str
    business_name: Optional[str] = None
    discord_user_id: Optional[str] = None
    contact_url: Optional[str] = None
    discovery_source: str
    community_id: Optional[int] = None
    service_interest: str = "App Rebranding"
    confidence_level: str = "Medium"
    outreach_eligibility: str = "Needs Permission"
    status: str = "New"
    follow_up_date: Optional[datetime] = None
    internal_notes: Optional[str] = None


class LeadCreate(LeadBase):
    initial_evidence: Optional[str] = None


class LeadUpdate(BaseModel):
    display_name: Optional[str] = None
    business_name: Optional[str] = None
    contact_url: Optional[str] = None
    service_interest: Optional[str] = None
    confidence_level: Optional[str] = None
    outreach_eligibility: Optional[str] = None
    status: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    internal_notes: Optional[str] = None


class LeadResponse(LeadBase):
    id: int
    lead_score: float
    created_at: datetime
    updated_at: datetime
    evidences: List[LeadEvidenceResponse] = []
    score_details: Optional[LeadScoreResponse] = None
    service_matches: List[LeadServiceMatchResponse] = []

    class Config:
        from_attributes = True
