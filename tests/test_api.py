import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "APK Hunter Grid"


def test_dashboard_metrics_endpoint():
    response = client.get("/api/v1/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert "total_discovered_communities" in data
    assert "total_saved_leads" in data
    assert "lead_conversion_funnel" in data
    assert "weekly_performance" in data


def test_services_catalog_endpoint():
    response = client.get("/api/v1/services/catalog")
    assert response.status_code == 200
    catalog = response.json()
    assert len(catalog) == 5
    ids = [item["id"] for item in catalog]
    assert "iptv-subscriptions" in ids
    assert "reseller-panels" in ids
    assert "restream-services" in ids
    assert "app-rebranding" in ids
    assert "custom-app-development" in ids


def test_lead_scoring_weights_endpoint():
    response = client.get("/api/v1/lead-scoring/weights")
    assert response.status_code == 200
    weights = response.json()
    assert weights["expressed_need_max"] >= 0
    assert weights["business_activity_max"] >= 0
    assert weights["service_match_max"] >= 0
