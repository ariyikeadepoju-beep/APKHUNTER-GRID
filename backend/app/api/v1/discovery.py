from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.community import Community, DiscoverySource, CommunityRule
from app.models.audit import AuditLog
from app.schemas.community import CommunityResponse, CommunityInviteSubmit, DiscoverySourceResponse
from app.services.discovery_service import extract_invite_code, calculate_community_suitability

router = APIRouter(prefix="/discovery", tags=["Community Discovery"])


@router.get("/sources", response_model=List[DiscoverySourceResponse])
def get_sources(db: Session = Depends(get_db)):
    return db.query(DiscoverySource).filter(DiscoverySource.is_active == True).all()


@router.get("/search", response_model=List[CommunityResponse])
def search_communities(
    q: Optional[str] = Query(None, description="Search keyword in name or description"),
    category: Optional[str] = Query(None, description="Category filter"),
    fit_tier: Optional[str] = Query(None, description="Fit tier filter"),
    language: Optional[str] = Query(None, description="Language filter"),
    region: Optional[str] = Query(None, description="Region filter"),
    min_members: Optional[int] = Query(None, description="Minimum members"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Community)
    
    if q:
        term = f"%{q.strip()}%"
        query = query.filter((Community.name.ilike(term)) | (Community.description.ilike(term)) | (Community.tags.ilike(term)))
    if category:
        query = query.filter(Community.category == category)
    if fit_tier:
        query = query.filter(Community.fit_tier == fit_tier)
    if language:
        query = query.filter(Community.language == language)
    if region:
        query = query.filter(Community.region == region)
    if min_members is not None:
        query = query.filter(Community.member_count >= min_members)

    return query.order_by(Community.suitability_score.desc()).all()


@router.post("/submit-invite", response_model=CommunityResponse)
def submit_community_invite(
    payload: CommunityInviteSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    code = extract_invite_code(payload.invite_url_or_code)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Discord invite URL or invitation code."
        )

    # Duplicate check
    existing = db.query(Community).filter(Community.invite_code == code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Community with invite code '{code}' is already recorded in the database (ID: {existing.id})."
        )

    # Estimate or resolve metadata
    invite_url = f"https://discord.gg/{code}"
    # Formulate community name and evaluate suitability
    formatted_name = code.replace("-", " ").replace("_", " ").title()
    if not any(kw in formatted_name.lower() for kw in ["hub", "server", "community", "devs"]):
        formatted_name += " Community"

    estimated_members = 1500  # Default initial candidate estimate
    score, tier = calculate_community_suitability(
        name=formatted_name,
        description=payload.notes,
        member_count=estimated_members
    )

    # Source: manual invite
    manual_src = db.query(DiscoverySource).filter(DiscoverySource.source_type == "manual_invite").first()

    community = Community(
        invite_code=code,
        invite_url=invite_url,
        name=formatted_name,
        description=payload.notes or "Manually submitted community candidate for operator evaluation.",
        category=payload.category or "Streaming Infrastructure",
        member_count=estimated_members,
        suitability_score=score,
        fit_tier=tier,
        review_status="Unreviewed",
        discovery_source_id=manual_src.id if manual_src else None,
        notes=payload.notes
    )
    db.add(community)
    db.flush()

    # Create unreviewed rule record
    rule = CommunityRule(
        community_id=community.id,
        advertising_policy="Not Yet Reviewed",
        rule_summary="Awaiting operator verification of rules channel and advertising policy.",
        admin_permission_granted=False
    )
    db.add(rule)

    db.add(AuditLog(
        user_id=current_user.id,
        action="SUBMIT_COMMUNITY_INVITE",
        resource_type="Community",
        resource_id=str(community.id),
        details=f"Operator manually submitted invitation for '{formatted_name}' (Code: {code}). Suitability: {score} ({tier})"
    ))
    db.commit()
    db.refresh(community)
    return community
