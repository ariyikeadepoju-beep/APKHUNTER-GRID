from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.lead import Lead, LeadEvidence
from app.schemas.lead import LeadServiceMatchResponse
from app.services.service_matcher import SERVICES_CATALOG, match_services_for_lead

router = APIRouter(prefix="/services", tags=["Service Offerings & Matching"])


@router.get("/catalog")
def get_service_catalog():
    """
    Returns the 5 core business service offerings:
    1. IPTV subscription services
    2. Reseller panel solutions
    3. Authorized restream services
    4. IPTV/streaming application rebranding
    5. Custom streaming application development
    """
    return [
        {
            "id": "iptv-subscriptions",
            "name": "IPTV Subscription Services",
            "tagline": "High-availability premium streaming channels & VOD",
            "description": "Enterprise-grade stream delivery with 99.9% SLA, multi-audio tracks, full electronic program guide (EPG), and catchup functionality.",
            "target_buyer": "End users, hospitality venues, and private media clubs."
        },
        {
            "id": "reseller-panels",
            "name": "Reseller Panel Solutions",
            "tagline": "Turn-key multi-credit management & automated billing",
            "description": "Scalable reseller platforms with real-time connection monitoring, sub-reseller creation, credit top-up APIs, and automated provisioning.",
            "target_buyer": "Independent distributors, streaming entrepreneurs, and regional agents."
        },
        {
            "id": "restream-services",
            "name": "Authorized Restream Services",
            "tagline": "Dedicated raw feed capacity & high-bandwidth relays",
            "description": "High-throughput redundant media sources, multi-datacenter origin feeds, transcoded and raw HLS feeds with zero watermarks.",
            "target_buyer": "Platform operators and IPTV server administrators needing high concurrency."
        },
        {
            "id": "app-rebranding",
            "name": "IPTV / Streaming Application Rebranding",
            "tagline": "Custom white-label Android TV, Fire TV, & Mobile APKs",
            "description": "Full visual identity overhaul for industry-standard player cores: hardcoded multi-domain failovers, custom splash screens, app icons, and theme colors within 48 hours.",
            "target_buyer": "Panel operators and streaming businesses requiring branded user experiences."
        },
        {
            "id": "custom-app-development",
            "name": "Custom Streaming Application Development",
            "tagline": "Tailored multi-platform media player software engineering",
            "description": "From-scratch and modular player development using ExoPlayer, Flutter, and React Native for Android TV, FireStick, Apple TV, LG webOS, and Samsung Tizen.",
            "target_buyer": "Established OTT services and streaming networks needing proprietary software."
        }
    ]


@router.get("/match/{lead_id}", response_model=List[LeadServiceMatchResponse])
def get_matches_for_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    evidences = db.query(LeadEvidence).filter(LeadEvidence.lead_id == lead.id).all()
    matches = match_services_for_lead(lead, evidences)
    
    return [
        LeadServiceMatchResponse(
            id=i + 1,
            lead_id=lead.id,
            recommended_service=m["recommended_service"],
            match_strength=m["match_strength"],
            evidence_rationale=m["evidence_rationale"]
        )
        for i, m in enumerate(matches)
    ]
