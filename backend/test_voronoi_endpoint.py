"""Script para probar el endpoint de Voronoi"""
import requests
from datetime import datetime

# Configuración
API_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "admin123"

# 1. Login para obtener token
print("1. Haciendo login...")
response = requests.post(
    f"{API_URL}/auth/login",
    data={"username": USERNAME, "password": PASSWORD}
)
response.raise_for_status()
token = response.json()["access_token"]
print(f"✓ Token obtenido")

# 2. Headers con autenticación
headers = {"Authorization": f"Bearer {token}"}

# 3. Probar endpoint de Voronoi
print("\n2. Probando endpoint de Voronoi...")
timestamp = "2025-12-15T09:00:00"
response = requests.get(
    f"{API_URL}/prices/voronoi-map",
    headers=headers,
    params={"timestamp": timestamp, "market": "MDA"}
)

if response.status_code == 200:
    data = response.json()
    print(f"✓ Endpoint funcionando!")
    print(f"  - Total de features: {len(data['features'])}")
    
    # Contar cuántos tienen precio
    with_price = sum(1 for f in data['features'] if f['properties']['price'] is not None)
    print(f"  - Features con precio: {with_price}")
    print(f"  - Features sin precio: {len(data['features']) - with_price}")
    
    # Mostrar ejemplo de feature
    if data['features']:
        example = data['features'][0]
        print(f"\n  Ejemplo de feature:")
        print(f"    - Nombre: {example['properties']['name']}")
        print(f"    - Código: {example['properties']['code']}")
        print(f"    - Precio: ${example['properties']['price']:.2f}" if example['properties']['price'] else "    - Precio: Sin datos")
        print(f"    - Coordenadas: {example['geometry']['coordinates'][0][0][:2]}...")  # Primeras 2 coordenadas
else:
    print(f"✗ Error: {response.status_code}")
    print(response.text)
