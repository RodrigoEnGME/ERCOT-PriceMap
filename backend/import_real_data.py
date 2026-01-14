"""
Script para importar datos reales de ERCOT
Soporta archivos CSV y Excel

USO:
python import_real_data.py --nodes data/nodes.csv --prices data/prices_2023.csv

ESTRUCTURA CSV ESPERADA:

nodes.csv:
    code,name,latitude,longitude,market,zone

prices.csv:
    node_code,timestamp,price,solar_capture,wind_capture,market
"""

import sys
import argparse
import pandas as pd
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

sys.path.append('.')

from app.db.database import SessionLocal, init_db
from app.models import Node, PriceRecord


def import_nodes(file_path: str, db: Session):
    """Importar nodos desde CSV o Excel."""
    print(f"\n📍 Importando nodos desde {file_path}...")
    
    # Detectar formato
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path)
    
    # Validar columnas requeridas
    required = ['code', 'name', 'latitude', 'longitude', 'market']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Columnas faltantes: {missing}")
    
    # Importar
    imported = 0
    skipped = 0
    
    for idx, row in df.iterrows():
        try:
            # Verificar si ya existe
            existing = db.query(Node).filter(Node.code == row['code']).first()
            if existing:
                print(f"⚠️  Nodo {row['code']} ya existe, saltando...")
                skipped += 1
                continue
            
            node = Node(
                code=str(row['code']).strip(),
                name=str(row['name']).strip(),
                latitude=float(row['latitude']),
                longitude=float(row['longitude']),
                market=str(row['market']).strip(),
                zone=str(row['zone']).strip() if 'zone' in row and pd.notna(row['zone']) else None
            )
            
            db.add(node)
            imported += 1
            
            # Commit cada 100 registros
            if imported % 100 == 0:
                db.commit()
                print(f"   Importados {imported} nodos...")
        
        except Exception as e:
            print(f"❌ Error en fila {idx}: {e}")
            continue
    
    db.commit()
    print(f"✅ Importación completada: {imported} nodos importados, {skipped} saltados")
    return imported


def import_prices(file_path: str, db: Session, batch_size: int = 5000):
    """Importar registros de precios desde CSV o Excel."""
    print(f"\n💰 Importando precios desde {file_path}...")
    
    # Detectar formato
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path)
    
    print(f"   Total de registros: {len(df):,}")
    
    # Validar columnas
    required = ['node_code', 'timestamp', 'price', 'market']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Columnas faltantes: {missing}")
    
    # Obtener mapeo de códigos de nodo a IDs
    nodes = {n.code: n.id for n in db.query(Node).all()}
    print(f"   Nodos encontrados en BD: {len(nodes)}")
    
    if not nodes:
        raise ValueError("❌ No hay nodos en la base de datos. Importa nodos primero.")
    
    # Procesar en batches
    imported = 0
    skipped = 0
    errors = 0
    
    for batch_start in range(0, len(df), batch_size):
        batch_end = min(batch_start + batch_size, len(df))
        batch = df.iloc[batch_start:batch_end]
        records = []
        
        for idx, row in batch.iterrows():
            try:
                node_code = str(row['node_code']).strip()
                node_id = nodes.get(node_code)
                
                if not node_id:
                    if skipped < 10:  # Solo mostrar primeros 10
                        print(f"⚠️  Nodo {node_code} no encontrado en BD")
                    skipped += 1
                    continue
                
                # Parsear timestamp
                try:
                    timestamp = pd.to_datetime(row['timestamp'])
                except:
                    print(f"❌ Timestamp inválido en fila {idx}: {row['timestamp']}")
                    errors += 1
                    continue
                
                # Crear registro
                record = PriceRecord(
                    node_id=node_id,
                    timestamp=timestamp,
                    price=float(row['price']) if pd.notna(row['price']) else None,
                    solar_capture=float(row['solar_capture']) if 'solar_capture' in row and pd.notna(row['solar_capture']) else None,
                    wind_capture=float(row['wind_capture']) if 'wind_capture' in row and pd.notna(row['wind_capture']) else None,
                    market=str(row['market']).strip()
                )
                records.append(record)
                
            except Exception as e:
                if errors < 10:  # Solo mostrar primeros 10
                    print(f"❌ Error en fila {idx}: {e}")
                errors += 1
                continue
        
        # Guardar batch
        if records:
            db.bulk_save_objects(records)
            db.commit()
            imported += len(records)
            print(f"   ✅ Batch {batch_start//batch_size + 1}: {len(records):,} registros guardados (Total: {imported:,})")
    
    print(f"\n✅ Importación completada:")
    print(f"   - Importados: {imported:,}")
    print(f"   - Saltados: {skipped:,}")
    print(f"   - Errores: {errors:,}")
    
    return imported


def show_statistics(db: Session):
    """Mostrar estadísticas de la base de datos."""
    print("\n📊 Estadísticas de la Base de Datos:")
    print("=" * 60)
    
    # Nodos
    node_count = db.query(func.count(Node.id)).scalar()
    print(f"Nodos: {node_count}")
    
    # Registros de precios
    price_count = db.query(func.count(PriceRecord.id)).scalar()
    print(f"Registros de precios: {price_count:,}")
    
    # Rango de fechas
    if price_count > 0:
        min_date = db.query(func.min(PriceRecord.timestamp)).scalar()
        max_date = db.query(func.max(PriceRecord.timestamp)).scalar()
        print(f"Rango de fechas: {min_date} a {max_date}")
    
    # Mercados
    markets = db.query(Node.market).distinct().all()
    print(f"Mercados: {[m[0] for m in markets]}")
    
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Importar datos reales de ERCOT')
    parser.add_argument('--nodes', help='Archivo CSV/Excel con nodos', required=False)
    parser.add_argument('--prices', help='Archivo CSV/Excel con precios', required=False)
    parser.add_argument('--batch-size', type=int, default=5000, help='Tamaño de batch para precios')
    parser.add_argument('--stats', action='store_true', help='Mostrar estadísticas')
    
    args = parser.parse_args()
    
    # Inicializar base de datos
    print("🔧 Inicializando base de datos...")
    init_db()
    print("✅ Base de datos lista")
    
    db = SessionLocal()
    try:
        # Importar nodos
        if args.nodes:
            import_nodes(args.nodes, db)
        
        # Importar precios
        if args.prices:
            import_prices(args.prices, db, args.batch_size)
        
        # Mostrar estadísticas
        if args.stats or args.nodes or args.prices:
            show_statistics(db)
        
        if not args.nodes and not args.prices and not args.stats:
            parser.print_help()
    
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
