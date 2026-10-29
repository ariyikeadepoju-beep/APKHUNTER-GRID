from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    target_service = Column(String(100), nullable=False)
    target_criteria = Column(Text, nullable=True)
    template_id = Column(Integer, ForeignKey("outreach_templates.id", ondelete="SET NULL"), nullable=True)
    
    # Status progression: Draft -> Pending approval -> Approved -> Active -> Completed (or Paused/Cancelled)
    status = Column(String(50), default="Draft", index=True)
    max_approved_posts = Column(Integer, default=5)
    posts_sent_count = Column(Integer, default=0)
    
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    template = relationship("OutreachTemplate", back_populates="campaigns")
    targets = relationship("CampaignTarget", back_populates="campaign", cascade="all, delete-orphan")
    drafts = relationship("MessageDraft", back_populates="campaign")


class CampaignTarget(Base, TimestampMixin):
    __tablename__ = "campaign_targets"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    channel_id = Column(Integer, ForeignKey("discord_channels.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Pending")  # Pending, Approved, Sent, Failed, Skipped

    campaign = relationship("Campaign", back_populates="targets")
    community = relationship("Community", back_populates="campaign_targets")
