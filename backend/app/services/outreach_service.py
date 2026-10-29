from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.outreach import OutreachTemplate, MessageDraft
from app.models.lead import Lead
from app.models.community import Community


DEFAULT_TEMPLATES = [
    {
        "name": "Administrator Permission Request",
        "category": "admin_permission_request",
        "subject": "Community Commercial Guidelines Inquiry - {community_name}",
        "body_template": (
            "Hello {admin_name},\n\n"
            "I operate APK Hunter Grid, providing professional streaming application rebranding, custom OTT player development, "
            "reseller panel software, and authorized streaming infrastructure solutions.\n\n"
            "I would like to ask whether your community ({community_name}) permits relevant service introductions or commercial posts. "
            "I strictly respect server rules and will only post in a designated, approved channel with your explicit authorization.\n\n"
            "Thank you for your time and moderation leadership.\n"
            "Best regards,\nAPK Hunter Team"
        ),
        "compliance_notes": "Required before posting in any community where advertising rules are conditional or require prior approval.",
        "is_system_default": True
    },
    {
        "name": "Authorized Promotional Channel Post",
        "category": "promotional_channel_post",
        "subject": "Verified Infrastructure & Application Services",
        "body_template": (
            "🚀 **APK Hunter Grid — Dedicated Streaming Infrastructure & Application Engineering**\n\n"
            "We provide robust B2B media solutions for streaming platform operators and community founders:\n"
            "• **Application Rebranding:** White-label custom Android TV, Fire TV, and Mobile streaming players (custom DNS, splash, UI).\n"
            "• **Custom Player Development:** Bespoke ExoPlayer/Flutter streaming interfaces with multi-screen support.\n"
            "• **Reseller Panel Solutions:** Scalable management systems with automated credit issuance and API integration.\n"
            "• **Authorized Restreams & Feeds:** High-capacity redundant media feeds with guaranteed uptime.\n\n"
            "Posted in accordance with #{channel_name} promotion guidelines. For inquiries or documentation, reach out directly."
        ),
        "compliance_notes": "Use ONLY in explicitly approved promotional channels where advertising is permitted.",
        "is_system_default": True
    },
    {
        "name": "First-Time Community Introduction",
        "category": "first_time_intro",
        "subject": "Introduction to {community_name}",
        "body_template": (
            "Hello everyone in {community_name}! Glad to join. We are streaming application developers and infrastructure engineers "
            "passionate about Android TV media architecture, player optimization, and stable broadcast delivery. Looking forward to exchanging "
            "insights with developers and operators here."
        ),
        "compliance_notes": "Zero promotional pressure. Community greeting and value introduction only.",
        "is_system_default": True
    },
    {
        "name": "Inbound Service Inquiry Response",
        "category": "inquiry_response",
        "subject": "Regarding your inquiry about {service_name}",
        "body_template": (
            "Hello {contact_name},\n\n"
            "Thank you for reaching out regarding {service_name}. Based on your requirement for {custom_evidence}, "
            "we can provide a dedicated solution tailored for your platform.\n\n"
            "Would you prefer a live demonstration or our technical capability brief? Let me know what works best for your schedule."
        ),
        "compliance_notes": "Permission-based response to a prospect who explicitly asked for details.",
        "is_system_default": True
    },
    {
        "name": "App Rebranding Proposal",
        "category": "app_rebranding_proposal",
        "subject": "Branded Android & Fire TV Player Solutions for {business_name}",
        "body_template": (
            "Hello {contact_name},\n\n"
            "I noticed your project {business_name} involves streaming media delivery. We specialize in turn-key app rebranding "
            "for Android TV, FireStick, and Mobile. We deliver complete custom graphics, hardcoded redundant DNS endpoints, custom themes, "
            "and multi-device compatibility within 48 hours.\n\n"
            "If this aligns with your roadmap, I'd be glad to share portfolio samples."
        ),
        "compliance_notes": "Targeted specifically at operators with verified app branding signals.",
        "is_system_default": True
    },
    {
        "name": "Custom App Development Proposal",
        "category": "app_dev_proposal",
        "subject": "Tailored OTT Streaming Application Architecture",
        "body_template": (
            "Hello {contact_name},\n\n"
            "We noticed your public requirement regarding bespoke player features for {business_name}. Our engineering team builds "
            "custom native Android/Smart TV media players with low-latency HLS/DASH playback, hardware decoding optimization, and custom EPG grids.\n\n"
            "Happy to share technical specifications and recent builds if you're exploring development partners."
        ),
        "compliance_notes": "B2B engineering proposal for qualified technical leads.",
        "is_system_default": True
    },
    {
        "name": "Reseller Panel Solutions Proposal",
        "category": "reseller_panel_proposal",
        "subject": "Scalable Reseller Panel Infrastructure",
        "body_template": (
            "Hello {contact_name},\n\n"
            "If your operations at {business_name} require automated reseller panel management, credit scaling, and sub-reseller tier management, "
            "we provide high-concurrency panel solutions backed by direct infrastructure.\n\n"
            "Let us know if you would like an operator overview."
        ),
        "compliance_notes": "Commercial proposal for reseller panel operators.",
        "is_system_default": True
    },
    {
        "name": "Authorized Restream Services Inquiry",
        "category": "restream_inquiry",
        "subject": "High-Throughput Authorized Restream Capacity",
        "body_template": (
            "Hello {contact_name},\n\n"
            "Regarding streaming capacity for {business_name}, we provide authorized high-bandwidth restreaming feeds with multi-datacenter "
            "redundancy, uninterrupted sports and entertainment feeds, and transcode optimization.\n\n"
            "Let us know your peak concurrent requirements to discuss technical provisioning."
        ),
        "compliance_notes": "For verified high-capacity streaming infrastructure inquiries.",
        "is_system_default": True
    },
    {
        "name": "Follow-Up After Genuine Conversation",
        "category": "follow_up",
        "subject": "Follow-up regarding {service_name}",
        "body_template": (
            "Hi {contact_name},\n\n"
            "Following up on our earlier discussion regarding {service_name} for {business_name}. "
            "Just checking in to see if you had any questions on the details we shared or if you'd like to test a staging build.\n\n"
            "No rush at all — looking forward to connecting whenever you're ready."
        ),
        "compliance_notes": "To be sent only after an initial positive interaction.",
        "is_system_default": True
    }
]


