"""
Backend API Tests for CotizaBot Authentication System
Tests: Registration, Login, /me endpoint, and cotizaciones estadisticas
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quoterobot.preview.emergentagent.com')

class TestHealthCheck:
    """Health check endpoint tests - run first"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'CotizaBot'
        print(f"✓ Health check passed: {data}")


class TestAuthRegistration:
    """User registration flow tests"""
    
    def test_registro_nuevo_usuario(self):
        """Test new user registration creates user and empresa"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "email": f"TEST_user_{unique_id}@cotizabot.com",
            "password": "TestPassword123",
            "nombre": "Usuario Prueba",
            "empresa_nombre": f"Ferretería Test {unique_id}",
            "telefono": "5512345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        
        # Status assertion
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "usuario" in data, "Response should contain usuario"
        
        usuario = data['usuario']
        assert usuario['email'] == payload['email']
        assert usuario['nombre'] == payload['nombre']
        assert usuario['empresa_nombre'] == payload['empresa_nombre']
        assert usuario['plan'] == 'gratis', "New users should start with 'gratis' plan"
        assert 'id' in usuario
        assert 'empresa_id' in usuario
        
        print(f"✓ Registration successful: {usuario['email']}, Plan: {usuario['plan']}")
        return data
    
    def test_registro_email_duplicado(self):
        """Test registration with existing email fails"""
        # First registration
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "email": f"TEST_dup_{unique_id}@cotizabot.com",
            "password": "TestPassword123",
            "nombre": "Usuario Duplicado",
            "empresa_nombre": f"Empresa Dup {unique_id}",
            "telefono": "5512345678"
        }
        
        response1 = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        assert response1.status_code == 201
        
        # Second registration with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        assert response2.status_code == 400, f"Expected 400 for duplicate email, got {response2.status_code}"
        
        data = response2.json()
        assert "detail" in data
        assert "registrado" in data['detail'].lower() or "email" in data['detail'].lower()
        print(f"✓ Duplicate email correctly rejected: {data['detail']}")


class TestAuthLogin:
    """Login flow tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_user(self):
        """Create a test user for login tests"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.test_email = f"TEST_login_{self.unique_id}@cotizabot.com"
        self.test_password = "TestPassword123"
        
        payload = {
            "email": self.test_email,
            "password": self.test_password,
            "nombre": "Usuario Login Test",
            "empresa_nombre": f"Empresa Login {self.unique_id}",
            "telefono": "5512345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        if response.status_code == 201:
            self.test_user_data = response.json()
        else:
            pytest.skip(f"Could not create test user: {response.text}")
    
    def test_login_credenciales_validas(self):
        """Test login with valid credentials"""
        payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "access_token" in data
        assert "usuario" in data
        
        usuario = data['usuario']
        assert usuario['email'] == self.test_email
        assert 'id' in usuario
        assert 'empresa_id' in usuario
        assert 'plan' in usuario
        
        print(f"✓ Login successful: {usuario['email']}, Plan: {usuario['plan']}")
    
    def test_login_credenciales_invalidas_email(self):
        """Test login with wrong email"""
        payload = {
            "email": "nonexistent@cotizabot.com",
            "password": "WrongPassword123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid email correctly rejected: {data['detail']}")
    
    def test_login_credenciales_invalidas_password(self):
        """Test login with wrong password"""
        payload = {
            "email": self.test_email,
            "password": "WrongPassword999"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid password correctly rejected: {data['detail']}")


class TestAuthMe:
    """Test /auth/me endpoint for authenticated user data"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_user(self):
        """Create and authenticate a test user"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.test_email = f"TEST_me_{self.unique_id}@cotizabot.com"
        self.test_password = "TestPassword123"
        self.empresa_nombre = f"Empresa Me {self.unique_id}"
        
        payload = {
            "email": self.test_email,
            "password": self.test_password,
            "nombre": "Usuario Me Test",
            "empresa_nombre": self.empresa_nombre,
            "telefono": "5512345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        if response.status_code == 201:
            data = response.json()
            self.token = data['access_token']
            self.user_data = data['usuario']
        else:
            pytest.skip(f"Could not create test user: {response.text}")
    
    def test_me_endpoint_authenticated(self):
        """Test /auth/me returns user and empresa data"""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "usuario" in data
        assert "empresa" in data
        
        usuario = data['usuario']
        assert usuario['email'] == self.test_email
        assert usuario['nombre'] == "Usuario Me Test"
        assert 'password_hash' not in usuario, "Password hash should not be exposed"
        
        empresa = data['empresa']
        assert empresa['nombre'] == self.empresa_nombre
        assert empresa['plan'] == 'gratis'
        assert empresa['cotizaciones_usadas'] == 0
        assert empresa['cotizaciones_limite'] == 5
        
        print(f"✓ /auth/me returned correct data: {usuario['email']}, Empresa: {empresa['nombre']}")
    
    def test_me_endpoint_unauthenticated(self):
        """Test /auth/me without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated request correctly rejected with {response.status_code}")
    
    def test_me_endpoint_invalid_token(self):
        """Test /auth/me with invalid token returns 401"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid token correctly rejected")


class TestCotizacionesEstadisticas:
    """Test /cotizaciones/estadisticas endpoint for plan limits"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_user(self):
        """Create and authenticate a test user"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.test_email = f"TEST_stats_{self.unique_id}@cotizabot.com"
        self.test_password = "TestPassword123"
        
        payload = {
            "email": self.test_email,
            "password": self.test_password,
            "nombre": "Usuario Stats Test",
            "empresa_nombre": f"Empresa Stats {self.unique_id}",
            "telefono": "5512345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/registro", json=payload)
        if response.status_code == 201:
            data = response.json()
            self.token = data['access_token']
        else:
            pytest.skip(f"Could not create test user: {response.text}")
    
    def test_estadisticas_plan_gratis(self):
        """Test estadisticas returns correct plan limits for free plan"""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.get(f"{BASE_URL}/api/cotizaciones/estadisticas", headers=headers)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data['plan'] == 'gratis'
        assert data['cotizaciones_usadas'] == 0
        assert data['cotizaciones_limite'] == 5
        assert data['cotizaciones_restantes'] == 5
        
        print(f"✓ Estadisticas correct: Plan={data['plan']}, Usadas={data['cotizaciones_usadas']}, Limite={data['cotizaciones_limite']}")
    
    def test_estadisticas_unauthenticated(self):
        """Test estadisticas without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/cotizaciones/estadisticas")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated estadisticas request correctly rejected")


