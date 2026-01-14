# ERCOT Pricing Dashboard

Dashboard web para visualización y análisis de precios nodales de ERCOT con mapas de calor, gráficas de evolución temporal, distribución de precios y análisis de congestión.

## 🏗️ Arquitectura

- **Backend:** FastAPI con SQL Server Express
- **Frontend:** React + TypeScript + Material-UI
- **Mapas:** Leaflet
- **Gráficas:** Recharts
- **Autenticación:** JWT

## 📋 Requisitos Previos

### Backend
- Python 3.8+
- SQL Server Express
- ODBC Driver 17+ para SQL Server

### Frontend
- Node.js 21.x (actual) o 20.19+/22.12+
- npm 10+

## 🚀 Instalación

### 1. Backend (FastAPI)

```powershell
# Navegar a backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tu configuración de base de datos
```

### 2. Configurar Base de Datos

Edita `backend\.env`:

```env
DATABASE_URL=mssql+pyodbc://localhost/ERCOTPricing?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
SECRET_KEY=tu-clave-secreta-cambiar-en-produccion-minimo-32-caracteres
```

### 3. Iniciar Backend

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en:
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Frontend (React)

```powershell
# Navegar a frontend
cd frontend

# Instalar dependencias (si aún no lo has hecho)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 📊 Estructura del Proyecto

```
ERCOT_Pricing_Dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py      # Autenticación
│   │   │   │   │   ├── nodes.py     # Endpoints de nodos
│   │   │   │   │   ├── prices.py    # Endpoints de precios
│   │   │   │   │   └── export.py    # Exportación Excel
│   │   │   │   └── api.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py            # Configuración
│   │   │   └── security.py          # JWT y hashing
│   │   ├── db/
│   │   │   └── database.py          # Conexión DB
│   │   ├── models/
│   │   │   └── models.py            # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── schemas.py           # Schemas Pydantic
│   │   └── main.py                  # Aplicación principal
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceHeatmap/        # Mapa de calor
│   │   │   ├── PriceEvolutionChart/ # Evolución temporal
│   │   │   ├── PriceDistributionChart/ # Distribución
│   │   │   ├── CongestionChart/     # Congestión
│   │   │   └── FilterPanel/         # Panel de filtros
│   │   ├── pages/
│   │   │   ├── Login/               # Login
│   │   │   └── Dashboard/           # Dashboard principal
│   │   ├── services/                # API services
│   │   ├── store/                   # Zustand store
│   │   ├── types/                   # TypeScript types
│   │   ├── theme/                   # MUI theme
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
└── README.md
```

## 🔐 Autenticación

### Crear Usuario (mediante API)

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "securepassword123",
    "full_name": "Administrator"
  }'
```

### Login

Usa las credenciales en la interfaz web o mediante API:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=securepassword123"
```

## 📈 Funcionalidades

### Backend APIs

#### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/token` - Login con JSON

#### Nodos
- `GET /api/v1/nodes` - Listar nodos
- `GET /api/v1/nodes/with-prices` - Nodos con últimos precios
- `GET /api/v1/nodes/{id}` - Obtener nodo específico
- `POST /api/v1/nodes` - Crear nodo (Admin)
- `PUT /api/v1/nodes/{id}` - Actualizar nodo (Admin)
- `DELETE /api/v1/nodes/{id}` - Eliminar nodo (Admin)

#### Precios
- `GET /api/v1/prices/available-years` - Años disponibles
- `GET /api/v1/prices/evolution/{node_id}` - Evolución de precios
- `GET /api/v1/prices/distribution/{node_id}` - Distribución de precios
- `GET /api/v1/prices/congestion` - Precio de congestión
- `GET /api/v1/prices/stats/{node_id}` - Estadísticas agregadas
- `GET /api/v1/prices/hourly-snapshot` - Snapshot por hora

#### Exportación
- `POST /api/v1/export/excel` - Exportar a Excel (Premium/Admin)

### Frontend

1. **Mapa de Calor (Heatmap)**
   - Visualiza todos los nodos con colores según precio
   - Interactivo con tooltips

2. **Gráfica de Evolución**
   - Muestra evolución temporal del nodo seleccionado
   - Filtra por año, mes, día

3. **Gráfica de Distribución**
   - Precios ordenados de mayor a menor
   - Visualiza la distribución completa

4. **Gráfica de Congestión**
   - Compara precios entre dos nodos
   - Calcula precio de congestión

5. **Panel de Filtros**
   - Selector de fecha/hora
   - Selector de nodos
   - Tipo de datos (Precio, Solar, Eólica)
   - Agregación (AVG, MAX, MIN, SUM)
   - Exportación a Excel

## 🔧 Gestión de Usuarios

### Roles de Usuario

- **BASIC:** Acceso solo a visualización
- **PREMIUM:** Visualización + Exportación
- **ADMIN:** Acceso completo + gestión de nodos y usuarios

### Cambiar rol de usuario (SQL)

```sql
UPDATE users 
SET role = 'premium' 
WHERE username = 'usuario';
```

## 📦 Producción

### Backend

```powershell
# Instalar gunicorn (si no está)
pip install gunicorn

# Ejecutar con gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```powershell
cd frontend

# Build
npm run build

# Los archivos estáticos estarán en frontend/dist
# Servir con nginx, Apache, o cualquier servidor web
```

## 🐛 Troubleshooting

### Error: "ODBC Driver not found"
Instala ODBC Driver 17+ para SQL Server:
https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### Error: "Node.js version mismatch"
El proyecto usa Vite 4.x compatible con Node 21.x. Si tienes problemas, considera usar nvm-windows para gestionar versiones.

### Error: "CORS"
Verifica que `BACKEND_CORS_ORIGINS` en `.env` del backend incluya la URL del frontend.

## 📝 Notas de Desarrollo

- La base de datos se crea automáticamente al iniciar el backend
- Los índices están optimizados para consultas frecuentes
- Las fechas se manejan en UTC
- La paginación por defecto es de 100 items

## 🤝 Contribuciones

Para añadir nuevas funcionalidades:

1. Backend: Añade endpoints en `backend/app/api/v1/endpoints/`
2. Frontend: Crea componentes en `frontend/src/components/`
3. Actualiza tipos TypeScript en `frontend/src/types/`

## 📄 Licencia

Proyecto propietario - EMI

---

**Desarrollado con FastAPI, React, TypeScript y Material-UI**
