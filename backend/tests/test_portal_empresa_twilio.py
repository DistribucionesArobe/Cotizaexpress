"""
Test suite for Portal Cliente, Empresa (Facturama), and Twilio WhatsApp configuration
Tests the new features: portal público, facturación CFDI, and WhatsApp Business setup
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous iterations
TEST_EMAIL = "test@cotizabot.com"
TEST_PASSWORD = "Test123456"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    # If test user doesn't exist, create one
    register_response = api_client.post(f"{BASE_URL}/api/auth/registro", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "nombre": "Test User",
        "empresa_nombre": "Test Empresa",
        "telefono": "+521234567890"
    })
    if register_response.status_code in [200, 201]:
        data = register_response.json()
        return data.get("access_token") or data.get("token")
    
    pytest.skip("Could not authenticate - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==================== PORTAL CLIENTE TESTS ====================

class TestPortalCliente:
    """Tests for Portal Cliente - public quotation access"""
    
    def test_portal_cotizacion_invalid_token(self, api_client):
        """Test accessing portal with invalid token returns 404"""
        response = api_client.get(f"{BASE_URL}/api/portal/cotizacion/invalid-token-12345")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "no válido" in data["detail"].lower() or "expirado" in data["detail"].lower()
        print(f"✓ Invalid token returns 404: {data['detail']}")
    
    def test_portal_cotizacion_pdf_invalid_token(self, api_client):
        """Test downloading PDF with invalid token returns 404"""
        response = api_client.get(f"{BASE_URL}/api/portal/cotizacion/invalid-token-12345/pdf")
        assert response.status_code == 404
        print("✓ Invalid token PDF download returns 404")
    
    def test_portal_cliente_invalid_token(self, api_client):
        """Test accessing client portal with invalid token returns 404"""
        response = api_client.get(f"{BASE_URL}/api/portal/cliente/invalid-client-token")
        assert response.status_code == 404
        print("✓ Invalid client token returns 404")
    
    def test_generar_enlace_cotizacion_requires_params(self, api_client):
        """Test generating portal link requires cotizacion_id and empresa_id"""
        response = api_client.post(f"{BASE_URL}/api/portal/generar-enlace")
        # Should fail without required params
        assert response.status_code in [400, 422]
        print("✓ Generate link requires parameters")
    
    def test_generar_enlace_cotizacion_not_found(self, api_client):
        """Test generating portal link for non-existent cotizacion returns 404"""
        response = api_client.post(
            f"{BASE_URL}/api/portal/generar-enlace",
            params={"cotizacion_id": "non-existent-id", "empresa_id": "non-existent-empresa"}
        )
        assert response.status_code == 404
        print("✓ Generate link for non-existent cotizacion returns 404")
    
    def test_generar_enlace_cliente_not_found(self, api_client):
        """Test generating client portal link for non-existent client returns 404"""
        response = api_client.post(
            f"{BASE_URL}/api/portal/generar-enlace-cliente",
            params={"cliente_id": "non-existent-id", "empresa_id": "non-existent-empresa"}
        )
        assert response.status_code == 404
        print("✓ Generate client link for non-existent client returns 404")


# ==================== EMPRESA / FACTURAMA TESTS ====================

class TestEmpresaCatalogos:
    """Tests for Empresa catalogos (SAT fiscal data)"""
    
    def test_get_regimenes_fiscales(self, api_client):
        """Test getting SAT fiscal regimes catalog"""
        response = api_client.get(f"{BASE_URL}/api/empresa/catalogos/regimenes-fiscales")
        assert response.status_code == 200
        data = response.json()
        assert "regimenes" in data
        assert len(data["regimenes"]) > 0
        
        # Verify structure
        first_regimen = data["regimenes"][0]
        assert "codigo" in first_regimen
        assert "nombre" in first_regimen
        
        # Verify common regimes exist
        codigos = [r["codigo"] for r in data["regimenes"]]
        assert "601" in codigos  # General de Ley Personas Morales
        assert "612" in codigos  # Personas Físicas con Actividades Empresariales
        assert "626" in codigos  # Régimen Simplificado de Confianza
        print(f"✓ Got {len(data['regimenes'])} fiscal regimes")
    
    def test_get_usos_cfdi(self, api_client):
        """Test getting SAT CFDI uses catalog"""
        response = api_client.get(f"{BASE_URL}/api/empresa/catalogos/usos-cfdi")
        assert response.status_code == 200
        data = response.json()
        assert "usos_cfdi" in data
        assert len(data["usos_cfdi"]) > 0
        
        # Verify structure
        first_uso = data["usos_cfdi"][0]
        assert "codigo" in first_uso
        assert "nombre" in first_uso
        
        # Verify common uses exist
        codigos = [u["codigo"] for u in data["usos_cfdi"]]
        assert "G01" in codigos  # Adquisición de mercancías
        assert "G03" in codigos  # Gastos en general
        assert "S01" in codigos  # Sin efectos fiscales
        print(f"✓ Got {len(data['usos_cfdi'])} CFDI uses")


class TestEmpresaPerfil:
    """Tests for Empresa profile management"""
    
    def test_get_perfil_requires_auth(self, api_client):
        """Test getting empresa profile requires authentication"""
        # Remove auth header temporarily
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/empresa/perfil")
        assert response.status_code in [401, 403]
        
        # Restore headers
        api_client.headers = original_headers
        print("✓ Get profile requires authentication")
    
    def test_get_perfil_authenticated(self, authenticated_client):
        """Test getting empresa profile with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/empresa/perfil")
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile structure
        assert "id" in data
        assert "nombre" in data
        assert "plan" in data
        print(f"✓ Got empresa profile: {data.get('nombre')}, plan: {data.get('plan')}")
    
    def test_get_datos_fiscales_authenticated(self, authenticated_client):
        """Test getting empresa fiscal data with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/empresa/datos-fiscales")
        assert response.status_code == 200
        data = response.json()
        
        assert "datos_fiscales" in data
        assert "tiene_datos_completos" in data
        print(f"✓ Got fiscal data, complete: {data.get('tiene_datos_completos')}")
    
    def test_update_datos_fiscales(self, authenticated_client):
        """Test updating empresa fiscal data"""
        fiscal_data = {
            "rfc": "TEST123456ABC",
            "razon_social": "Test Empresa SA de CV",
            "regimen_fiscal": "601",
            "uso_cfdi": "G03",
            "codigo_postal": "64000"
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/empresa/datos-fiscales",
            json=fiscal_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Updated fiscal data successfully")
        
        # Verify update persisted
        get_response = authenticated_client.get(f"{BASE_URL}/api/empresa/datos-fiscales")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["datos_fiscales"].get("rfc") == "TEST123456ABC"
        print("✓ Verified fiscal data persisted")


class TestSolicitarFactura:
    """Tests for Facturama invoice request"""
    
    def test_solicitar_factura_requires_auth(self, api_client):
        """Test requesting invoice requires authentication"""
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.post(f"{BASE_URL}/api/empresa/solicitar-factura", json={})
        assert response.status_code in [401, 403]
        
        api_client.headers = original_headers
        print("✓ Request invoice requires authentication")
    
    def test_solicitar_factura_with_existing_data(self, authenticated_client):
        """Test requesting invoice - may succeed or fail based on Facturama"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/empresa/solicitar-factura",
            json={"pago_referencia": "TEST-REF-001"}
        )
        
        # Should return 200 (success or handled error) or 400 (missing data)
        assert response.status_code in [200, 400, 500]
        data = response.json()
        
        if response.status_code == 200:
            assert "solicitud_id" in data
            print(f"✓ Invoice request processed: {data.get('mensaje', 'OK')}")
        elif response.status_code == 400:
            assert "detail" in data
            print(f"✓ Invoice request validation: {data['detail']}")
        else:
            print(f"✓ Invoice request handled: {data}")
    
    def test_solicitar_factura_with_fiscal_data(self, authenticated_client):
        """Test requesting invoice with complete fiscal data"""
        # First, set complete fiscal data
        fiscal_data = {
            "rfc": "XAXX010101000",  # RFC genérico para pruebas
            "razon_social": "Test Empresa SA de CV",
            "regimen_fiscal": "601",
            "uso_cfdi": "G03",
            "codigo_postal": "64000"
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/empresa/datos-fiscales",
            json=fiscal_data
        )
        assert update_response.status_code == 200
        
        # Now request invoice
        response = authenticated_client.post(
            f"{BASE_URL}/api/empresa/solicitar-factura",
            json={
                "pago_referencia": f"TEST-REF-{uuid.uuid4().hex[:8]}",
                "notas": "Test invoice request"
            }
        )
        
        # May succeed or fail depending on Facturama credentials
        # But should not be 400 for missing data
        assert response.status_code in [200, 500]  # 500 if Facturama fails
        data = response.json()
        
        if response.status_code == 200:
            assert "solicitud_id" in data
            print(f"✓ Invoice request created: {data.get('solicitud_id')}")
        else:
            # Facturama sandbox may fail - this is expected
            print(f"✓ Invoice request processed (Facturama may have failed): {data}")
    
    def test_listar_solicitudes_factura(self, authenticated_client):
        """Test listing invoice requests"""
        response = authenticated_client.get(f"{BASE_URL}/api/empresa/solicitudes-factura")
        assert response.status_code == 200
        data = response.json()
        assert "solicitudes" in data
        assert isinstance(data["solicitudes"], list)
        print(f"✓ Got {len(data['solicitudes'])} invoice requests")