class TestExistingTestUser:
    """Test with provided test credentials"""
    
    def test_login_with_provided_credentials(self):
        """Test login with test2@cotizabot.com credentials"""
        payload = {
            "email": "test2@cotizabot.com",
            "password": "TestPassword123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        # This user may or may not exist - document the result
        if response.status_code == 200:
            data = response.json()
            print(f"✓ test2@cotizabot.com login successful: Plan={data['usuario'].get('plan')}")
            
            # Test /me with this user
            headers = {"Authorization": f"Bearer {data['access_token']}"}
            me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            if me_response.status_code == 200:
                me_data = me_response.json()
                print(f"  - Empresa: {me_data['empresa']['nombre']}")
                print(f"  - Cotizaciones usadas: {me_data['empresa'].get('cotizaciones_usadas', 0)}")
        elif response.status_code == 401:
            print(f"⚠ test2@cotizabot.com does not exist or wrong password - will create")
            # Create the user
            create_payload = {
                "email": "test2@cotizabot.com",
                "password": "TestPassword123",
                "nombre": "Usuario Prueba",
                "empresa_nombre": "Ferretería Test",
                "telefono": "5512345678"
            }
            create_response = requests.post(f"{BASE_URL}/api/auth/registro", json=create_payload)
            if create_response.status_code == 201:
                print(f"✓ Created test2@cotizabot.com successfully")
            else:
                print(f"⚠ Could not create test2@cotizabot.com: {create_response.text}")
        else:
            print(f"⚠ Unexpected response: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
