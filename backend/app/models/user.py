from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    discord_installation = relationship("DiscordInstallation", back_populates="workspace", uselist=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(50), default="operator", nullable=False)  # admin, operator, reviewer
    is_active = Column(Boolean, default=True, nullable=False)

    workspace = relationship("Workspace", back_populates="users")
    created_drafts = relationship("MessageDraft", back_populates="created_by_user", foreign_keys="MessageDraft.created_by_user_id")
    approvals = relationship("MessageApproval", back_populates="approver_user")
