from fastapi import APIRouter
from app.api.v1.endpoints import auth, nodes, prices, export

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(nodes.router)
api_router.include_router(prices.router)
api_router.include_router(export.router)
