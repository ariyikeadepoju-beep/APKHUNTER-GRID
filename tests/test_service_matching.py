import pytest
from app.models.lead import Lead, LeadEvidence
from app.services.service_matcher import match_services_for_lead, SERVICES_CATALOG


def test_service_catalog_completeness():
    required_services = [
        "IPTV Subscriptions",
        "Reseller Panels",
        "Restream Services",
        "App Rebranding",
        "Custom App Development"
    ]
    for service in required_services:
        assert service in SERVICES_CATALOG
        assert "keywords" in SERVICES_CATALOG[service]
        assert "default_rationale" in SERVICES_CATALOG[service]


def test_app_rebranding_service_match():
    lead = Lead(
        display_name="Titan Streams",
        business_name="Titan OTT",
        service_interest="App Rebranding",
        internal_notes="Looking to rebrand Smarters APK for Fire TV."
    )
    evidences = [
        LeadEvidence(
            signal_type="App Customization Request",
            description="Needs custom splash screen, logo, and hardcoded DNS for Android TV app."
        )
    ]
    matches = match_services_for_lead(lead, evidences)
    primary = matches[0]
    assert primary["recommended_service"] == "App Rebranding"
    assert primary["match_strength"] == "Primary"
    assert "Corroborated by signals referencing" in primary["evidence_rationale"] or "App Rebranding" in primary["evidence_rationale"]


def test_custom_app_dev_match():
    lead = Lead(
        display_name="DevLead",
        business_name="Smart OTT Software",
        service_interest="Custom App Development",
        internal_notes="Needs Flutter and ExoPlayer engineer."
    )
    evidences = [
        LeadEvidence(
            signal_type="Explicit Service Inquiry",
            description="Seeking custom player engineer with DRM and EPG experience."
        )
    ]
    matches = match_services_for_lead(lead, evidences)
    assert any(m["recommended_service"] == "Custom App Development" for m in matches)
