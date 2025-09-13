#!/usr/bin/env python3
"""
H2EAUX Gestion Backend API Test Suite
Tests authentication, client management, database integration, and security
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"
print(f"Testing backend at: {BASE_URL}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def assert_test(self, condition, test_name, error_msg=""):
        if condition:
            print(f"✅ {test_name}")
            self.passed += 1
        else:
            print(f"❌ {test_name}: {error_msg}")
            self.failed += 1
            self.errors.append(f"{test_name}: {error_msg}")
            
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Total: {self.passed + self.failed}")
        
        if self.errors:
            print(f"\n{'='*60}")
            print("FAILED TESTS:")
            print(f"{'='*60}")
            for error in self.errors:
                print(f"❌ {error}")
        
        return self.failed == 0

# Global test results
results = TestResults()

def test_health_endpoint():
    """Test the health check endpoint"""
    print(f"\n{'='*60}")
    print("TESTING HEALTH ENDPOINT")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Health endpoint returns 200",
            f"Got status {response.status_code}"
        )
        
        data = response.json()
        results.assert_test(
            data.get("status") == "ok",
            "Health endpoint returns correct status",
            f"Got status: {data.get('status')}"
        )
        
        results.assert_test(
            "H2EAUX Gestion API is running" in data.get("message", ""),
            "Health endpoint returns correct message",
            f"Got message: {data.get('message')}"
        )
        
    except Exception as e:
        results.assert_test(False, "Health endpoint accessible", str(e))

def test_authentication():
    """Test authentication system"""
    print(f"\n{'='*60}")
    print("TESTING AUTHENTICATION SYSTEM")
    print(f"{'='*60}")
    
    # Test admin login
    admin_token = None
    try:
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_login_data, timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Admin login successful",
            f"Got status {response.status_code}: {response.text}"
        )
        
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get("access_token")
            results.assert_test(
                admin_token is not None,
                "Admin login returns access token",
                "No access_token in response"
            )
            
            results.assert_test(
                data.get("token_type") == "bearer",
                "Admin login returns correct token type",
                f"Got token_type: {data.get('token_type')}"
            )
            
            user_data = data.get("user", {})
            results.assert_test(
                user_data.get("username") == "admin",
                "Admin login returns correct username",
                f"Got username: {user_data.get('username')}"
            )
            
            results.assert_test(
                user_data.get("role") == "admin",
                "Admin login returns correct role",
                f"Got role: {user_data.get('role')}"
            )
            
            results.assert_test(
                user_data.get("permissions", {}).get("parametres") == True,
                "Admin has parametres permission",
                f"Admin permissions: {user_data.get('permissions')}"
            )
            
    except Exception as e:
        results.assert_test(False, "Admin login request", str(e))
    
    # Test employee login
    employee_token = None
    try:
        employee_login_data = {
            "username": "employe1",
            "password": "employe123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=employee_login_data, timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Employee login successful",
            f"Got status {response.status_code}: {response.text}"
        )
        
        if response.status_code == 200:
            data = response.json()
            employee_token = data.get("access_token")
            results.assert_test(
                employee_token is not None,
                "Employee login returns access token",
                "No access_token in response"
            )
            
            user_data = data.get("user", {})
            results.assert_test(
                user_data.get("username") == "employe1",
                "Employee login returns correct username",
                f"Got username: {user_data.get('username')}"
            )
            
            results.assert_test(
                user_data.get("role") == "employee",
                "Employee login returns correct role",
                f"Got role: {user_data.get('role')}"
            )
            
            results.assert_test(
                user_data.get("permissions", {}).get("parametres") == False,
                "Employee does not have parametres permission",
                f"Employee permissions: {user_data.get('permissions')}"
            )
            
    except Exception as e:
        results.assert_test(False, "Employee login request", str(e))
    
    # Test invalid login
    try:
        invalid_login_data = {
            "username": "invalid",
            "password": "invalid"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=invalid_login_data, timeout=10)
        results.assert_test(
            response.status_code == 401,
            "Invalid login returns 401",
            f"Got status {response.status_code}"
        )
        
    except Exception as e:
        results.assert_test(False, "Invalid login test", str(e))
    
    return admin_token, employee_token

def test_protected_endpoints(admin_token, employee_token):
    """Test protected endpoints with and without authentication"""
    print(f"\n{'='*60}")
    print("TESTING PROTECTED ENDPOINTS")
    print(f"{'='*60}")
    
    # Test accessing clients without token
    try:
        response = requests.get(f"{BASE_URL}/clients", timeout=10)
        results.assert_test(
            response.status_code == 403,
            "Clients endpoint requires authentication",
            f"Got status {response.status_code} instead of 403"
        )
    except Exception as e:
        results.assert_test(False, "Unauthenticated clients access test", str(e))
    
    # Test accessing clients with invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/clients", headers=headers, timeout=10)
        results.assert_test(
            response.status_code == 401,
            "Invalid token returns 401",
            f"Got status {response.status_code}"
        )
    except Exception as e:
        results.assert_test(False, "Invalid token test", str(e))
    
    # Test accessing clients with valid admin token
    if admin_token:
        try:
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = requests.get(f"{BASE_URL}/clients", headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Admin can access clients endpoint",
                f"Got status {response.status_code}: {response.text}"
            )
        except Exception as e:
            results.assert_test(False, "Admin clients access test", str(e))
    
    # Test accessing clients with valid employee token
    if employee_token:
        try:
            headers = {"Authorization": f"Bearer {employee_token}"}
            response = requests.get(f"{BASE_URL}/clients", headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Employee can access clients endpoint",
                f"Got status {response.status_code}: {response.text}"
            )
        except Exception as e:
            results.assert_test(False, "Employee clients access test", str(e))

def test_client_management(admin_token):
    """Test client CRUD operations"""
    print(f"\n{'='*60}")
    print("TESTING CLIENT MANAGEMENT")
    print(f"{'='*60}")
    
    if not admin_token:
        results.assert_test(False, "Client management tests", "No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    created_client_id = None
    
    # Test creating a client with realistic French data
    try:
        client_data = {
            "nom": "Dubois",
            "prenom": "Jean-Pierre",
            "telephone": "01 42 34 56 78",
            "email": "jp.dubois@email.fr",
            "adresse": "15 rue de la Paix",
            "ville": "Paris",
            "code_postal": "75001",
            "type_chauffage": "Pompe à chaleur",
            "notes": "Client préférant les rendez-vous le matin. Installation prévue pour mars 2025."
        }
        
        response = requests.post(f"{BASE_URL}/clients", json=client_data, headers=headers, timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Create client successful",
            f"Got status {response.status_code}: {response.text}"
        )
        
        if response.status_code == 200:
            created_client = response.json()
            created_client_id = created_client.get("id")
            
            results.assert_test(
                created_client.get("nom") == "Dubois",
                "Created client has correct nom",
                f"Got nom: {created_client.get('nom')}"
            )
            
            results.assert_test(
                created_client.get("prenom") == "Jean-Pierre",
                "Created client has correct prenom",
                f"Got prenom: {created_client.get('prenom')}"
            )
            
            results.assert_test(
                created_client.get("ville") == "Paris",
                "Created client has correct ville",
                f"Got ville: {created_client.get('ville')}"
            )
            
            results.assert_test(
                created_client_id is not None,
                "Created client has ID",
                "No ID in response"
            )
            
    except Exception as e:
        results.assert_test(False, "Create client request", str(e))
    
    # Test getting all clients
    try:
        response = requests.get(f"{BASE_URL}/clients", headers=headers, timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Get all clients successful",
            f"Got status {response.status_code}: {response.text}"
        )
        
        if response.status_code == 200:
            clients = response.json()
            results.assert_test(
                isinstance(clients, list),
                "Get clients returns list",
                f"Got type: {type(clients)}"
            )
            
            results.assert_test(
                len(clients) > 0,
                "Clients list contains created client",
                f"Got {len(clients)} clients"
            )
            
    except Exception as e:
        results.assert_test(False, "Get all clients request", str(e))
    
    # Test getting specific client
    if created_client_id:
        try:
            response = requests.get(f"{BASE_URL}/clients/{created_client_id}", headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Get specific client successful",
                f"Got status {response.status_code}: {response.text}"
            )
            
            if response.status_code == 200:
                client = response.json()
                results.assert_test(
                    client.get("id") == created_client_id,
                    "Retrieved client has correct ID",
                    f"Expected {created_client_id}, got {client.get('id')}"
                )
                
        except Exception as e:
            results.assert_test(False, "Get specific client request", str(e))
    
    # Test updating client
    if created_client_id:
        try:
            update_data = {
                "telephone": "01 42 34 56 99",
                "notes": "Numéro de téléphone mis à jour. Client préférant les rendez-vous l'après-midi."
            }
            
            response = requests.put(f"{BASE_URL}/clients/{created_client_id}", json=update_data, headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Update client successful",
                f"Got status {response.status_code}: {response.text}"
            )
            
            if response.status_code == 200:
                updated_client = response.json()
                results.assert_test(
                    updated_client.get("telephone") == "01 42 34 56 99",
                    "Client telephone updated correctly",
                    f"Got telephone: {updated_client.get('telephone')}"
                )
                
                results.assert_test(
                    "l'après-midi" in updated_client.get("notes", ""),
                    "Client notes updated correctly",
                    f"Got notes: {updated_client.get('notes')}"
                )
                
        except Exception as e:
            results.assert_test(False, "Update client request", str(e))
    
    # Test deleting client
    if created_client_id:
        try:
            response = requests.delete(f"{BASE_URL}/clients/{created_client_id}", headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Delete client successful",
                f"Got status {response.status_code}: {response.text}"
            )
            
            if response.status_code == 200:
                # Verify client is deleted
                response = requests.get(f"{BASE_URL}/clients/{created_client_id}", headers=headers, timeout=10)
                results.assert_test(
                    response.status_code == 404,
                    "Deleted client not found",
                    f"Got status {response.status_code} instead of 404"
                )
                
        except Exception as e:
            results.assert_test(False, "Delete client request", str(e))

def test_input_validation(admin_token):
    """Test input validation for client creation"""
    print(f"\n{'='*60}")
    print("TESTING INPUT VALIDATION")
    print(f"{'='*60}")
    
    if not admin_token:
        results.assert_test(False, "Input validation tests", "No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test creating client with missing required fields
    try:
        invalid_client_data = {
            "telephone": "01 42 34 56 78"
            # Missing nom and prenom which are required
        }
        
        response = requests.post(f"{BASE_URL}/clients", json=invalid_client_data, headers=headers, timeout=10)
        results.assert_test(
            response.status_code == 422,
            "Missing required fields returns 422",
            f"Got status {response.status_code}: {response.text}"
        )
        
    except Exception as e:
        results.assert_test(False, "Invalid client creation test", str(e))

def test_database_persistence(admin_token):
    """Test database persistence by creating, retrieving, and verifying data"""
    print(f"\n{'='*60}")
    print("TESTING DATABASE PERSISTENCE")
    print(f"{'='*60}")
    
    if not admin_token:
        results.assert_test(False, "Database persistence tests", "No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a client with specific data
    try:
        test_client_data = {
            "nom": "Martin",
            "prenom": "Sophie",
            "telephone": "02 98 76 54 32",
            "email": "sophie.martin@test.fr",
            "adresse": "42 avenue des Champs",
            "ville": "Brest",
            "code_postal": "29200",
            "type_chauffage": "Chaudière gaz",
            "notes": "Test de persistance des données - client créé le " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = requests.post(f"{BASE_URL}/clients", json=test_client_data, headers=headers, timeout=10)
        results.assert_test(
            response.status_code == 200,
            "Test client created for persistence check",
            f"Got status {response.status_code}: {response.text}"
        )
        
        if response.status_code == 200:
            created_client = response.json()
            client_id = created_client.get("id")
            
            # Retrieve the client and verify all data persisted correctly
            response = requests.get(f"{BASE_URL}/clients/{client_id}", headers=headers, timeout=10)
            results.assert_test(
                response.status_code == 200,
                "Persisted client retrieved successfully",
                f"Got status {response.status_code}: {response.text}"
            )
            
            if response.status_code == 200:
                retrieved_client = response.json()
                
                # Check all fields persisted correctly
                for field, expected_value in test_client_data.items():
                    actual_value = retrieved_client.get(field)
                    results.assert_test(
                        actual_value == expected_value,
                        f"Field '{field}' persisted correctly",
                        f"Expected '{expected_value}', got '{actual_value}'"
                    )
                
                # Verify timestamps are present
                results.assert_test(
                    retrieved_client.get("created_at") is not None,
                    "Client has created_at timestamp",
                    "No created_at field"
                )
                
                results.assert_test(
                    retrieved_client.get("updated_at") is not None,
                    "Client has updated_at timestamp",
                    "No updated_at field"
                )
            
            # Clean up test client
            requests.delete(f"{BASE_URL}/clients/{client_id}", headers=headers, timeout=10)
            
    except Exception as e:
        results.assert_test(False, "Database persistence test", str(e))

def main():
    """Run all tests"""
    print("H2EAUX Gestion Backend API Test Suite")
    print("=" * 60)
    
    # Test health endpoint first
    test_health_endpoint()
    
    # Test authentication
    admin_token, employee_token = test_authentication()
    
    # Test protected endpoints
    test_protected_endpoints(admin_token, employee_token)
    
    # Test client management (CRUD operations)
    test_client_management(admin_token)
    
    # Test input validation
    test_input_validation(admin_token)
    
    # Test database persistence
    test_database_persistence(admin_token)
    
    # Print final summary
    success = results.print_summary()
    
    if success:
        print(f"\n🎉 ALL TESTS PASSED! The H2EAUX Gestion backend API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  SOME TESTS FAILED! Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()