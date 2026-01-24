"""
Test suite for CotizaBot Admin Promo Codes Panel
Tests: GET /api/pagos/promo/listar, POST /api/pagos/promo/crear, 
       PATCH /api/pagos/promo/{id}/toggle, DELETE /api/pagos/promo/{id}
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - Admin user
ADMIN_EMAIL = "test@cotizabot.com"
ADMIN_PASSWORD = "admin123"

# Regular user (non-admin) - will be created if needed
REGULAR_EMAIL = "regular@test.com"
REGULAR_PASSWORD = "Test123456"


class TestAdminPromoCodesAuth:
    """Tests for promo codes authentication and authorization"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            # Verify user is admin
            assert data.get("usuario", {}).get("rol") == "admin", "Test user is not admin"
            return data.get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_login_admin_returns_admin_role(self):
        """POST /api/auth/login with admin credentials should return rol='admin'"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "usuario" in data
        assert data["usuario"]["rol"] == "admin"
        assert data["usuario"]["email"] == ADMIN_EMAIL
    
    def test_listar_promo_requires_auth(self):
        """GET /api/pagos/promo/listar without auth should return 401/403"""
        response = requests.get(f"{BASE_URL}/api/pagos/promo/listar")
        assert response.status_code in [401, 403]


class TestAdminPromoCodesListar:
    """Tests for GET /api/pagos/promo/listar - Admin only"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_listar_promo_returns_200(self, admin_token):
        """GET /api/pagos/promo/listar should return 200 for admin"""
        response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
    
    def test_listar_promo_returns_array(self, admin_token):
        """GET /api/pagos/promo/listar should return promo_codes array"""
        response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "promo_codes" in data
        assert isinstance(data["promo_codes"], list)
    
    def test_listar_promo_code_structure(self, admin_token):
        """GET /api/pagos/promo/listar should return codes with correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        if len(data["promo_codes"]) > 0:
            promo = data["promo_codes"][0]
            # Verify structure
            assert "id" in promo
            assert "code" in promo
            assert "activo" in promo
            # Should have either descuento_porcentaje or descuento_fijo
            assert "descuento_porcentaje" in promo or "descuento_fijo" in promo


class TestAdminPromoCodesCrear:
    """Tests for POST /api/pagos/promo/crear - Admin only"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_crear_promo_requires_auth(self):
        """POST /api/pagos/promo/crear without auth should return 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            json={"code": "TEST", "descuento_porcentaje": 10}
        )
        assert response.status_code in [401, 403]
    
    def test_crear_promo_porcentaje_success(self, admin_token):
        """POST /api/pagos/promo/crear with percentage discount should succeed"""
        unique_code = f"TEST_{uuid.uuid4().hex[:8].upper()}"
        
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_porcentaje": 15,
                "max_usos": 10,
                "un_uso_por_cliente": True,
                "descripcion": "Test promo code"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["code"] == unique_code
        assert "15%" in data["descuento"]
        
        # Cleanup - delete the created code
        # First get the ID
        list_response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if list_response.status_code == 200:
            for promo in list_response.json().get("promo_codes", []):
                if promo["code"] == unique_code:
                    requests.delete(
                        f"{BASE_URL}/api/pagos/promo/{promo['id']}",
                        headers={"Authorization": f"Bearer {admin_token}"}
                    )
                    break
    
    def test_crear_promo_fijo_success(self, admin_token):
        """POST /api/pagos/promo/crear with fixed discount should succeed"""
        unique_code = f"TESTFIJO_{uuid.uuid4().hex[:6].upper()}"
        
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_fijo": 100.0,
                "max_usos": 5,
                "un_uso_por_cliente": False,
                "descripcion": "Test fixed discount"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["code"] == unique_code
        assert "$100" in data["descuento"] or "100" in data["descuento"]
        
        # Cleanup
        list_response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if list_response.status_code == 200:
            for promo in list_response.json().get("promo_codes", []):
                if promo["code"] == unique_code:
                    requests.delete(
                        f"{BASE_URL}/api/pagos/promo/{promo['id']}",
                        headers={"Authorization": f"Bearer {admin_token}"}
                    )
                    break
    
    def test_crear_promo_requires_discount(self, admin_token):
        """POST /api/pagos/promo/crear without discount should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": "NODISCOUNT",
                "max_usos": 10
            }
        )
        assert response.status_code == 400
        assert "descuento" in response.json().get("detail", "").lower()
    
    def test_crear_promo_duplicate_code(self, admin_token):
        """POST /api/pagos/promo/crear with duplicate code should return 400"""
        unique_code = f"TESTDUP_{uuid.uuid4().hex[:6].upper()}"
        
        # Create first code
        response1 = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_porcentaje": 10,
                "max_usos": 5
            }
        )
        assert response1.status_code == 200
        
        # Try to create duplicate
        response2 = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_porcentaje": 20,
                "max_usos": 10
            }
        )
        assert response2.status_code == 400
        assert "existe" in response2.json().get("detail", "").lower()
        
        # Cleanup
        list_response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if list_response.status_code == 200:
            for promo in list_response.json().get("promo_codes", []):
                if promo["code"] == unique_code:
                    requests.delete(
                        f"{BASE_URL}/api/pagos/promo/{promo['id']}",
                        headers={"Authorization": f"Bearer {admin_token}"}
                    )
                    break


