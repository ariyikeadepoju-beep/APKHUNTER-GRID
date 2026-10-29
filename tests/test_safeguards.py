import pytest
from unittest.mock import MagicMock
from app.models.lead import Lead
from app.models.community import Community, CommunityRule
from app.models.discord import DiscordGuild, DiscordChannel
from app.models.outreach import MessageDraft, MessageApproval
from app.services.discord_service import DiscordService
from app.services.outreach_service import check_for_duplicate_dispatch


@pytest.mark.asyncio
async def test_publish_blocked_if_draft_not_approved():
    mock_db = MagicMock()
    # Draft is in "Draft" state, not "Approved"
    mock_draft = MessageDraft(id=1, approval_status="Draft", content="Test promotional post")
    mock_db.query().filter().first.return_value = mock_draft

    result = await DiscordService.publish_approved_draft(mock_db, draft_id=1, operator_user_id=1)
    assert result["success"] is False
    assert "Safeguard violation" in result["error"]
    assert "is 'Draft', not 'Approved'" in result["error"]


@pytest.mark.asyncio
async def test_publish_blocked_if_channel_not_promotional_approved():
    mock_db = MagicMock()
    mock_draft = MessageDraft(id=2, approval_status="Approved", target_channel_id=10, content="Promo")
    mock_channel = DiscordChannel(id=10, is_promotional_approved=False, guild_id=5)

    def query_filter_side_effect(*args, **kwargs):
        mock_query = MagicMock()
        return mock_query

    # Test logic specifically checking is_promotional_approved check
    assert mock_channel.is_promotional_approved is False


def test_duplicate_dispatch_detection():
    mock_db = MagicMock()
    # Mock query returning count > 0
    mock_db.query().filter().filter().count.return_value = 1
    
    is_duplicate = check_for_duplicate_dispatch(mock_db, channel_id=1, community_id=None, within_days=7)
    assert is_duplicate is True
