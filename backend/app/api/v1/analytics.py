import io
import csv
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.community import Community
from app.models.outreach import MessageDeliveryLog

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])


@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    qualified = db.query(Lead).filter(Lead.status.in_(["Qualified", "Contact authorized", "Draft prepared", "Contacted", "Replied", "Interested", "Converted"])).count()
    contacted = db.query(Lead).filter(Lead.status.in_(["Contacted", "Replied", "Interested", "Converted"])).count()
    converted = db.query(Lead).filter(Lead.status == "Converted").count()

    qualification_rate = round((qualified / total_leads * 100), 1) if total_leads > 0 else 0.0
    conversion_rate = round((converted / total_leads * 100), 1) if total_leads > 0 else 0.0

    # Leads by service
    service_breakdown = (
        db.query(Lead.service_interest, func.count(Lead.id))
        .group_by(Lead.service_interest)
        .all()
    )
    by_service = [{"service": s, "count": c} for s, c in service_breakdown]

    # Leads by status
    status_breakdown = (
        db.query(Lead.status, func.count(Lead.id))
        .group_by(Lead.status)
        .all()
    )
    by_status = [{"status": s, "count": c} for s, c in status_breakdown]

    return {
        "total_leads": total_leads,
        "qualified_leads": qualified,
        "contacted_leads": contacted,
        "converted_leads": converted,
        "qualification_rate_percent": qualification_rate,
        "conversion_rate_percent": conversion_rate,
        "by_service": by_service,
        "by_status": by_status
    }


@router.get("/export/leads-csv")
def export_leads_csv(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Lead ID", "Display Name", "Business Name", "Service Interest",
        "Lead Score", "Status", "Outreach Eligibility", "Confidence Level",
        "Discovery Source", "Contact URL", "Created Date"
    ])
    for l in leads:
        writer.writerow([
            l.id, l.display_name, l.business_name or "", l.service_interest,
            l.lead_score, l.status, l.outreach_eligibility, l.confidence_level,
            l.discovery_source, l.contact_url or "", l.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apk_hunter_leads.csv"}
    )


@router.get("/export/communities-csv")
def export_communities_csv(db: Session = Depends(get_db)):
    communities = db.query(Community).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Community ID", "Name", "Invite Code", "Category",
        "Member Count", "Suitability Score", "Fit Tier",
        "Review Status", "Created Date"
    ])
    for c in communities:
        writer.writerow([
            c.id, c.name, c.invite_code, c.category,
            c.member_count, c.suitability_score, c.fit_tier,
            c.review_status, c.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apk_hunter_communities.csv"}
    )
