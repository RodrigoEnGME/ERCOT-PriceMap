"""Script para probar diferentes cadenas de conexión a SQL Server"""
import pyodbc

# Lista de opciones para probar
connection_strings = [
    # Opción 1: localhost\SQLEXPRESS
    r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost\SQLEXPRESS;UID=sa;PWD=P@ssw0rd;",
    
    # Opción 2: (local)\SQLEXPRESS
    r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=(local)\SQLEXPRESS;UID=sa;PWD=P@ssw0rd;",
    
    # Opción 3: .\SQLEXPRESS
    r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=.\SQLEXPRESS;UID=sa;PWD=P@ssw0rd;",
    
    # Opción 4: ME-NTB-59\SQLEXPRESS
    r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=ME-NTB-59\SQLEXPRESS;UID=sa;PWD=P@ssw0rd;",
    
    # Opción 5: localhost,1433 (puerto estático)
    r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost,1433;UID=sa;PWD=P@ssw0rd;",
]

print("Probando conexiones a SQL Server...\n")

for i, conn_str in enumerate(connection_strings, 1):
    try:
        print(f"Opción {i}: {conn_str[:60]}...")
        conn = pyodbc.connect(conn_str, timeout=5)
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"✅ ÉXITO - Conexión establecida!")
        print(f"   Versión: {version[:80]}...\n")
        conn.close()
        print(f"👉 USA ESTA CADENA DE CONEXIÓN EN TU .env")
        break
    except pyodbc.Error as e:
        print(f"❌ FALLO - {str(e)[:100]}\n")
        continue
else:
    print("\n⚠️ Ninguna conexión funcionó. Verifica:")
    print("1. SQL Server está corriendo: Get-Service MSSQL$SQLEXPRESS")
    print("2. Usuario 'sa' habilitado con contraseña 'P@ssw0rd'")
    print("3. SQL Server configurado para autenticación mixta")
    print("4. Firewall permite conexiones locales")
