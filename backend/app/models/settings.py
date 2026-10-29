from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base
from app.models.base import TimestampMixin


class ApplicationSetting(Base, TimestampMixin):
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)  # JSON serialized
    description = Column(String(255), nullable=True)
