"""
Migración: Agregar columna negative_hours a price_records
Fecha: 2026-01-20
"""
import pyodbc
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def run_migration():
    """Ejecuta la migración para agregar la columna negative_hours."""
    
    # Leer configuración desde variables de entorno
    db_server = os.getenv("DB_SERVER", "localhost\\SQLEXPRESS")
    db_name = os.getenv("DB_NAME", "ERCOTPricing")
    db_user = os.getenv("DB_USER", "sa")
    db_password = os.getenv("DB_PASSWORD", "")
    
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={db_server};"
        f"DATABASE={db_name};"
        f"UID={db_user};"
        f"PWD={db_password}"
    )
    
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("Verificando si la columna ya existe...")
        
        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'price_records' 
            AND COLUMN_NAME = 'negative_hours'
        """)
        
        exists = cursor.fetchone()[0]
        
        if exists > 0:
            print("La columna 'negative_hours' ya existe. No se requiere migración.")
            cursor.close()
            conn.close()
            return
        
        print("Agregando columna 'negative_hours'...")
        
        # Agregar la columna
        cursor.execute("""
            ALTER TABLE price_records
            ADD negative_hours FLOAT NULL
        """)
        
        conn.commit()
        print("✓ Columna 'negative_hours' agregada exitosamente.")
        print("✓ Migración completada exitosamente.")
        
    except pyodbc.Error as e:
        print(f"✗ Error durante la migración: {e}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_migration()