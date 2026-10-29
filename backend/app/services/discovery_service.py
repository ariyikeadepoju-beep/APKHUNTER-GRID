import re
from typing import Optional, Tuple
from app.models.community import Community

RELEVANT_KEYWORDS = [
    "iptv", "streaming", "android tv", "fire tv", "smart tv", "reseller",
    "ott", "media", "player", "rebrand", "apk", "transcode", "vod", "streams"
]


def extract_invite_code(url_or_code: str) -> Optional[str]:
    """
    Extracts and normalizes the invite code from various Discord invite representations.
    e.g.:
    https://discord.gg/streamingdevs -> streamingdevs
    https://discord.com/invite/iptvhub -> iptvhub
    discord.gg/abc1234 -> abc1234
    abc1234 -> abc1234
    """
    cleaned = url_or_code.strip()
    match = re.search(r"(?:discord\.gg/|discord\.com/invite/)?([a-zA-Z0-9_-]+)", cleaned)
    if match:
        return match.group(1)
    return cleaned if cleaned else None


def calculate_community_suitability(name: str, description: Optional[str], member_count: int) -> Tuple[float, str]:
    """
    Evaluates community suitability based on business relevance rather than mere size.
    Returns: (suitability_score [0-100], fit_tier)
    """
    corpus = f"{name} {description or ''}".lower()
    
    score = 20.0  # Base score for valid community
    
    # Keyword relevance (up to 45 pts)
    matched = [kw for kw in RELEVANT_KEYWORDS if kw in corpus]
    score += min(len(matched) * 9.0, 45.0)

    # Size appropriateness (up to 20 pts)
    # Balanced communities (50 to 10,000 members) often yield higher quality direct business discussions
    if 100 <= member_count <= 15000:
        score += 20.0
    elif 15000 < member_count <= 50000:
        score += 15.0
    elif member_count > 50000:
        score += 10.0  # High noise
    elif member_count >= 20:
        score += 10.0
    else:
        score += 5.0

    # Presence of technical or development context (up to 15 pts)
    if any(tech in corpus for tech in ["developer", "apk", "rebrand", "panel", "infrastructure", "firmware"]):
        score += 15.0

    score = min(max(round(score, 1), 0.0), 100.0)

    if score >= 80.0:
        tier = "Excellent fit"
    elif score >= 65.0:
        tier = "Good fit"
    elif score >= 50.0:
        tier = "Possible fit"
    elif score >= 35.0:
        tier = "Needs review"
    else:
        tier = "Poor fit"

    return score, tier
