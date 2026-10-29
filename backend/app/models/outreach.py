from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class OutreachTemplate(Base, TimestampMixin):
    __tablename__ = "outreach_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # first_time_intro, admin_permission_request, promotional_channel_post, inquiry_response, follow_up, app_rebranding_proposal, app_dev_proposal, reseller_panel_proposal, restream_inquiry
    subject = Column(String(200), nullable=True)
    body_template = Column(Text, nullable=False)
    compliance_notes = Column(Text, nullable=True)
    is_system_default = Column(Boolean, default=False)

    drafts = relationship("MessageDraft", back_populates="template")
    campaigns = relationship("Campaign", back_populates="template")


class MessageDraft(Base, TimestampMixin):
    __tablename__ = "message_drafts"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="SET NULL"), nullable=True)
    target_channel_id = Column(Integer, ForeignKey("discord_channels.id", ondelete="SET NULL"), nullable=True)
    template_id = Column(Integer, ForeignKey("outreach_templates.id", ondelete="SET NULL"), nullable=True)
    
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    
    # Strictly controlled status
    approval_status = Column(String(50), default="Draft", index=True)  # Draft, Pending Review, Approved, Rejected, Delivered
    is_duplicate_check_passed = Column(Boolean, default=True)
    
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    campaign = relationship("Campaign", back_populates="drafts")
    lead = relationship("Lead", back_populates="drafts")
    community = relationship("Community", back_populates="drafts")
    target_channel = relationship("DiscordChannel", back_populates="drafts")
    template = relationship("OutreachTemplate", back_populates="drafts")
    created_by_user = relationship("User", back_populates="created_drafts", foreign_keys=[created_by_user_id])
    approval = relationship("MessageApproval", back_populates="draft", uselist=False, cascade="all, delete-orphan")
    delivery_log = relationship("MessageDeliveryLog", back_populates="draft", uselist=False)


class MessageApproval(Base, TimestampMixin):
    __tablename__ = "message_approvals"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("message_drafts.id", ondelete="CASCADE"), nullable=False, unique=True)
    approver_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision = Column(String(20), nullable=False)  # Approved, Rejected
    comments = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=False)

    draft = relationship("MessageDraft", back_populates="approval")
    approver_user = relationship("User", back_populates="approvals")


class MessageDeliveryLog(Base, TimestampMixin):
    __tablename__ = "message_delivery_logs"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("message_drafts.id", ondelete="CASCADE"), nullable=False, unique=True)
    guild_id = Column(String(50), nullable=True)
    channel_id = Column(String(50), nullable=True)
    discord_message_id = Column(String(50), nullable=True)
    delivery_status = Column(String(50), nullable=False)  # Success, Failed, Blocked - Rule Violation, Blocked - Missing Permission
    error_details = Column(Text, nullable=True)
    delivered_at = Column(DateTime, nullable=False)

    draft = relationship("MessageDraft", back_populates="delivery_log")
