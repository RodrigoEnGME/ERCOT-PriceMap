"""
Script para poblar la base de datos con los 150 nodos reales de Texas.
"""
import sys
import os
from datetime import datetime, timedelta
from random import uniform
import openpyxl

sys.path.append('.')

from app.db.database import SessionLocal, init_db
from app.models import User, Node, PriceRecord
from app.core.security import get_password_hash

def load_nodes_from_excel(excel_path: str):
    """Cargar nodos desde el archivo Excel."""
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active
    
    nodes = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        code, name, lat, lng, market, zone, is_active, created_at = row
        if is_active:
            nodes.append({
                'code': code,
                'name': name,
                'latitude': float(lat),
                'longitude': float(lng),
                'market': market,
                'zone': zone
            })
    
    return nodes

def create_real_nodes(db):
    """Crear los 150 nodos reales de Texas."""
    excel_path = os.path.join('..', 'Fuentes', 'TX Nodos de Referencia_r1.xlsx')
    
    if not os.path.exists(excel_path):
        print(f"Error: No se encontró el archivo {excel_path}")
        return
    
    nodes_data = load_nodes_from_excel(excel_path)
    print(f"Cargando {len(nodes_data)} nodos desde Excel...")
    
    created_count = 0
    updated_count = 0
    
    for node_data in nodes_data:
        existing = db.query(Node).filter(Node.code == node_data['code']).first()
        if existing:
            # Actualizar nodo existente
            existing.name = node_data['name']
            existing.latitude = node_data['latitude']
            existing.longitude = node_data['longitude']
            existing.market = node_data['market']
            existing.zone = node_data['zone']
            updated_count += 1
        else:
            # Crear nuevo nodo
            node = Node(
                code=node_data['code'],
                name=node_data['name'],
                latitude=node_data['latitude'],
                longitude=node_data['longitude'],
                market=node_data['market'],
                zone=node_data['zone'],
                is_active=True
            )
            db.add(node)
            created_count += 1
    
    db.commit()
    print(f"Nodos creados: {created_count}, actualizados: {updated_count}")

def create_sample_users(db):
    """Crear usuarios de ejemplo."""
    users = [
        {
            "email": "admin@ercot.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "Administrator",
            "role": "admin",
        },
        {
            "email": "premium@ercot.com",
            "username": "premium",
            "password": "premium123",
            "full_name": "Premium User",
            "role": "premium",
        },
        {
            "email": "basic@ercot.com",
            "username": "basic",
            "password": "basic123",
            "full_name": "Basic User",
            "role": "basic",
        },
    ]
    
    for user_data in users:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
            )
            db.add(user)
            print(f"Created user: {user_data['username']}")
    
    db.commit()

def create_sample_prices(db):
    """Crear precios de ejemplo para los últimos 30 días."""
    nodes = db.query(Node).all()
    
    if not nodes:
        print("No hay nodos en la base de datos. Ejecute primero create_real_nodes().")
        return
    
    print(f"Generando precios para {len(nodes)} nodos...")
    
    # Generar datos para los últimos 30 días
    end_date = datetime(2025, 12, 15, 23, 50, 31)  # Fecha de los datos de prueba
    start_date = end_date - timedelta(days=30)
    
    current_date = start_date
    records_created = 0
    
    while current_date <= end_date:
        for node in nodes:
            # Verificar si ya existe un registro para esta fecha y nodo
            existing = db.query(PriceRecord).filter(
                PriceRecord.node_id == node.id,
                PriceRecord.timestamp == current_date
            ).first()
            
            if not existing:
                # Generar precio aleatorio con tendencias por zona
                base_price = {
                    'Coast': 35,
                    'North': 30,
                    'Central': 32,
                    'South': 33,
                    'West': 38,
                    'Panhandle': 28
                }.get(node.zone, 30)
                
                price = base_price + uniform(-15, 25)
                
                record = PriceRecord(
                    node_id=node.id,
                    timestamp=current_date,
                    price=round(price, 2),
                    market='MDA',
                    solar_capture=round(price * uniform(0.7, 0.9), 2),
                    wind_capture=round(price * uniform(0.8, 0.95), 2),
                )
                db.add(record)
                records_created += 1
        
        current_date += timedelta(hours=1)
        
        # Commit cada 1000 registros para evitar problemas de memoria
        if records_created % 1000 == 0:
            db.commit()
            print(f"  Creados {records_created} registros...")
    
    db.commit()
    print(f"Total de registros de precios creados: {records_created}")

def main():
    """Función principal."""
    print("Inicializando base de datos...")
    init_db()
    
    db = SessionLocal()
    
    try:
        print("\n1. Creando usuarios de ejemplo...")
        create_sample_users(db)
        
        print("\n2. Cargando 150 nodos reales desde Excel...")
        create_real_nodes(db)
        
        print("\n3. Generando datos de precios de ejemplo...")
        create_sample_prices(db)
        
        print("\n✓ Base de datos poblada exitosamente!")
        print("\nCredenciales de acceso:")
        print("  Admin:   admin / admin123")
        print("  Premium: premium / premium123")
        print("  Basic:   basic / basic123")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
