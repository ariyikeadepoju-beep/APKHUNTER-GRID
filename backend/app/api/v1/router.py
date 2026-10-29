from fastapi import APIRouter
from app.api.v1 import (
    auth,
    dashboard,
    discovery,
    communities,
    leads,
    lead_scoring,
    services,
    outreach,
    approvals,
    campaigns,
    discord,
    analytics,
    settings,
    audit_logs
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(discovery.router)
api_router.include_router(communities.router)
api_router.include_router(leads.router)
api_router.include_router(lead_scoring.router)
api_router.include_router(services.router)
api_router.include_router(outreach.router)
api_router.include_router(approvals.router)
api_router.include_router(campaigns.router)
api_router.include_router(discord.router)
api_router.include_router(analytics.router)
api_router.include_router(settings.router)
api_router.include_router(audit_logs.router)
