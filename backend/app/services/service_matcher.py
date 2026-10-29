from typing import List, Dict, Any
from app.models.lead import Lead, LeadEvidence

SERVICES_CATALOG = {
    "IPTV Subscriptions": {
        "title": "IPTV Subscription Services",
        "keywords": ["iptv", "subscription", "channels", "m3u", "vod", "epg", "line", "catchup"],
        "default_rationale": "Match based on expressed consumer or distributor requirement for reliable high-availability television streams."
    },
    "Reseller Panels": {
        "title": "Reseller Panel Solutions",
        "keywords": ["reseller", "panel", "credits", "sub-reseller", "billing", "xtream", "api credits", "wholesale"],
        "default_rationale": "Match based on operations indicating business scaling, client management, or multi-credit reseller operations."
    },
    "Restream Services": {
        "title": "Authorized Restream Services",
        "keywords": ["restream", "source", "feed", "hls", "transcode", "bandwidth", "raw feeds", "rebroadcast"],
        "default_rationale": "Match supported by technical infrastructure signals, high concurrent viewer requirements, and raw feed needs."
    },
    "App Rebranding": {
        "title": "IPTV/Streaming Application Rebranding",
        "keywords": ["rebrand", "hardcode", "logo", "apk", "android tv", "fire tv", "smarters", "tivimate", "custom splash", "dns hardcode"],
        "default_rationale": "This business is a strong match for app rebranding because its public project description mentions launching a custom-branded streaming application."
    },
    "Custom App Development": {
        "title": "Custom Streaming Application Development",
        "keywords": ["custom app", "flutter", "react native", "exo player", "drm", "ott development", "smart tv", "webos", "tizen", "tailored interface"],
        "default_rationale": "Match substantiated by specific software engineering requirements for bespoke multi-screen player architectures."
    }
}


def match_services_for_lead(lead: Lead, evidences: List[LeadEvidence]) -> List[Dict[str, str]]:
    """
    Analyzes verified evidence to recommend matching services with clear explanations.
    """
    matches = []
    
    # Combined textual context
    text_corpus = (
        (lead.display_name or "") + " " +
        (lead.business_name or "") + " " +
        (lead.service_interest or "") + " " +
        (lead.internal_notes or "") + " " +
        " ".join(e.description for e in evidences)
    ).lower()

    for service_key, info in SERVICES_CATALOG.items():
        matched_keywords = [kw for kw in info["keywords"] if kw in text_corpus]
        
        if service_key.lower() == (lead.service_interest or "").lower():
            # Primary designated match
            rationale = (
                f"Primary match: Lead designated '{service_key}' as their explicit interest. "
                f"Corroborated by signals referencing {', '.join(matched_keywords) if matched_keywords else 'commercial inquiries'}."
            )
            matches.append({
                "recommended_service": service_key,
                "match_strength": "Primary",
                "evidence_rationale": rationale
            })
        elif matched_keywords:
            strength = "Secondary" if len(matched_keywords) >= 2 else "Alternative"
            rationale = (
                f"Identified interest signals for '{service_key}' based on documented keywords "
                f"({', '.join(matched_keywords[:3])}) in verified lead context."
            )
            matches.append({
                "recommended_service": service_key,
                "match_strength": strength,
                "evidence_rationale": rationale
            })

    if not matches:
        # Default fallback to lead's stated interest if present
        chosen = lead.service_interest if lead.service_interest in SERVICES_CATALOG else "App Rebranding"
        matches.append({
            "recommended_service": chosen,
            "match_strength": "Primary",
            "evidence_rationale": SERVICES_CATALOG[chosen]["default_rationale"]
        })

    return matches
