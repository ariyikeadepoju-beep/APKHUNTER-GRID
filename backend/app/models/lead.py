from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(100), nullable=False)
    business_name = Column(String(150), nullable=True)
    discord_user_id = Column(String(50), nullable=True, index=True)  # Optional Discord ID when voluntarily provided
    contact_url = Column(String(255), nullable=True)  # Public business/portfolio/contact
    discovery_source = Column(String(100), nullable=False)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="SET NULL"), nullable=True)
    
    # Target Service & Quality Signals
    service_interest = Column(String(100), default="App Rebranding")  # IPTV Subscriptions, Reseller Panels, Restream Services, App Rebranding, Custom App Development
    confidence_level = Column(String(20), default="Medium")  # High, Medium, Low
    lead_score = Column(Float, default=0.0)  # 0 to 100
    
    # Outreach Compliance & Eligibility
    outreach_eligibility = Column(String(50), default="Needs Permission")  # Eligible - Explicit Inquiry, Eligible - Public Business Need, Needs Permission, Ineligible - Prohibited
    status = Column(String(50), default="New", index=True)  # New, Needs review, Qualified, Contact authorized, Draft prepared, Contacted, Replied, Interested, Not interested, Converted, Do not contact
    
    follow_up_date = Column(DateTime, nullable=True)
    internal_notes = Column(Text, nullable=True)

    community = relationship("Community", back_populates="leads")
    evidences = relationship("LeadEvidence", back_populates="lead", cascade="all, delete-orphan")
    score_details = relationship("LeadScore", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    service_matches = relationship("LeadServiceMatch", back_populates="lead", cascade="all, delete-orphan")
    drafts = relationship("MessageDraft", back_populates="lead")


class LeadEvidence(Base, TimestampMixin):
    __tablename__ = "lead_evidence"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    signal_type = Column(String(100), nullable=False)  # Explicit Inquiry, App Customization, Reseller Inquiry, Public Project Need, Profile Bio Signal
    description = Column(Text, nullable=False)
    source_url = Column(String(255), nullable=True)
    signal_date = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=True)

    lead = relationship("Lead", back_populates="evidences")


class LeadScore(Base, TimestampMixin):
    __tablename__ = "lead_scores"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Configurable breakdown criteria:
    expressed_need_score = Column(Float, default=0.0)      # 0 - 30
    business_activity_score = Column(Float, default=0.0)   # 0 - 20
    service_match_score = Column(Float, default=0.0)       # 0 - 20
    signal_recency_score = Column(Float, default=0.0)      # 0 - 15
    permission_score = Column(Float, default=0.0)          # 0 - 15
    
    total_score = Column(Float, default=0.0)               # 0 - 100
    explanation = Column(Text, nullable=False)

    lead = relationship("Lead", back_populates="score_details")


class LeadServiceMatch(Base, TimestampMixin):
    __tablename__ = "lead_service_matches"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    recommended_service = Column(String(100), nullable=False)
    match_strength = Column(String(20), default="Primary")  # Primary, Secondary, Alternative
    evidence_rationale = Column(Text, nullable=False)

    lead = relationship("Lead", back_populates="service_matches")
