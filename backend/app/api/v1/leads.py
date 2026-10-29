from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lead import Lead, LeadEvidence, LeadScore, LeadServiceMatch
from app.models.audit import AuditLog
from app.schemas.lead import (
    LeadResponse,
    LeadCreate,
    LeadUpdate,
    LeadEvidenceCreate,
    LeadEvidenceResponse
)
from app.services.scoring_engine import evaluate_lead_score
from app.services.service_matcher import match_services_for_lead

router = APIRouter(prefix="/leads", tags=["Lead Management & CRM"])


@router.get("/", response_model=List[LeadResponse])
@router.get("", response_model=List[LeadResponse])
def get_leads(
    q: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter((Lead.display_name.ilike(term)) | (Lead.business_name.ilike(term)) | (Lead.internal_notes.ilike(term)))
    if service:
        query = query.filter(Lead.service_interest == service)
    if status:
        query = query.filter(Lead.status == status)
    if min_score is not None:
        query = query.filter(Lead.lead_score >= min_score)

    return query.order_by(Lead.lead_score.desc()).all()


@router.post("/", response_model=LeadResponse)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = Lead(
        display_name=payload.display_name,
        business_name=payload.business_name,
        discord_user_id=payload.discord_user_id,
        contact_url=payload.contact_url,
        discovery_source=payload.discovery_source,
        community_id=payload.community_id,
        service_interest=payload.service_interest,
        confidence_level=payload.confidence_level,
        outreach_eligibility=payload.outreach_eligibility,
        status=payload.status,
        follow_up_date=payload.follow_up_date,
        internal_notes=payload.internal_notes
    )
    db.add(lead)
    db.flush()

    evidences = []
    if payload.initial_evidence:
        ev = LeadEvidence(
            lead_id=lead.id,
            signal_type="Initial Discovered Need",
            description=payload.initial_evidence,
            signal_date=datetime.now(timezone.utc),
            verified=True
        )
        db.add(ev)
        evidences.append(ev)
        db.flush()

    # Calculate transparent score
    total_score, breakdown, explanation = evaluate_lead_score(lead, evidences)
    lead.lead_score = total_score
    
    score_rec = LeadScore(
        lead_id=lead.id,
        expressed_need_score=breakdown["expressed_need_score"],
        business_activity_score=breakdown["business_activity_score"],
        service_match_score=breakdown["service_match_score"],
        signal_recency_score=breakdown["signal_recency_score"],
        permission_score=breakdown["permission_score"],
        total_score=total_score,
        explanation=explanation
    )
    db.add(score_rec)

    # Calculate service matches
    matches = match_services_for_lead(lead, evidences)
    for m in matches:
        db.add(LeadServiceMatch(
            lead_id=lead.id,
            recommended_service=m["recommended_service"],
            match_strength=m["match_strength"],
            evidence_rationale=m["evidence_rationale"]
        ))

    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_LEAD",
        resource_type="Lead",
        resource_id=str(lead.id),
        details=f"Created lead '{lead.display_name}' with score {total_score}."
    ))
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{id}", response_model=LeadResponse)
def get_lead(id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{id}", response_model=LeadResponse)
def update_lead(
    id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, val)

    # Re-evaluate score and matches
    evidences = db.query(LeadEvidence).filter(LeadEvidence.lead_id == lead.id).all()
    total_score, breakdown, explanation = evaluate_lead_score(lead, evidences)
    lead.lead_score = total_score

    score_rec = db.query(LeadScore).filter(LeadScore.lead_id == lead.id).first()
    if score_rec:
        score_rec.expressed_need_score = breakdown["expressed_need_score"]
        score_rec.business_activity_score = breakdown["business_activity_score"]
        score_rec.service_match_score = breakdown["service_match_score"]
        score_rec.signal_recency_score = breakdown["signal_recency_score"]
        score_rec.permission_score = breakdown["permission_score"]
        score_rec.total_score = total_score
        score_rec.explanation = explanation

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_LEAD",
        resource_type="Lead",
        resource_id=str(lead.id),
        details=f"Updated lead '{lead.display_name}'. Status: {lead.status}. Score: {total_score}."
    ))
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{id}/evidence", response_model=LeadEvidenceResponse)
def add_lead_evidence(
    id: int,
    payload: LeadEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    ev = LeadEvidence(
        lead_id=lead.id,
        signal_type=payload.signal_type,
        description=payload.description,
        source_url=payload.source_url,
        signal_date=payload.signal_date or datetime.now(timezone.utc),
        verified=True
    )
    db.add(ev)
    db.flush()

    # Recalculate score with new evidence
    evidences = db.query(LeadEvidence).filter(LeadEvidence.lead_id == lead.id).all()
    total_score, breakdown, explanation = evaluate_lead_score(lead, evidences)
    lead.lead_score = total_score

    score_rec = db.query(LeadScore).filter(LeadScore.lead_id == lead.id).first()
    if score_rec:
        score_rec.expressed_need_score = breakdown["expressed_need_score"]
        score_rec.business_activity_score = breakdown["business_activity_score"]
        score_rec.service_match_score = breakdown["service_match_score"]
        score_rec.signal_recency_score = breakdown["signal_recency_score"]
        score_rec.permission_score = breakdown["permission_score"]
        score_rec.total_score = total_score
        score_rec.explanation = explanation

    db.add(AuditLog(
        user_id=current_user.id,
        action="ADD_LEAD_EVIDENCE",
        resource_type="LeadEvidence",
        resource_id=str(ev.id),
        details=f"Added '{ev.signal_type}' evidence for lead '{lead.display_name}'. New score: {total_score}."
    ))
    db.commit()
    db.refresh(ev)
    return ev
