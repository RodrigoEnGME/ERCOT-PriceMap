# 📥 Guía de Importación de Datos Reales

## 🎯 Objetivo
Importar datos reales de ERCOT a tu base de datos SQL Server.

---

## 📋 Pasos Previos

### 1. Asegúrate de tener la base de datos lista

```powershell
# Opción A: Dejar que FastAPI la cree automáticamente
cd backend
.\venv\Scripts\Activate
python -m uvicorn app.main:app --reload
# Presiona Ctrl+C después de ver "Application startup complete"

# Opción B: Crear manualmente en SQL Server
# Abrir SQL Server Management Studio (SSMS)
# Ejecutar: CREATE DATABASE ERCOTPricing;
```

### 2. Verifica que tienes pandas instalado

```powershell
cd backend
.\venv\Scripts\Activate
pip install pandas openpyxl  # Si no está en requirements.txt
```

---

## 📊 Preparar tus Datos

### Opción 1: Descargar de ERCOT

**Sitio oficial:** http://www.ercot.com/mp/data-products

1. Navega a "Data Product Details"
2. Busca: **"Settlement Point Prices at Resource Nodes, Hubs and Load Zones"**
3. Descarga archivos CSV históricos

### Opción 2: Usar Datos de Ejemplo (Para pruebas)

Ya tienes `populate_db.py` que genera datos sintéticos.

---

## 🗂️ Formato de Archivos

### `nodes.csv` (Requerido primero)

```csv
code,name,latitude,longitude,market,zone
HB_HOUSTON,Houston Hub,29.7604,-95.3698,ERCOT,Coast
HB_NORTH,North Hub,32.7767,-96.7970,ERCOT,North
HB_SOUTH,South Hub,29.4241,-98.4936,ERCOT,South
HB_WEST,West Hub,31.7619,-106.4850,ERCOT,West
LZ_HOUSTON,Houston Load Zone,29.7604,-95.3698,ERCOT,Coast
```

**Columnas requeridas:**
- `code`: Código único del nodo (ej: HB_HOUSTON)
- `name`: Nombre descriptivo
- `latitude`: Latitud decimal
- `longitude`: Longitud decimal
- `market`: Mercado (ej: ERCOT)
- `zone`: Zona (opcional)

### `prices.csv` (Después de importar nodos)

```csv
node_code,timestamp,price,solar_capture,wind_capture,market
HB_HOUSTON,2023-01-01 00:00:00,25.50,0,150.5,ERCOT
HB_HOUSTON,2023-01-01 01:00:00,23.20,0,145.2,ERCOT
HB_NORTH,2023-01-01 00:00:00,26.30,0,200.1,ERCOT
HB_NORTH,2023-01-01 01:00:00,24.80,0,195.3,ERCOT
```

**Columnas requeridas:**
- `node_code`: Debe coincidir con `code` en nodes.csv
- `timestamp`: Formato ISO (YYYY-MM-DD HH:MM:SS)
- `price`: Precio en $/MWh
- `market`: Mercado (ej: ERCOT)

**Columnas opcionales:**
- `solar_capture`: Generación solar en MW
- `wind_capture`: Generación eólica en MW

---

## 🚀 Uso del Script

### 1️⃣ Importar solo nodos

```powershell
cd backend
.\venv\Scripts\Activate
python import_real_data.py --nodes "C:\ruta\a\nodes.csv"
```

**Salida esperada:**
```
🔧 Inicializando base de datos...
✅ Base de datos lista

📍 Importando nodos desde C:\ruta\a\nodes.csv...
✅ Importación completada: 150 nodos importados, 0 saltados

📊 Estadísticas de la Base de Datos:
============================================================
Nodos: 150
Registros de precios: 0
Mercados: ['ERCOT']
============================================================
```

### 2️⃣ Importar solo precios (después de nodos)

```powershell
python import_real_data.py --prices "C:\ruta\a\prices_2023.csv"
```

**Salida esperada:**
```
💰 Importando precios desde C:\ruta\a\prices_2023.csv...
   Total de registros: 1,314,000
   Nodos encontrados en BD: 150
   ✅ Batch 1: 5,000 registros guardados (Total: 5,000)
   ✅ Batch 2: 5,000 registros guardados (Total: 10,000)
   ...
✅ Importación completada:
   - Importados: 1,314,000
   - Saltados: 0
   - Errores: 0
```

### 3️⃣ Importar nodos Y precios en una sola ejecución

```powershell
python import_real_data.py --nodes nodes.csv --prices prices_2023.csv
```

### 4️⃣ Importar múltiples archivos de precios

```powershell
# Año 2023
python import_real_data.py --prices prices_2023.csv

# Año 2024
python import_real_data.py --prices prices_2024.csv

# Año 2025
python import_real_data.py --prices prices_2025.csv
```

### 5️⃣ Ver solo estadísticas

```powershell
python import_real_data.py --stats
```

### 6️⃣ Ajustar tamaño de batch (si tienes poca RAM)

```powershell
python import_real_data.py --prices prices.csv --batch-size 1000
```

---

## 📏 Volúmenes de Datos Esperados

### Para Demo (Etapa 1)
- **Nodos:** 10-50 nodos principales
- **Histórico:** 1 año (2025)
- **Registros:** ~438,000 (50 nodos × 365 días × 24 horas)
- **Tamaño DB:** ~50 MB
- **Tiempo de importación:** 5-10 minutos

### Para Producción (Etapa 2)
- **Nodos:** 150 nodos
- **Histórico:** 3 años (2023-2025)
- **Registros:** ~3.9M (150 × 3 años × 365 × 24)
- **Tamaño DB:** ~500 MB
- **Tiempo de importación:** 30-60 minutos

