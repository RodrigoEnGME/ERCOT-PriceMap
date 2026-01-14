"""
Script para poblar la base de datos con datos de ejemplo.
Ejecutar después de crear las tablas.
"""
import sys
from datetime import datetime, timedelta
from random import uniform, choice
from sqlalchemy.orm import Session

# Añadir la ruta del proyecto al path
sys.path.append('.')

from app.db.database import SessionLocal, init_db
from app.models import User, Node, PriceRecord
from app.core.security import get_password_hash

def create_sample_users(db: Session):
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

def create_sample_nodes(db: Session):
    """Crear nodos de ejemplo en Texas."""
    # Coordenadas aproximadas de ciudades principales de Texas
    texas_nodes = [
        {"code": "HOUSTON_HUB", "name": "Houston Hub", "lat": 29.7604, "lon": -95.3698, "zone": "Coast"},
        {"code": "DALLAS_HUB", "name": "Dallas Hub", "lat": 32.7767, "lon": -96.7970, "zone": "North"},
        {"code": "AUSTIN_HUB", "name": "Austin Hub", "lat": 30.2672, "lon": -97.7431, "zone": "Central"},
        {"code": "SAN_ANTONIO", "name": "San Antonio Node", "lat": 29.4241, "lon": -98.4936, "zone": "South"},
        {"code": "FORT_WORTH", "name": "Fort Worth Node", "lat": 32.7555, "lon": -97.3308, "zone": "North"},
        {"code": "EL_PASO", "name": "El Paso Node", "lat": 31.7619, "lon": -106.4850, "zone": "West"},
        {"code": "CORPUS_CHRISTI", "name": "Corpus Christi Node", "lat": 27.8006, "lon": -97.3964, "zone": "Coast"},
        {"code": "LUBBOCK", "name": "Lubbock Node", "lat": 33.5779, "lon": -101.8552, "zone": "Panhandle"},
        {"code": "AMARILLO", "name": "Amarillo Node", "lat": 35.2220, "lon": -101.8313, "zone": "Panhandle"},
        {"code": "MIDLAND", "name": "Midland Node", "lat": 31.9973, "lon": -102.0779, "zone": "West"},
    ]
    
    for node_data in texas_nodes:
        existing = db.query(Node).filter(Node.code == node_data["code"]).first()
        if not existing:
            node = Node(
                code=node_data["code"],
                name=node_data["name"],
                latitude=node_data["lat"],
                longitude=node_data["lon"],
                market="ERCOT",
                zone=node_data["zone"],
            )
            db.add(node)
            print(f"Created node: {node_data['code']}")
    
    db.commit()

def create_sample_price_records(db: Session):
    """Crear registros de precios de ejemplo."""
    nodes = db.query(Node).all()
    
    if not nodes:
        print("No nodes found. Create nodes first.")
        return
    
    # Generar datos para los últimos 30 días
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    current_date = start_date
    batch_size = 1000
    records = []
    
    print("Generating price records...")
    
    while current_date <= end_date:
        for node in nodes:
            # Generar precio base con variación por nodo
            base_price = uniform(20, 80)
            
            # Simular variación horaria (más caro en horas pico)
            hour = current_date.hour
            if 6 <= hour <= 9 or 17 <= hour <= 21:
                base_price *= uniform(1.2, 1.8)
            
            # Agregar algo de aleatoriedad
            price = base_price + uniform(-10, 10)
            price = max(5, price)  # Precio mínimo de $5/MWh
            
            # Generar datos de capturas (solar y eólica)
            solar_capture = uniform(0, 500) if 7 <= hour <= 19 else 0
            wind_capture = uniform(100, 800)
            
            record = PriceRecord(
                node_id=node.id,
                timestamp=current_date,
                price=round(price, 2),
                solar_capture=round(solar_capture, 2),
                wind_capture=round(wind_capture, 2),
                market="ERCOT",
            )
            records.append(record)
            
            # Insertar en lotes para mejor rendimiento
            if len(records) >= batch_size:
                db.bulk_save_objects(records)
                db.commit()
                print(f"Inserted {len(records)} records...")
                records = []
        
        current_date += timedelta(hours=1)
    
    # Insertar registros restantes
    if records:
        db.bulk_save_objects(records)
        db.commit()
        print(f"Inserted {len(records)} records...")
    
    print("Price records created successfully!")

def main():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        print("\n1. Creating sample users...")
        create_sample_users(db)
        
        print("\n2. Creating sample nodes...")
        create_sample_nodes(db)
        
        print("\n3. Creating sample price records (this may take a while)...")
        create_sample_price_records(db)
        
        print("\n✅ Database populated successfully!")
        print("\nTest credentials:")
        print("  Admin: admin / admin123")
        print("  Premium: premium / premium123")
        print("  Basic: basic / basic123")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
