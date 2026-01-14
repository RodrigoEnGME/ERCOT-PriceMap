# 🚀 Quick Start Guide - ERCOT Pricing Dashboard

## Paso 1: Configurar Backend

```powershell
# 1. Navegar a backend
cd c:\Desarrollo\EMI\ERCOT_Priceing_Dashboard\backend

# 2. Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\Activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Copiar y configurar .env
copy .env.example .env
# Editar .env con tu configuración de SQL Server
```

## Paso 2: Configurar Base de Datos

Edita `backend\.env`:

```env
DATABASE_URL=mssql+pyodbc://localhost/ERCOTPricing?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
SECRET_KEY=cambiar-esta-clave-secreta-minimo-32-caracteres-aleatorios
```

## Paso 3: Poblar Base de Datos con Datos de Ejemplo

```powershell
# Desde backend/ con venv activado
python populate_db.py
```

Este script creará:
- ✅ 3 usuarios de prueba (admin, premium, basic)
- ✅ 10 nodos en Texas
- ✅ ~7,200 registros de precios (30 días × 24 horas × 10 nodos)

**Credenciales de prueba:**
- Admin: `admin` / `admin123`
- Premium: `premium` / `premium123`
- Basic: `basic` / `basic123`

## Paso 4: Iniciar Backend

```powershell
# Desde backend/
python -m uvicorn app.main:app --reload
```

✅ Backend corriendo en: http://localhost:8000
✅ Docs: http://localhost:8000/docs

## Paso 5: Iniciar Frontend

```powershell
# Nueva terminal
cd c:\Desarrollo\EMI\ERCOT_Priceing_Dashboard\frontend

# Instalar dependencias (primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

✅ Frontend corriendo en: http://localhost:5173

## Paso 6: Acceder al Dashboard

1. Abre http://localhost:5173 en tu navegador
2. Login con: `admin` / `admin123`
3. ¡Explora el dashboard!

## 📊 Funcionalidades Principales

### En el Dashboard verás:

1. **Mapa de Calor**
   - Visualiza todos los nodos
   - Colores según precio (verde=bajo, rojo=alto)

2. **Panel de Filtros** (izquierda)
   - Selecciona fecha y hora
   - Elige uno o dos nodos
   - Cambia tipo de datos (Precio, Solar, Eólica)
   - Exporta a Excel (Premium/Admin)

3. **Gráficas**
   - Evolución temporal del precio
   - Distribución de precios
   - Comparación de congestión (2 nodos)

4. **Estadísticas**
   - Average, Max, Min por nodo seleccionado

## 🔧 Troubleshooting Rápido

### Error: "ODBC Driver not found"
```powershell
# Descargar e instalar desde:
# https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
```

### Error: "Cannot connect to database"
Verifica en SQL Server Management Studio (SSMS):
- SQL Server Express está corriendo
- Base de datos "ERCOTPricing" existe o puede ser creada
- Windows Authentication está habilitada

### Error: "CORS"
Verifica que el backend esté corriendo en puerto 8000

### Frontend no carga
```powershell
# Limpiar cache y reinstalar
cd frontend
rm -r node_modules
rm package-lock.json
npm install
npm run dev
```

## 📝 Próximos Pasos

### Para Desarrollo:

1. **Agregar más nodos:**
   ```python
   # En populate_db.py, añade más nodos al array texas_nodes
   ```

2. **Importar datos reales:**
   - Crea un script similar a populate_db.py
   - Lee datos desde CSV/Excel
   - Inserta usando bulk_save_objects

3. **Customizar gráficas:**
   - Edita archivos en `frontend/src/components/`
   - Recharts documentación: https://recharts.org

4. **Añadir más endpoints:**
   - Crea nuevo archivo en `backend/app/api/v1/endpoints/`
   - Agrégalo a `backend/app/api/v1/api.py`

### Para Producción:

1. **Backend:**
   ```powershell
   pip install gunicorn
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. **Frontend:**
   ```powershell
   npm run build
   # Servir carpeta dist/ con nginx o IIS
   ```

3. **Seguridad:**
   - Cambiar SECRET_KEY en .env
   - Usar HTTPS en producción
   - Configurar CORS apropiadamente

## 📚 Documentación Completa

Ver [README.md](README.md) para documentación detallada.

## 🆘 Soporte

Para problemas o preguntas, revisar:
1. Logs del backend (terminal donde corre uvicorn)
2. Console del navegador (F12)
3. Swagger docs: http://localhost:8000/docs

---

**¡Listo para desarrollar! 🎉**
