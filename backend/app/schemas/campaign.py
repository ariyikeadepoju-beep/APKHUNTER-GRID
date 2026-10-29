from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CampaignTargetCreate(BaseModel):
    community_id: int
    channel_id: Optional[int] = None


class CampaignTargetResponse(BaseModel):
    id: int
    campaign_id: int
    community_id: int
    channel_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    name: str
    target_service: str
    target_criteria: Optional[str] = None
    template_id: Optional[int] = None
    max_approved_posts: int = 5
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_community_ids: List[int] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    target_service: Optional[str] = None
    status: Optional[str] = None
    max_approved_posts: Optional[int] = None


class CampaignResponse(BaseModel):
    id: int
    name: str
    target_service: str
    target_criteria: Optional[str] = None
    template_id: Optional[int] = None
    status: str
    max_approved_posts: int
    posts_sent_count: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    targets: List[CampaignTargetResponse] = []

    class Config:
        from_attributes = True
