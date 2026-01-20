"""
Migración: Agregar columna negative_hours a price_records
Fecha: 2026-01-20
"""
import pyodbc
from app.core.config import settings

def run_migration():
    """Ejecuta la migración para agregar la columna negative_hours."""
    
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD}"
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
            return
        
        print("Agregando columna 'negative_hours'...")
        
        # Agregar la columna
        cursor.execute("""
            ALTER TABLE price_records
            ADD negative_hours FLOAT NULL
        """)
        
        conn.commit()
        print("✓ Columna 'negative_hours' agregada exitosamente.")
        
        # Opcional: Actualizar valores existentes
        print("Actualizando valores existentes (estableciendo en NULL)...")
        # Si quieres inicializar con algún valor por defecto:
        # cursor.execute("UPDATE price_records SET negative_hours = 0 WHERE negative_hours IS NULL")
        # conn.commit()
        
        print("✓ Migración completada exitosamente.")
        
    except pyodbc.Error as e:
        print(f"✗ Error durante la migración: {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    run_migration()