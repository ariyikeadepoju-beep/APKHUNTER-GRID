from typing import List, Dict, Any, Tuple
from app.models.lead import Lead, LeadEvidence


DEFAULT_WEIGHTS = {
    "expressed_need_max": 30.0,
    "business_activity_max": 20.0,
    "service_match_max": 20.0,
    "signal_recency_max": 15.0,
    "permission_max": 15.0,
}


def evaluate_lead_score(
    lead: Lead,
    evidences: List[LeadEvidence],
    weights: Dict[str, float] = None
) -> Tuple[float, Dict[str, float], str]:
    """
    Evaluates a lead's transparency score (0 - 100) using configurable criteria:
    - Expressed need for a service: 0 - 30
    - Relevant business activity: 0 - 20
    - Match with offered services: 0 - 20
    - Recent, relevant public business signal: 0 - 15
    - Verified permission or willingness to receive outreach: 0 - 15

    Returns: (total_score, breakdown_dict, explanation_text)
    """
    w = weights or DEFAULT_WEIGHTS
    max_need = w.get("expressed_need_max", 30.0)
    max_biz = w.get("business_activity_max", 20.0)
    max_match = w.get("service_match_max", 20.0)
    max_recency = w.get("signal_recency_max", 15.0)
    max_perm = w.get("permission_max", 15.0)

    need_score = 0.0
    biz_score = 0.0
    match_score = 0.0
    recency_score = 0.0
    perm_score = 0.0

    explanations = []

    # 1. Expressed need analysis (0 - 30)
    explicit_inquiry = any("inquiry" in e.signal_type.lower() or "request" in e.signal_type.lower() for e in evidences)
    project_need = any("need" in e.signal_type.lower() or "customization" in e.signal_type.lower() for e in evidences)
    
    if explicit_inquiry:
        need_score = max_need
        explanations.append(f"Expressed Need (+{need_score:.0f}/{max_need:.0f}): Lead submitted an explicit request or direct service inquiry.")
    elif project_need:
        need_score = max_need * 0.7
        explanations.append(f"Expressed Need (+{need_score:.0f}/{max_need:.0f}): Lead documented a public requirement for streaming application or panel solutions.")
    else:
        need_score = 0.0
        explanations.append(f"Expressed Need (0/{max_need:.0f}): No verified express request or explicit statement of need on file.")

    # 2. Relevant business activity (0 - 20)
    has_business_name = bool(lead.business_name and len(lead.business_name.strip()) > 1)
    has_contact_url = bool(lead.contact_url and len(lead.contact_url.strip()) > 5)
    
    if has_business_name and has_contact_url:
        biz_score = max_biz
        explanations.append(f"Business Activity (+{biz_score:.0f}/{max_biz:.0f}): Documented active business brand ({lead.business_name}) with public portfolio/contact presence.")
    elif has_business_name or has_contact_url:
        biz_score = max_biz * 0.6
        explanations.append(f"Business Activity (+{biz_score:.0f}/{max_biz:.0f}): Partial business signal confirmed with registered identity or verifiable profile.")
    else:
        biz_score = 0.0
        explanations.append(f"Business Activity (0/{max_biz:.0f}): Lacks verified business name or public operational footprint.")

    # 3. Match with offered services (0 - 20)
    valid_services = [
        "IPTV Subscriptions",
        "Reseller Panels",
        "Restream Services",
        "App Rebranding",
        "Custom App Development"
    ]
    if lead.service_interest in valid_services:
        match_score = max_match
        explanations.append(f"Service Alignment (+{match_score:.0f}/{max_match:.0f}): High direct alignment with core offering '{lead.service_interest}'.")
    elif lead.service_interest:
        match_score = max_match * 0.5
        explanations.append(f"Service Alignment (+{match_score:.0f}/{max_match:.0f}): Secondary alignment with peripheral media requirements.")
    else:
        match_score = 0.0
        explanations.append(f"Service Alignment (0/{max_match:.0f}): No matching service offering identified.")

    # 4. Signal recency (0 - 15)
    # Check if any verified evidence exists
    if len(evidences) >= 2:
        recency_score = max_recency
        explanations.append(f"Signal Recency (+{recency_score:.0f}/{max_recency:.0f}): Fresh multi-signal activity corroborated within current evaluation window.")
    elif len(evidences) == 1:
        recency_score = max_recency * 0.65
        explanations.append(f"Signal Recency (+{recency_score:.0f}/{max_recency:.0f}): Single verifiable recent signal recorded.")
    else:
        recency_score = 0.0
        explanations.append(f"Signal Recency (0/{max_recency:.0f}): No active or recent business signals detected.")

    # 5. Verified permission or outreach eligibility (0 - 15)
    if lead.outreach_eligibility == "Eligible - Explicit Inquiry":
        perm_score = max_perm
        explanations.append(f"Outreach Basis (+{perm_score:.0f}/{max_perm:.0f}): Prospect initiated direct contact or consented to business discussion.")
    elif lead.outreach_eligibility == "Eligible - Public Business Need":
        perm_score = max_perm * 0.65
        explanations.append(f"Outreach Basis (+{perm_score:.0f}/{max_perm:.0f}): Public commercial request posted in an authorized community directory.")
    elif lead.outreach_eligibility == "Needs Permission":
        perm_score = 0.0
        explanations.append(f"Outreach Basis (0/{max_perm:.0f}): Strict safeguard active. Requires operator or admin permission before contact.")
    else:
        perm_score = 0.0
        explanations.append(f"Outreach Basis (0/{max_perm:.0f}): Outreach prohibited by server policy or user preference.")

    total = round(need_score + biz_score + match_score + recency_score + perm_score, 1)
    
    breakdown = {
        "expressed_need_score": need_score,
        "business_activity_score": biz_score,
        "service_match_score": match_score,
        "signal_recency_score": recency_score,
        "permission_score": perm_score,
    }

    full_explanation = "\n".join(explanations)
    return total, breakdown, full_explanation
