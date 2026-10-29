from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class DiscoverySource(Base, TimestampMixin):
    __tablename__ = "discovery_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), default="directory")  # directory, manual_invite, github, index
    url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    discovered_count = Column(Integer, default=0)

    communities = relationship("Community", back_populates="discovery_source")


class Community(Base, TimestampMixin):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    invite_code = Column(String(50), unique=True, index=True, nullable=False)
    invite_url = Column(String(255), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Streaming Infrastructure")  
    member_count = Column(Integer, default=0)
    language = Column(String(20), default="en")
    region = Column(String(50), default="Global")
    
    # Suitability & Fit evaluation
    suitability_score = Column(Float, default=0.0)  # 0 to 100
    fit_tier = Column(String(50), default="Needs review")  # Excellent fit, Good fit, Possible fit, Poor fit, Needs review
    review_status = Column(String(50), default="Unreviewed")  # Unreviewed, Reviewed - Suitable, Reviewed - Ineligible, Archived
    
    discovery_source_id = Column(Integer, ForeignKey("discovery_sources.id", ondelete="SET NULL"), nullable=True)
    discord_guild_id = Column(Integer, ForeignKey("discord_guilds.id", ondelete="SET NULL"), nullable=True)
    
    tags = Column(Text, nullable=True)  # Comma-separated or JSON list
    notes = Column(Text, nullable=True)

    discovery_source = relationship("DiscoverySource", back_populates="communities")
    discord_guild = relationship("DiscordGuild", back_populates="community")
    rules = relationship("CommunityRule", back_populates="community", uselist=False, cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="community")
    drafts = relationship("MessageDraft", back_populates="community")
    campaign_targets = relationship("CampaignTarget", back_populates="community")


class CommunityRule(Base, TimestampMixin):
    __tablename__ = "community_rules"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Promotion moderation policy
    advertising_policy = Column(String(50), default="Not Yet Reviewed")  # Permitted, Requires Admin Approval, Strictly Prohibited, Not Yet Reviewed
    rule_summary = Column(Text, nullable=True)
    rules_source = Column(String(100), nullable=True)  # #rules-channel, pinned-message, server-guide, admin-dm
    admin_permission_granted = Column(Boolean, default=False)
    admin_permission_proof = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_checked_at = Column(DateTime, nullable=True)

    community = relationship("Community", back_populates="rules")
