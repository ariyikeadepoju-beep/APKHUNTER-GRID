from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.community import Community, CommunityRule
from app.models.lead import Lead
from app.models.outreach import MessageDraft, MessageDeliveryLog
from app.models.audit import AuditLog

router = APIRouter(prefix="/dashboard", tags=["Overview Dashboard"])


@router.get("/")
@router.get("")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Real database counts
    total_communities = db.query(Community).count()
    reviewed_communities = db.query(Community).filter(Community.review_status != "Unreviewed").count()
    approved_communities = db.query(Community).join(CommunityRule).filter(
        CommunityRule.advertising_policy.in_(["Permitted"]),
        Community.review_status == "Reviewed - Suitable"
    ).count()

    total_leads = db.query(Lead).count()
    high_priority_leads = db.query(Lead).filter(Lead.lead_score >= 80.0).count()
    pending_approvals = db.query(MessageDraft).filter(MessageDraft.approval_status == "Pending Review").count()
    
    messages_sent = db.query(MessageDeliveryLog).filter(
        MessageDeliveryLog.delivery_status.like("Success%")
    ).count()
    
    replies_count = db.query(Lead).filter(Lead.status.in_(["Replied", "Interested"])).count()
    qualified_opportunities = db.query(Lead).filter(Lead.status.in_(["Qualified", "Contact authorized", "Interested", "Converted"])).count()

    # 2. Lead conversion funnel
    funnel = [
        {"stage": "Discovered", "count": total_leads, "color": "#3B82F6"},
        {"stage": "Needs Review", "count": db.query(Lead).filter(Lead.status.in_(["New", "Needs review"])).count(), "color": "#60A5FA"},
        {"stage": "Qualified", "count": db.query(Lead).filter(Lead.status == "Qualified").count(), "color": "#06B6D4"},
        {"stage": "Contact Authorized", "count": db.query(Lead).filter(Lead.status == "Contact authorized").count(), "color": "#10B981"},
        {"stage": "Contacted / In Discussion", "count": db.query(Lead).filter(Lead.status.in_(["Draft prepared", "Contacted", "Replied"])).count(), "color": "#8B5CF6"},
        {"stage": "Interested / Converted", "count": db.query(Lead).filter(Lead.status.in_(["Interested", "Converted"])).count(), "color": "#EC4899"}
    ]

    # 3. Weekly performance (Last 7 days real records)
    now = datetime.now(timezone.utc)
    weekly_perf = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_start = datetime(day_date.year, day_date.month, day_date.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        
        leads_day = db.query(Lead).filter(Lead.created_at >= day_start, Lead.created_at < day_end).count()
        deliveries_day = db.query(MessageDeliveryLog).filter(
            MessageDeliveryLog.delivered_at >= day_start,
            MessageDeliveryLog.delivered_at < day_end
        ).count()
        approvals_day = db.query(MessageDraft).filter(
            MessageDraft.approval_status == "Approved",
            MessageDraft.updated_at >= day_start,
            MessageDraft.updated_at < day_end
        ).count()

        weekly_perf.append({
            "day": day_date.strftime("%a"),
            "date": day_date.strftime("%b %d"),
            "new_leads": leads_day,
            "posts_dispatched": deliveries_day,
            "approvals": approvals_day
        })

    # 4. Recent audit activity
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()
    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.created_at.isoformat() if log.created_at else None
        }
        for log in recent_logs
    ]

    return {
        "total_discovered_communities": total_communities,
        "communities_reviewed": reviewed_communities,
        "communities_approved_outreach": approved_communities,
        "total_saved_leads": total_leads,
        "high_priority_leads": high_priority_leads,
        "pending_message_approvals": pending_approvals,
        "messages_sent_authorized_channels": messages_sent,
        "replies_and_positive_responses": replies_count,
        "qualified_opportunities": qualified_opportunities,
        "lead_conversion_funnel": funnel,
        "weekly_performance": weekly_perf,
        "recent_activity": recent_activity
    }
