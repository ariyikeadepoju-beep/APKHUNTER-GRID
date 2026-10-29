from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., 'APPROVE_MESSAGE', 'REJECT_MESSAGE', 'CHANGE_POLICY'
    resource_type = Column(String(100), nullable=False)  # 'MessageDraft', 'Community', 'Lead'
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)  # JSON representation of changes or arguments
    ip_address = Column(String(50), nullable=True)

    user = relationship("User")


class FollowUpTask(Base, TimestampMixin):
    __tablename__ = "follow_up_tasks"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Completed, Cancelled
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    lead = relationship("Lead")
    assigned_user = relationship("User")