---

## 🔍 Validación Post-Importación

### Verificar datos en SQL Server

```sql
-- Contar nodos
SELECT COUNT(*) as total_nodos FROM nodes;

-- Contar registros de precios
SELECT COUNT(*) as total_registros FROM price_records;

-- Ver rango de fechas
SELECT 
    MIN(timestamp) as fecha_inicio,
    MAX(timestamp) as fecha_final
FROM price_records;

-- Top 10 nodos con más datos
SELECT 
    n.code,
    n.name,
    COUNT(pr.id) as num_registros
FROM nodes n
LEFT JOIN price_records pr ON n.id = pr.node_id
GROUP BY n.code, n.name
ORDER BY num_registros DESC
LIMIT 10;

-- Verificar datos por año
SELECT 
    YEAR(timestamp) as año,
    COUNT(*) as registros
FROM price_records
GROUP BY YEAR(timestamp)
ORDER BY año;
```

### Verificar en el Dashboard

```powershell
# Iniciar backend
cd backend
python -m uvicorn app.main:app --reload

# Iniciar frontend
cd ..\frontend
npm run dev

# Abrir http://localhost:5173
# Login: admin / admin123
# Verificar que el mapa y gráficas muestran datos reales
```

---

## ⚠️ Solución de Problemas

### Error: "No module named 'pandas'"

```powershell
cd backend
.\venv\Scripts\Activate
pip install pandas openpyxl
```

### Error: "Nodo X no encontrado en BD"

**Causa:** El `node_code` en prices.csv no existe en la tabla nodes

**Solución:**
1. Verificar que importaste nodes primero
2. Revisar que los códigos coincidan exactamente
3. Los códigos son case-sensitive

### Error: "Timestamp inválido"

**Causa:** Formato de fecha incorrecto

**Formatos válidos:**
- `2023-01-01 00:00:00`
- `2023-01-01T00:00:00`
- `01/01/2023 00:00`

**Solución en Excel:**
```
=TEXT(A2,"YYYY-MM-DD HH:MM:SS")
```

### Importación muy lenta

**Opciones:**
1. Aumentar batch_size: `--batch-size 10000`
2. Dividir archivo grande en archivos más pequeños
3. Desactivar índices temporalmente (avanzado)

---

## 📊 Conversión desde Archivos ERCOT

### Si descargas archivos .ZIP de ERCOT

```python
# Script: backend/convert_ercot_zip.py

import zipfile
import pandas as pd
from pathlib import Path

def convert_ercot_zip_to_csv(zip_path, output_folder):
    """Convertir ZIP de ERCOT a formato importable."""
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Extraer
        zip_ref.extractall(output_folder)
        
        # Buscar CSVs
        csv_files = list(Path(output_folder).glob('*.csv'))
        
        all_data = []
        for csv_file in csv_files:
            df = pd.read_csv(csv_file)
            
            # Mapear columnas de ERCOT a nuestro formato
            # (Ajustar según formato real de ERCOT)
            df_converted = pd.DataFrame({
                'node_code': df['Settlement Point Name'],
                'timestamp': pd.to_datetime(df['Delivery Date'] + ' ' + df['Delivery Hour']),
                'price': df['Settlement Point Price'],
                'market': 'ERCOT'
            })
            
            all_data.append(df_converted)
        
        # Combinar y guardar
        result = pd.concat(all_data, ignore_index=True)
        result.to_csv(f'{output_folder}/prices_converted.csv', index=False)
        print(f"✅ Convertidos {len(result):,} registros")

# Uso
convert_ercot_zip_to_csv('ercot_data_2023.zip', 'data/converted')
```

---

## 🎯 Checklist de Importación

### Antes de Empezar
- [ ] Base de datos SQL Server corriendo
- [ ] Backend instalado con dependencias
- [ ] Archivos CSV preparados
- [ ] Backup de BD existente (si aplica)

### Importación
- [ ] Importar nodes.csv primero
- [ ] Verificar que se importaron correctamente
- [ ] Importar prices.csv (año por año)
- [ ] Ejecutar `--stats` para validar

### Post-Importación
- [ ] Verificar en SQL Server
- [ ] Probar dashboard frontend
- [ ] Verificar que todas las gráficas funcionan
- [ ] Exportar una muestra a Excel

---

## 💡 Tips Pro

### 1. Importación incremental

```powershell
# Importar datos nuevos sin duplicar
# El script automáticamente salta registros existentes
python import_real_data.py --prices prices_new.csv
```

### 2. Importar desde Excel

```powershell
# El script detecta automáticamente el formato
python import_real_data.py --nodes nodes.xlsx --prices prices.xlsx
```

### 3. Logging detallado

```powershell
# Guardar output en archivo
python import_real_data.py --prices prices.csv > import_log.txt 2>&1
```

### 4. Validar antes de importar masivo

```powershell
# Crear subset de prueba
head -n 1000 prices_2023.csv > prices_test.csv
python import_real_data.py --prices prices_test.csv
```

---

## 📞 ¿Necesitas Ayuda?

### Recursos
- 📄 [README.md](README.md) - Documentación completa
- 🚀 [QUICKSTART.md](QUICKSTART.md) - Guía rápida
- 📊 [PLAN_DESARROLLO_EJECUTIVO.md](PLAN_DESARROLLO_EJECUTIVO.md) - Plan de desarrollo

### Contacto
- Revisar logs en consola
- Verificar archivos .env
- Comprobar conectividad a SQL Server

---

**¡Listo para importar tus datos reales! 🎉**
