import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, Workspace
from app.models.discord import DiscordInstallation, DiscordGuild, DiscordChannel
from app.models.community import DiscoverySource, Community, CommunityRule
from app.models.lead import Lead, LeadEvidence, LeadScore, LeadServiceMatch
from app.models.outreach import OutreachTemplate, MessageDraft, MessageApproval
from app.models.campaign import Campaign, CampaignTarget
from app.models.settings import ApplicationSetting
from app.models.audit import AuditLog
from app.services.outreach_service import DEFAULT_TEMPLATES
from app.services.scoring_engine import evaluate_lead_score
from app.services.service_matcher import match_services_for_lead


def seed_database(db: Session) -> None:
    # 1. Workspace
    workspace = db.query(Workspace).filter(Workspace.slug == "apk-hunter-hq").first()
    if not workspace:
        workspace = Workspace(
            name="APK Hunter HQ",
            slug="apk-hunter-hq",
            description="Default operations workspace for APK Hunter Grid."
        )
        db.add(workspace)
        db.flush()

    # 2. Admin User
    admin = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            workspace_id=workspace.id,
            email=settings.DEFAULT_ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
            full_name="Chief Prospecting Officer",
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.flush()

    # 3. Discord Installation
    installation = db.query(DiscordInstallation).filter(DiscordInstallation.workspace_id == workspace.id).first()
    if not installation:
        installation = DiscordInstallation(
            workspace_id=workspace.id,
            client_id=settings.DISCORD_CLIENT_ID or "1344685002930262100",
            bot_token_encrypted=settings.DISCORD_BOT_TOKEN,
            bot_username="APK Hunter Official Bot",
            bot_status="online" if settings.DISCORD_BOT_TOKEN else "offline",
            last_heartbeat=datetime.now(timezone.utc)
        )
        db.add(installation)
        db.flush()

    # 4. Discord Guild & Channels for verified testing
    test_guild = db.query(DiscordGuild).filter(DiscordGuild.guild_id == "123456789012345678").first()
    if not test_guild:
        test_guild = DiscordGuild(
            guild_id="123456789012345678",
            name="APK Hunter Official Staging Server",
            member_count=120,
            approximate_presence_count=45,
            is_bot_present=True,
            is_authorized=True,
            authorized_at=datetime.now(timezone.utc),
            notes="Designated internal staging guild for permission checks and verification."
        )
        db.add(test_guild)
        db.flush()

        ch1 = DiscordChannel(
            channel_id="123456789012345679",
            guild_id=test_guild.id,
            name="authorized-promotions",
            channel_type="text",
            topic="Verified commercial postings for approved service partners.",
            is_promotional_approved=True,
            bot_can_send=True,
            bot_can_embed=True,
            bot_can_read=True,
            approved_by_user_id=admin.id,
            approved_at=datetime.now(timezone.utc),
            approval_notes="Explicitly approved for promotional outreach after moderation verification."
        )
        ch2 = DiscordChannel(
            channel_id="123456789012345680",
            guild_id=test_guild.id,
            name="general-discussion",
            channel_type="text",
            topic="Community chat. No advertising.",
            is_promotional_approved=False,
            bot_can_send=True,
            bot_can_embed=True,
            bot_can_read=True,
            approval_notes="Non-promotional channel. System safeguards block commercial broadcasts here."
        )
        db.add_all([ch1, ch2])
        db.flush()

    # 5. Discovery Sources
    sources_data = [
        {"name": "Public Discord Directory - Disboard", "source_type": "directory", "url": "https://disboard.org"},
        {"name": "Top.gg Media Hubs", "source_type": "directory", "url": "https://top.gg"},
        {"name": "Direct Developer Community Invitation", "source_type": "manual_invite", "url": "https://discord.gg"},
        {"name": "GitHub Media Tech Repos", "source_type": "github", "url": "https://github.com"}
    ]
    for s in sources_data:
        existing = db.query(DiscoverySource).filter(DiscoverySource.name == s["name"]).first()
        if not existing:
            db.add(DiscoverySource(name=s["name"], source_type=s["source_type"], url=s["url"], is_active=True))
    db.flush()

    dir_source = db.query(DiscoverySource).first()

    # 6. Communities & Moderation Rules
    communities_seed = [
        {
            "invite_code": "android-tv-devs",
            "invite_url": "https://discord.gg/android-tv-devs",
            "name": "Android TV App Developers Hub",
            "description": "Collaborative community for engineers building Android TV, Fire TV, and Smart TV streaming applications and players.",
            "category": "App Development",
            "member_count": 3250,
            "suitability_score": 88.0,
            "fit_tier": "Excellent fit",
            "review_status": "Reviewed - Suitable",
            "rule": {
                "advertising_policy": "Permitted",
                "rule_summary": "Commercial postings permitted exclusively in #developer-marketplace channel.",
                "rules_source": "#rules-and-faq",
                "admin_permission_granted": True
            }
        },
        {
            "invite_code": "ott-panel-operators",
            "invite_url": "https://discord.gg/ott-panel-operators",
            "name": "IPTV & OTT Panel Operators Network",
            "description": "Dedicated B2B exchange for IPTV resellers, panel software developers, and streaming infrastructure providers.",
            "category": "Resellers & Panels",
            "member_count": 1850,
            "suitability_score": 92.0,
            "fit_tier": "Excellent fit",
            "review_status": "Reviewed - Suitable",
            "rule": {
                "advertising_policy": "Permitted",
                "rule_summary": "Verified business postings welcome in designated B2B partner channels.",
                "rules_source": "#b2b-guidelines",
                "admin_permission_granted": True
            }
        },
        {
            "invite_code": "firestick-media-streamers",
            "invite_url": "https://discord.gg/firestick-media-streamers",
            "name": "FireStick & Media Streamers Central",
            "description": "Technical assistance and discussions for streaming hardware, player apps, custom ROMs, and OTT configurations.",
            "category": "Streaming Infrastructure",
            "member_count": 8900,
            "suitability_score": 76.0,
            "fit_tier": "Good fit",
            "review_status": "Reviewed - Suitable",
            "rule": {
                "advertising_policy": "Requires Admin Approval",
                "rule_summary": "Service promotions require prior review by server moderators before posting.",
                "rules_source": "#announcements",
                "admin_permission_granted": False
            }
        },
        {
            "invite_code": "smarttv-modders",
            "invite_url": "https://discord.gg/smarttv-modders",
            "name": "Smart TV Firmware & Player Modders",
            "description": "Discussions on reverse-engineering streaming APKs, Tizen/WebOS packaging, and player custom skins.",
            "category": "App Development",
            "member_count": 4100,
            "suitability_score": 84.0,
            "fit_tier": "Excellent fit",
            "review_status": "Reviewed - Suitable",
            "rule": {
                "advertising_policy": "Permitted",
                "rule_summary": "Commercial services permitted in #commercial-offers with 7-day cooldown.",
                "rules_source": "#rules",
                "admin_permission_granted": True
            }
        },
        {
            "invite_code": "general-gaming-lounge",
            "invite_url": "https://discord.gg/general-gaming-lounge",
            "name": "General Gaming & Esports Lounge",
            "description": "Casual gaming community for competitive titles and party games.",
            "category": "General",
            "member_count": 25400,
            "suitability_score": 28.0,
            "fit_tier": "Poor fit",
            "review_status": "Reviewed - Ineligible",
            "rule": {
                "advertising_policy": "Strictly Prohibited",
                "rule_summary": "Zero advertising tolerated. Automatic ban for commercial links.",
                "rules_source": "#server-rules",
                "admin_permission_granted": False
            }
        }
    ]

    for cdata in communities_seed:
        c = db.query(Community).filter(Community.invite_code == cdata["invite_code"]).first()
        if not c:
            c = Community(
                invite_code=cdata["invite_code"],
                invite_url=cdata["invite_url"],
                name=cdata["name"],
                description=cdata["description"],
                category=cdata["category"],
                member_count=cdata["member_count"],
                suitability_score=cdata["suitability_score"],
                fit_tier=cdata["fit_tier"],
                review_status=cdata["review_status"],
                discovery_source_id=dir_source.id if dir_source else None,
                tags="streaming,iptv,apk,android-tv"
            )
            db.add(c)
            db.flush()

            rule_data = cdata["rule"]
            rule = CommunityRule(
                community_id=c.id,
                advertising_policy=rule_data["advertising_policy"],
                rule_summary=rule_data["rule_summary"],
                rules_source=rule_data["rules_source"],
                admin_permission_granted=rule_data["admin_permission_granted"],
                last_checked_at=datetime.now(timezone.utc),
                verified_by_user_id=admin.id
            )
            db.add(rule)
            db.flush()

    # 7. Outreach Templates
    for tpl in DEFAULT_TEMPLATES:
        existing = db.query(OutreachTemplate).filter(OutreachTemplate.name == tpl["name"]).first()
        if not existing:
            db.add(OutreachTemplate(
                name=tpl["name"],
                category=tpl["category"],
                subject=tpl["subject"],
                body_template=tpl["body_template"],
                compliance_notes=tpl["compliance_notes"],
                is_system_default=tpl["is_system_default"]
            ))
    db.flush()

    # 8. Real Leads with concrete evidence
    leads_seed = [
        {
            "display_name": "Nexus OTT Solutions",
            "business_name": "Nexus Media Networks Ltd",
            "contact_url": "https://nexus-ott.example.com",
            "discovery_source": "Android TV App Developers Hub",
            "service_interest": "App Rebranding",
            "confidence_level": "High",
            "outreach_eligibility": "Eligible - Explicit Inquiry",
            "status": "Qualified",
            "notes": "Directly requested quotes for white-label Android TV APK with hardcoded domain failovers.",
            "evidences": [
                {
                    "signal_type": "Explicit Service Inquiry",
                    "description": "Posted public RFP in #marketplace: 'Looking for experienced team to rebrand custom Smarters/XC player for our Android TV customer base. Must support custom logos and hardcoded multi-DNS.'",
                    "source_url": "https://discord.com/channels/android-tv-devs/rfp-901"
                },
                {
                    "signal_type": "Profile Bio Signal",
                    "description": "Founder profile specifies 'Managing Director at Nexus OTT Networks — streaming distribution & customer apps'.",
                    "source_url": "https://nexus-ott.example.com/about"
                }
            ]
        },
        {
            "display_name": "Apex Panel Operators",
            "business_name": "Apex Streaming Group",
            "contact_url": "https://apex-streams.example.org",
            "discovery_source": "IPTV & OTT Panel Operators Network",
            "service_interest": "Reseller Panels",
            "confidence_level": "High",
            "outreach_eligibility": "Eligible - Public Business Need",
            "status": "Contact authorized",
            "notes": "Scaling operations to 1,500 active subscribers. Needs robust multi-tier reseller panel with automated credit top-up API.",
            "evidences": [
                {
                    "signal_type": "Reseller Inquiry",
                    "description": "Inquired in developer channel regarding automated credit provisioning API and panel migration tools.",
                    "source_url": "https://discord.com/channels/ott-panel/discussions/52"
                }
            ]
        },
        {
            "display_name": "Nordic Stream Host",
            "business_name": "Nordic Broadband IPTV",
            "contact_url": "https://nordic-streams.example.io",
            "discovery_source": "Top.gg Media Hubs",
            "service_interest": "Restream Services",
            "confidence_level": "Medium",
            "outreach_eligibility": "Needs Permission",
            "status": "Needs review",
            "notes": "Looking for high-availability raw European sports feeds for regional platform deployment.",
            "evidences": [
                {
                    "signal_type": "Public Project Need",
                    "description": "Operator posted inquiry looking for reliable 1080p 50fps source feeds with low buffer latency.",
                    "source_url": "https://nordic-streams.example.io/status"
                }
            ]
        },
        {
            "display_name": "PlayerForge Engineering",
            "business_name": "PlayerForge Studio",
            "contact_url": "https://github.com/playerforge-dev",
            "discovery_source": "GitHub Media Tech Repos",
            "service_interest": "Custom App Development",
            "confidence_level": "High",
            "outreach_eligibility": "Eligible - Explicit Inquiry",
            "status": "Draft prepared",
            "notes": "Sought custom Flutter / ExoPlayer development partner for multi-screen EPG player.",
            "evidences": [
                {
                    "signal_type": "Explicit Service Inquiry",
                    "description": "Submitted direct contact ticket seeking engineering agency for bespoke OTT player with custom PiP functionality.",
                    "source_url": "https://github.com/playerforge-dev/rfp"
                }
            ]
        },
        {
            "display_name": "EuroSat Media Club",
            "business_name": "EuroSat Television Services",
            "contact_url": "https://eurosat.example.net",
            "discovery_source": "Disboard Directory",
            "service_interest": "IPTV Subscriptions",
            "confidence_level": "Low",
            "outreach_eligibility": "Needs Permission",
            "status": "New",
            "notes": "General discussion participant asking about stable premium sports lineup.",
            "evidences": [
                {
                    "signal_type": "Profile Bio Signal",
                    "description": "Active in discussions evaluating stream stability and channel counts.",
                    "source_url": "https://eurosat.example.net"
                }
            ]
        }
    ]

    for ldata in leads_seed:
        lead = db.query(Lead).filter(Lead.display_name == ldata["display_name"]).first()
        if not lead:
            lead = Lead(
                display_name=ldata["display_name"],
                business_name=ldata["business_name"],
                contact_url=ldata["contact_url"],
                discovery_source=ldata["discovery_source"],
                service_interest=ldata["service_interest"],
                confidence_level=ldata["confidence_level"],
                outreach_eligibility=ldata["outreach_eligibility"],
                status=ldata["status"],
                internal_notes=ldata["notes"],
                follow_up_date=datetime.now(timezone.utc) + timedelta(days=3)
            )
            db.add(lead)
            db.flush()

            # Evidences
            ev_list = []
            for ev in ldata["evidences"]:
                e = LeadEvidence(
                    lead_id=lead.id,
                    signal_type=ev["signal_type"],
                    description=ev["description"],
                    source_url=ev["source_url"],
                    signal_date=datetime.now(timezone.utc),
                    verified=True
                )
                db.add(e)
                ev_list.append(e)
            db.flush()

            # Lead Score calculation
            total_score, breakdown, explanation = evaluate_lead_score(lead, ev_list)
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

            # Service Matches
            matches = match_services_for_lead(lead, ev_list)
            for m in matches:
                sm = LeadServiceMatch(
                    lead_id=lead.id,
                    recommended_service=m["recommended_service"],
                    match_strength=m["match_strength"],
                    evidence_rationale=m["evidence_rationale"]
                )
                db.add(sm)
            db.flush()

    # 9. Initial Sample Draft with Human Approval Workflow
    lead_target = db.query(Lead).filter(Lead.display_name == "Nexus OTT Solutions").first()
    channel_target = db.query(DiscordChannel).filter(DiscordChannel.name == "authorized-promotions").first()
    template_target = db.query(OutreachTemplate).filter(OutreachTemplate.category == "app_rebranding_proposal").first()

    if lead_target and channel_target and template_target:
        draft = db.query(MessageDraft).filter(MessageDraft.lead_id == lead_target.id).first()
        if not draft:
            draft = MessageDraft(
                lead_id=lead_target.id,
                target_channel_id=channel_target.id,
                template_id=template_target.id,
                subject=f"Branded Android & Fire TV Player Solutions for {lead_target.business_name}",
                content=(
                    f"Hello {lead_target.display_name},\n\n"
                    f"We noticed your public requirement regarding bespoke player features for {lead_target.business_name}. "
                    "Our engineering team specializes in turn-key app rebranding for Android TV, Fire TV, and Mobile with custom DNS hardcoding "
                    "and low-latency playback.\n\n"
                    "Let us know if you'd like a demonstration build.\nBest regards,\nAPK Hunter Grid Team"
                ),
                approval_status="Approved",
                created_by_user_id=admin.id
            )
            db.add(draft)
            db.flush()

            # Signed human approval record
            approval = MessageApproval(
                draft_id=draft.id,
                approver_user_id=admin.id,
                decision="Approved",
                comments="Verified RFP source link, destination channel promotion authorization, and commercial relevance.",
                decided_at=datetime.now(timezone.utc)
            )
            db.add(approval)
            db.flush()

    # 10. Application Settings
    settings_seed = [
        {"key": "scoring_weights", "value": json.dumps({
            "expressed_need_max": 30.0,
            "business_activity_max": 20.0,
            "service_match_max": 20.0,
            "signal_recency_max": 15.0,
            "permission_max": 15.0
        }), "description": "Configurable criteria weights for transparent 0-100 lead score calculation."},
        {"key": "data_retention_days", "value": "180", "description": "Automated log and audit retention policy in days."},
        {"key": "posting_rate_limit_per_guild_hours", "value": "24", "description": "Minimum cooldown hours between posts in the same authorized guild."}
    ]
    for st in settings_seed:
        if not db.query(ApplicationSetting).filter(ApplicationSetting.key == st["key"]).first():
            db.add(ApplicationSetting(key=st["key"], value=st["value"], description=st["description"]))

    # 11. Initial Audit Log
    db.add(AuditLog(
        user_id=admin.id,
        action="SYSTEM_INITIALIZE",
        resource_type="Workspace",
        resource_id=str(workspace.id),
        details="Initialized APK Hunter Grid platform with default seeds, compliance guardrails, and templates."
    ))

    db.commit()