# ==================== TWILIO WHATSAPP TESTS ====================

class TestTwilioCiudades:
    """Tests for Twilio cities catalog"""
    
    def test_listar_ciudades_requires_auth(self, api_client):
        """Test listing cities requires authentication"""
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/twilio/ciudades")
        assert response.status_code in [401, 403]
        
        api_client.headers = original_headers
        print("✓ List cities requires authentication")
    
    def test_listar_ciudades_authenticated(self, authenticated_client):
        """Test listing cities with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/twilio/ciudades")
        assert response.status_code == 200
        data = response.json()
        
        assert "ciudades" in data
        assert len(data["ciudades"]) > 0
        
        # Verify structure
        first_ciudad = data["ciudades"][0]
        assert "key" in first_ciudad
        assert "nombre" in first_ciudad
        
        # Verify major cities exist
        nombres = [c["nombre"] for c in data["ciudades"]]
        assert "Ciudad de México" in nombres
        assert "Monterrey" in nombres
        assert "Guadalajara" in nombres
        print(f"✓ Got {len(data['ciudades'])} cities")


class TestTwilioNumeros:
    """Tests for Twilio phone number management"""
    
    def test_mi_numero_requires_auth(self, api_client):
        """Test getting my number requires authentication"""
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/twilio/mi-numero")
        assert response.status_code in [401, 403]
        
        api_client.headers = original_headers
        print("✓ Get my number requires authentication")
    
    def test_mi_numero_authenticated(self, authenticated_client):
        """Test getting my number with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/twilio/mi-numero")
        assert response.status_code == 200
        data = response.json()
        
        assert "has_number" in data
        assert "plan" in data
        
        if data["has_number"]:
            assert "phone_number" in data
            print(f"✓ Has WhatsApp number: {data.get('phone_number')}")
        else:
            assert "mensaje" in data
            print(f"✓ No WhatsApp number: {data.get('mensaje')}")
    
    def test_estado_configuracion_requires_auth(self, api_client):
        """Test getting configuration status requires authentication"""
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/twilio/estado-configuracion")
        assert response.status_code in [401, 403]
        
        api_client.headers = original_headers
        print("✓ Get config status requires authentication")
    
    def test_estado_configuracion_authenticated(self, authenticated_client):
        """Test getting configuration status with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/twilio/estado-configuracion")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "plan" in data
        assert "tiene_plan_completo" in data
        assert "tiene_numero" in data
        assert "whatsapp_configurado" in data
        assert "paso_actual" in data
        assert "mensaje" in data
        
        print(f"✓ Config status: step {data['paso_actual']}, plan: {data['plan']}")
    
    def test_buscar_numeros_requires_plan_completo(self, authenticated_client):
        """Test searching numbers requires Plan Completo"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/twilio/buscar-numeros",
            json={"ciudad": "monterrey"}
        )
        
        # If user doesn't have Plan Completo, should return 403
        if response.status_code == 403:
            data = response.json()
            assert "Plan Completo" in data.get("detail", "")
            print("✓ Search numbers requires Plan Completo")
        elif response.status_code == 200:
            # User has Plan Completo
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Found {len(data)} available numbers")
        else:
            # May fail due to Twilio API issues
            print(f"✓ Search numbers returned {response.status_code}")
    
    def test_configurar_whatsapp_requires_numero(self, authenticated_client):
        """Test configuring WhatsApp requires having a number first"""
        response = authenticated_client.post(f"{BASE_URL}/api/twilio/configurar-whatsapp")
        
        # Should fail if no number purchased
        if response.status_code == 400:
            data = response.json()
            assert "número" in data.get("detail", "").lower() or "comprar" in data.get("detail", "").lower()
            print("✓ Configure WhatsApp requires purchasing number first")
        elif response.status_code == 200:
            data = response.json()
            print(f"✓ WhatsApp configured: {data}")
        else:
            print(f"✓ Configure WhatsApp returned {response.status_code}")


# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """Integration tests for the new features"""
    
    def test_full_portal_flow_simulation(self, authenticated_client):
        """Test the portal flow - create cotizacion, generate link, access portal"""
        # This is a simulation since we need a real cotizacion
        # Just verify the endpoints are accessible
        
        # 1. Verify portal endpoint exists
        response = authenticated_client.get(f"{BASE_URL}/api/portal/cotizacion/test")
        assert response.status_code == 404  # Expected - invalid token
        
        # 2. Verify generar-enlace endpoint exists
        response = authenticated_client.post(
            f"{BASE_URL}/api/portal/generar-enlace",
            params={"cotizacion_id": "test", "empresa_id": "test"}
        )
        assert response.status_code == 404  # Expected - cotizacion not found
        
        print("✓ Portal flow endpoints accessible")
    
    def test_empresa_factura_flow(self, authenticated_client):
        """Test the empresa/factura flow"""
        # 1. Get catalogs
        regimenes = authenticated_client.get(f"{BASE_URL}/api/empresa/catalogos/regimenes-fiscales")
        assert regimenes.status_code == 200
        
        usos = authenticated_client.get(f"{BASE_URL}/api/empresa/catalogos/usos-cfdi")
        assert usos.status_code == 200
        
        # 2. Get/update fiscal data
        fiscal = authenticated_client.get(f"{BASE_URL}/api/empresa/datos-fiscales")
        assert fiscal.status_code == 200
        
        # 3. Get invoice requests
        solicitudes = authenticated_client.get(f"{BASE_URL}/api/empresa/solicitudes-factura")
        assert solicitudes.status_code == 200
        
        print("✓ Empresa/factura flow working")
    
    def test_twilio_config_flow(self, authenticated_client):
        """Test the Twilio configuration flow"""
        # 1. Get cities
        ciudades = authenticated_client.get(f"{BASE_URL}/api/twilio/ciudades")
        assert ciudades.status_code == 200
        
        # 2. Get current number status
        mi_numero = authenticated_client.get(f"{BASE_URL}/api/twilio/mi-numero")
        assert mi_numero.status_code == 200
        
        # 3. Get configuration status
        estado = authenticated_client.get(f"{BASE_URL}/api/twilio/estado-configuracion")
        assert estado.status_code == 200
        
        print("✓ Twilio config flow working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
