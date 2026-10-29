import pytest
from app.models.lead import Lead, LeadEvidence
from app.services.scoring_engine import evaluate_lead_score, DEFAULT_WEIGHTS


def test_lead_scoring_maximum_points():
    lead = Lead(
        display_name="Elite Streaming Systems",
        business_name="Elite IPTV Networks LLC",
        contact_url="https://elite-streams.example.com",
        service_interest="App Rebranding",
        outreach_eligibility="Eligible - Explicit Inquiry",
        status="Qualified"
    )
    evidences = [
        LeadEvidence(signal_type="Explicit Service Inquiry", description="Requested quotation for custom Android TV rebranding."),
        LeadEvidence(signal_type="Profile Bio Signal", description="Founder of active OTT network.")
    ]

    total, breakdown, explanation = evaluate_lead_score(lead, evidences)
    assert total == 100.0
    assert breakdown["expressed_need_score"] == 30.0
    assert breakdown["business_activity_score"] == 20.0
    assert breakdown["service_match_score"] == 20.0
    assert breakdown["signal_recency_score"] == 15.0
    assert breakdown["permission_score"] == 15.0
    assert "Expressed Need (+30/30)" in explanation


def test_missing_evidence_assigns_zero():
    # Lead with no business name, no url, no evidence, no permission
    lead = Lead(
        display_name="Unknown User",
        business_name=None,
        contact_url=None,
        service_interest="Other",
        outreach_eligibility="Needs Permission",
        status="New"
    )
    evidences = []

    total, breakdown, explanation = evaluate_lead_score(lead, evidences)
    assert breakdown["expressed_need_score"] == 0.0
    assert breakdown["business_activity_score"] == 0.0
    assert breakdown["signal_recency_score"] == 0.0
    assert breakdown["permission_score"] == 0.0
    assert "Strict safeguard active" in explanation


def test_custom_weights():
    custom_weights = {
        "expressed_need_max": 40.0,
        "business_activity_max": 15.0,
        "service_match_max": 15.0,
        "signal_recency_max": 15.0,
        "permission_max": 15.0,
    }
    lead = Lead(
        display_name="Custom Operator",
        business_name="Custom Biz",
        contact_url="https://custom.com",
        service_interest="Reseller Panels",
        outreach_eligibility="Eligible - Explicit Inquiry"
    )
    evidences = [
        LeadEvidence(signal_type="Explicit Service Inquiry", description="Direct request for reseller panel.")
    ]
    total, breakdown, explanation = evaluate_lead_score(lead, evidences, custom_weights)
    assert breakdown["expressed_need_score"] == 40.0
