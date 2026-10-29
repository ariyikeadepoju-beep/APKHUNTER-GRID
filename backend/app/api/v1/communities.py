from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.community import Community, CommunityRule
from app.models.audit import AuditLog
from app.schemas.community import CommunityResponse, CommunityReviewUpdate, CommunityRuleBase, CommunityRuleResponse

router = APIRouter(prefix="/communities", tags=["Server Intelligence & Communities"])


@router.get("/", response_model=List[CommunityResponse])
@router.get("", response_model=List[CommunityResponse])
def get_communities(
    category: Optional[str] = Query(None),
    fit_tier: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Community)
    if category:
        q = q.filter(Community.category == category)
    if fit_tier:
        q = q.filter(Community.fit_tier == fit_tier)
    if review_status:
        q = q.filter(Community.review_status == review_status)
    return q.order_by(Community.suitability_score.desc()).all()


@router.get("/{id}", response_model=CommunityResponse)
def get_community(id: int, db: Session = Depends(get_db)):
    c = db.query(Community).filter(Community.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return c


@router.put("/{id}/review", response_model=CommunityResponse)
def update_community_review(
    id: int,
    payload: CommunityReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Community).filter(Community.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")

    c.review_status = payload.review_status
    if payload.suitability_score is not None:
        c.suitability_score = payload.suitability_score
    if payload.fit_tier is not None:
        c.fit_tier = payload.fit_tier
    if payload.notes is not None:
        c.notes = payload.notes

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_COMMUNITY_REVIEW",
        resource_type="Community",
        resource_id=str(c.id),
        details=f"Review status set to '{c.review_status}'. Fit tier: '{c.fit_tier}'."
    ))
    db.commit()
    db.refresh(c)
    return c


@router.put("/{id}/rules", response_model=CommunityRuleResponse)
def update_community_rules(
    id: int,
    payload: CommunityRuleBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Community).filter(Community.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")

    rule = db.query(CommunityRule).filter(CommunityRule.community_id == id).first()
    if not rule:
        rule = CommunityRule(community_id=id)
        db.add(rule)

    rule.advertising_policy = payload.advertising_policy
    rule.rule_summary = payload.rule_summary
    rule.rules_source = payload.rules_source
    rule.admin_permission_granted = payload.admin_permission_granted
    rule.admin_permission_proof = payload.admin_permission_proof
    rule.verified_by_user_id = current_user.id
    rule.last_checked_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_COMMUNITY_RULES",
        resource_type="CommunityRule",
        resource_id=str(c.id),
        details=f"Updated promotion policy to '{rule.advertising_policy}'. Admin permission: {rule.admin_permission_granted}"
    ))
    db.commit()
    db.refresh(rule)
    return rule