class TestAdminPromoCodesToggle:
    """Tests for PATCH /api/pagos/promo/{id}/toggle - Admin only"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def test_promo_code(self, admin_token):
        """Create a test promo code for toggle testing"""
        unique_code = f"TESTTOGGLE_{uuid.uuid4().hex[:6].upper()}"
        
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_porcentaje": 10,
                "max_usos": 5
            }
        )
        
        if response.status_code == 200:
            # Get the ID
            list_response = requests.get(
                f"{BASE_URL}/api/pagos/promo/listar",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            for promo in list_response.json().get("promo_codes", []):
                if promo["code"] == unique_code:
                    yield promo
                    # Cleanup
                    requests.delete(
                        f"{BASE_URL}/api/pagos/promo/{promo['id']}",
                        headers={"Authorization": f"Bearer {admin_token}"}
                    )
                    return
        pytest.skip("Could not create test promo code")
    
    def test_toggle_promo_requires_auth(self):
        """PATCH /api/pagos/promo/{id}/toggle without auth should return 401/403"""
        response = requests.patch(f"{BASE_URL}/api/pagos/promo/fake-id/toggle")
        assert response.status_code in [401, 403]
    
    def test_toggle_promo_deactivate(self, admin_token, test_promo_code):
        """PATCH /api/pagos/promo/{id}/toggle should deactivate active code"""
        promo_id = test_promo_code["id"]
        initial_state = test_promo_code["activo"]
        
        response = requests.patch(
            f"{BASE_URL}/api/pagos/promo/{promo_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["activo"] != initial_state
    
    def test_toggle_promo_not_found(self, admin_token):
        """PATCH /api/pagos/promo/{id}/toggle with invalid ID should return 404"""
        response = requests.patch(
            f"{BASE_URL}/api/pagos/promo/nonexistent-id-12345/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestAdminPromoCodesDelete:
    """Tests for DELETE /api/pagos/promo/{id} - Admin only"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_delete_promo_requires_auth(self):
        """DELETE /api/pagos/promo/{id} without auth should return 401/403"""
        response = requests.delete(f"{BASE_URL}/api/pagos/promo/fake-id")
        assert response.status_code in [401, 403]
    
    def test_delete_promo_success(self, admin_token):
        """DELETE /api/pagos/promo/{id} should delete the code"""
        # Create a code to delete
        unique_code = f"TESTDEL_{uuid.uuid4().hex[:6].upper()}"
        
        create_response = requests.post(
            f"{BASE_URL}/api/pagos/promo/crear",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": unique_code,
                "descuento_porcentaje": 10,
                "max_usos": 5
            }
        )
        assert create_response.status_code == 200
        
        # Get the ID
        list_response = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        promo_id = None
        for promo in list_response.json().get("promo_codes", []):
            if promo["code"] == unique_code:
                promo_id = promo["id"]
                break
        
        assert promo_id is not None, "Created promo code not found"
        
        # Delete the code
        delete_response = requests.delete(
            f"{BASE_URL}/api/pagos/promo/{promo_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion
        list_response2 = requests.get(
            f"{BASE_URL}/api/pagos/promo/listar",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        for promo in list_response2.json().get("promo_codes", []):
            assert promo["code"] != unique_code, "Code was not deleted"
    
    def test_delete_promo_not_found(self, admin_token):
        """DELETE /api/pagos/promo/{id} with invalid ID should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/pagos/promo/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestPromoCodeValidation:
    """Tests for POST /api/pagos/promo/validar - Authenticated users"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_validar_promo_requires_auth(self):
        """POST /api/pagos/promo/validar without auth should return 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/validar",
            json={"code": "TEST"}
        )
        assert response.status_code in [401, 403]
    
    def test_validar_promo_invalid_code(self, admin_token):
        """POST /api/pagos/promo/validar with invalid code should return valid=false"""
        response = requests.post(
            f"{BASE_URL}/api/pagos/promo/validar",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"code": "NONEXISTENT_CODE_12345"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == False
        assert "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
