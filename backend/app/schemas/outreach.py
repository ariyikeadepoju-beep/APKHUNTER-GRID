from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class OutreachTemplateResponse(BaseModel):
    id: int
    name: str
    category: str
    subject: Optional[str] = None
    body_template: str
    compliance_notes: Optional[str] = None
    is_system_default: bool

    class Config:
        from_attributes = True


class MessageDraftCreate(BaseModel):
    campaign_id: Optional[int] = None
    lead_id: Optional[int] = None
    community_id: Optional[int] = None
    target_channel_id: Optional[int] = None
    template_id: Optional[int] = None
    subject: Optional[str] = None
    content: str


class MessageDraftUpdate(BaseModel):
    subject: Optional[str] = None
    content: Optional[str] = None
    target_channel_id: Optional[int] = None
    approval_status: Optional[str] = None


class MessageApprovalCreate(BaseModel):
    decision: str  # Approved or Rejected
    comments: Optional[str] = None


class MessageApprovalResponse(BaseModel):
    id: int
    draft_id: int
    approver_user_id: Optional[int] = None
    decision: str
    comments: Optional[str] = None
    decided_at: datetime

    class Config:
        from_attributes = True


class MessageDeliveryLogResponse(BaseModel):
    id: int
    draft_id: int
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    discord_message_id: Optional[str] = None
    delivery_status: str
    error_details: Optional[str] = None
    delivered_at: datetime

    class Config:
        from_attributes = True


class MessageDraftResponse(BaseModel):
    id: int
    campaign_id: Optional[int] = None
    lead_id: Optional[int] = None
    community_id: Optional[int] = None
    target_channel_id: Optional[int] = None
    template_id: Optional[int] = None
    subject: Optional[str] = None
    content: str
    approval_status: str
    is_duplicate_check_passed: bool
    created_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    approval: Optional[MessageApprovalResponse] = None
    delivery_log: Optional[MessageDeliveryLogResponse] = None

    class Config:
        from_attributes = True
