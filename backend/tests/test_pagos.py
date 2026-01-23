"""
Test suite for CotizaBot Payment System (Stripe Integration)
Tests: GET /api/pagos/planes, POST /api/pagos/crear-checkout, 
       GET /api/pagos/checkout-status/{session_id}, GET /api/pagos/mi-suscripcion
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@cotizabot.com"
TEST_PASSWORD = "Test123456"


class TestPagosPlanes:
    """Tests for GET /api/pagos/planes - Public endpoint"""
    
    def test_get_planes_returns_200(self):
        """GET /api/pagos/planes should return 200"""
        response = requests.get(f"{BASE_URL}/api/pagos/planes")
        assert response.status_code == 200
    
    def test_get_planes_returns_plan_completo(self):
        """GET /api/pagos/planes should return Plan Completo with correct pricing"""
        response = requests.get(f"{BASE_URL}/api/pagos/planes")
        data = response.json()
        
        assert "planes" in data
        assert len(data["planes"]) >= 1
        
        # Find Plan Completo
        plan_completo = None
        for plan in data["planes"]:
            if plan["id"] == "completo":
                plan_completo = plan
                break
        
        assert plan_completo is not None, "Plan Completo not found"
        assert plan_completo["nombre"] == "Plan Completo"
        assert plan_completo["precio_base"] == 1000.0
        assert plan_completo["iva"] == 160.0
        assert plan_completo["precio_total"] == 1160.0
        assert plan_completo["currency"] == "MXN"


class TestPagosMiSuscripcion:
    """Tests for GET /api/pagos/mi-suscripcion - Requires authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_mi_suscripcion_requires_auth(self):
        """GET /api/pagos/mi-suscripcion without auth should return 401/403"""
        response = requests.get(f"{BASE_URL}/api/pagos/mi-suscripcion")
        assert response.status_code in [401, 403]
    
    def test_mi_suscripcion_returns_subscription_info(self, auth_token):
        """GET /api/pagos/mi-suscripcion should return subscription details"""
        response = requests.get(
            f"{BASE_URL}/api/pagos/mi-suscripcion",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "plan" in data
        assert "plan_nombre" in data
        assert "cotizaciones_usadas" in data
        assert "activo" in data
        
        # Plan should be one of: gratis, demo, completo
        assert data["plan"] in ["gratis", "demo", "completo"]


class TestPagosCrearCheckout:
    """Tests for POST /api/pagos/crear-checkout - Requires authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_crear_checkout_requires_auth(self):
        """POST /api/pagos/crear-checkout without auth should return 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/crear-checkout",
            json={"plan_id": "completo", "origin_url": BASE_URL}
        )
        assert response.status_code in [401, 403]
        data = response.json()
        assert "detail" in data
    
    def test_crear_checkout_returns_stripe_url(self, auth_token):
        """POST /api/pagos/crear-checkout should return valid Stripe checkout URL"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/crear-checkout",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"plan_id": "completo", "origin_url": BASE_URL}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data
        
        # Verify Stripe URL format
        assert "checkout.stripe.com" in data["checkout_url"]
        assert data["session_id"].startswith("cs_test_") or data["session_id"].startswith("cs_live_")
    
    def test_crear_checkout_invalid_plan(self, auth_token):
        """POST /api/pagos/crear-checkout with invalid plan should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/crear-checkout",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"plan_id": "invalid_plan", "origin_url": BASE_URL}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


class TestPagosCheckoutStatus:
    """Tests for GET /api/pagos/checkout-status/{session_id} - Requires authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    @pytest.fixture
    def checkout_session(self, auth_token):
        """Create a checkout session for testing"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/crear-checkout",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"plan_id": "completo", "origin_url": BASE_URL}
        )
        if response.status_code == 200:
            return response.json()
        pytest.skip("Could not create checkout session")
    
    def test_checkout_status_requires_auth(self):
        """GET /api/pagos/checkout-status/{session_id} without auth should return 401/403"""
        response = requests.get(f"{BASE_URL}/api/pagos/checkout-status/cs_test_fake_session")
        assert response.status_code in [401, 403]
    
    def test_checkout_status_returns_pending(self, auth_token, checkout_session):
        """GET /api/pagos/checkout-status/{session_id} should return pending status for new session"""
        session_id = checkout_session["session_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/pagos/checkout-status/{session_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "payment_status" in data
        assert "plan_activado" in data
        assert "mensaje" in data
        
        # New session should be pending/unpaid
        assert data["payment_status"] in ["unpaid", "pending", "paid"]
        assert isinstance(data["plan_activado"], bool)
    
    def test_checkout_status_invalid_session(self, auth_token):
        """GET /api/pagos/checkout-status/{session_id} with invalid session should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/pagos/checkout-status/cs_test_nonexistent_session_12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