def render_template(
    template_str: str,
    lead: Optional[Lead] = None,
    community: Optional[Community] = None,
    extra_vars: Optional[Dict[str, str]] = None
) -> str:
    """
    Interpolates verified contextual variables into the message template safely.
    """
    mapping = {
        "contact_name": lead.display_name if lead else "there",
        "business_name": (lead.business_name if lead and lead.business_name else (lead.display_name if lead else "your project")),
        "service_name": lead.service_interest if lead else "our streaming services",
        "community_name": community.name if community else "your community",
        "channel_name": "promotions",
        "admin_name": "Server Admin",
        "custom_evidence": (lead.evidences[0].description if lead and lead.evidences else "your streaming infrastructure needs")
    }
    if extra_vars:
        mapping.update(extra_vars)

    rendered = template_str
    for k, v in mapping.items():
        rendered = rendered.replace(f"{{{k}}}", str(v))
    return rendered


def check_for_duplicate_dispatch(
    db: Session,
    channel_id: Optional[int],
    community_id: Optional[int],
    within_days: int = 7
) -> bool:
    """
    Prevents duplicate campaign sends within a given window (default: 7 days) to the same channel or community.
    Returns True if a duplicate message was already delivered or approved recently.
    """
    since_date = datetime.now(timezone.utc) - timedelta(days=within_days)
    
    query = db.query(MessageDraft).filter(
        MessageDraft.approval_status.in_(["Approved", "Delivered"]),
        MessageDraft.updated_at >= since_date
    )
    if channel_id:
        query = query.filter(MessageDraft.target_channel_id == channel_id)
    elif community_id:
        query = query.filter(MessageDraft.community_id == community_id)
    else:
        return False

    return query.count() > 0
