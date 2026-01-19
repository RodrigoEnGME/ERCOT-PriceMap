from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models import PriceRecord, Node, User
from app.schemas import (
    PriceRecordResponse, PriceRecordWithNode,
    NodePriceEvolution, TimeSeriesData, NodeYearlyComparison, YearlyComparison,
    NodeMonthlyComparison, MonthlyComparison,
    PriceDistribution, NodePricePoint, AllNodesPriceDistribution,
    CongestionData, AggregatedStats, AvailableYears,
    DataType, AggregationType
)
from app.api.dependencies import get_current_active_user
from app.utils.voronoi_generator import generate_voronoi_polygons, create_texas_boundary
import os

router = APIRouter(prefix="/prices", tags=["Prices"])


@router.get("/available-years", response_model=AvailableYears)
def get_available_years(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get available years and markets in the database."""
    years = (
        db.query(extract('year', PriceRecord.timestamp).label('year'))
        .distinct()
        .order_by('year')
        .all()
    )
    
    markets = (
        db.query(PriceRecord.market)
        .distinct()
        .all()
    )
    
    return {
        "years": [int(y[0]) for y in years],
        "markets": [m[0] for m in markets]
    }


@router.get("/evolution/{node_id}", response_model=NodePriceEvolution)
def get_price_evolution(
    node_id: int,
    start_date: datetime,
    end_date: datetime,
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price evolution for a node over time."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Select data field based on type
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    records = (
        db.query(PriceRecord.timestamp, data_field)
        .filter(
            and_(
                PriceRecord.node_id == node_id,
                PriceRecord.timestamp >= start_date,
                PriceRecord.timestamp <= end_date,
                data_field.isnot(None)
            )
        )
        .order_by(PriceRecord.timestamp)
        .all()
    )
    
    time_series = [
        TimeSeriesData(timestamp=r[0], value=r[1])
        for r in records
    ]
    
    return NodePriceEvolution(
        node_id=node.id,
        node_code=node.code,
        node_name=node.name,
        data=time_series
    )


@router.get("/monthly-comparison/{node_id}", response_model=NodeMonthlyComparison)
def get_monthly_comparison(
    node_id: int,
    year: int = Query(..., ge=2020, le=2030, description="Year"),
    day: int = Query(..., ge=1, le=31, description="Day (1-31)"),
    hour: int = Query(..., ge=0, le=23, description="Hour (0-23)"),
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price comparison for the same day/hour across all 12 months of a year."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Select data field based on type
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    monthly_data = []
    # Iterate through all 12 months
    for month in range(1, 13):
        try:
            # Create timestamp for specific year/month/day/hour
            target_datetime = datetime(year, month, day, hour, 0, 0)
            hour_end = target_datetime + timedelta(hours=1)
            
            # Query average price for that specific hour
            avg_value = (
                db.query(func.avg(data_field))
                .filter(
                    and_(
                        PriceRecord.node_id == node_id,
                        PriceRecord.timestamp >= target_datetime,
                        PriceRecord.timestamp < hour_end,
                        data_field.isnot(None)
                    )
                )
                .scalar()
            )
            
            # Add data point (None if no data available)
            monthly_data.append(
                MonthlyComparison(
                    month=month,
                    value=float(avg_value) if avg_value is not None else None
                )
            )
        except ValueError:
            # Invalid date (e.g., February 30), add None
            monthly_data.append(MonthlyComparison(month=month, value=None))
    
    return NodeMonthlyComparison(
        node_id=node.id,
        node_code=node.code,
        node_name=node.name,
        year=year,
        day=day,
        hour=hour,
        data=monthly_data
    )


@router.get("/yearly-comparison/{node_id}", response_model=NodeYearlyComparison)
def get_yearly_comparison(
    node_id: int,
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    day: int = Query(..., ge=1, le=31, description="Day (1-31)"),
    hour: int = Query(..., ge=0, le=23, description="Hour (0-23)"),
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price comparison for the same hour across all available years."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Select data field based on type
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    # Get all available years
    years = (
        db.query(extract('year', PriceRecord.timestamp).label('year'))
        .distinct()
        .order_by('year')
        .all()
    )
    
    yearly_data = []
    for (year,) in years:
        year_int = int(year)
        # Create timestamp for specific year/month/day/hour
        target_datetime = datetime(year_int, month, day, hour, 0, 0)
        hour_end = target_datetime + timedelta(hours=1)
        
        # Query average price for that specific hour
        avg_value = (
            db.query(func.avg(data_field))
            .filter(
                and_(
                    PriceRecord.node_id == node_id,
                    PriceRecord.timestamp >= target_datetime,
                    PriceRecord.timestamp < hour_end,
                    data_field.isnot(None)
                )
            )
            .scalar()
        )
        
        if avg_value is not None:
            yearly_data.append(YearlyComparison(year=year_int, value=float(avg_value)))
    
    return NodeYearlyComparison(
        node_id=node.id,
        node_code=node.code,
        node_name=node.name,
        month=month,
        day=day,
        hour=hour,
        data=yearly_data
    )


@router.get("/all-nodes-distribution", response_model=AllNodesPriceDistribution)
def get_all_nodes_distribution(
    timestamp: datetime,
    market: str = "ERCOT",
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price distribution across all nodes for a specific hour."""
    # Select data field
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    # Calcular rango de hora
    hour_start = timestamp.replace(minute=0, second=0, microsecond=0)
    hour_end = hour_start + timedelta(hours=1)
    
    # Consultar precio promedio por nodo para esa hora
    results = (
        db.query(
            Node.id,
            Node.code,
            Node.name,
            func.avg(data_field).label('avg_price')
        )
        .join(PriceRecord, PriceRecord.node_id == Node.id)
        .filter(
            and_(
                PriceRecord.timestamp >= hour_start,
                PriceRecord.timestamp < hour_end,
                PriceRecord.market == market,
                data_field.isnot(None),
                Node.is_active == True
            )
        )
        .group_by(Node.id, Node.code, Node.name)
        .order_by(func.avg(data_field).desc())
        .all()
    )
    
    node_prices = [
        NodePricePoint(
            node_id=r[0],
            node_code=r[1],
            node_name=r[2],
            price=float(r[3])
        )
        for r in results
    ]
    
    return AllNodesPriceDistribution(
        timestamp=hour_start,
        data=node_prices
    )


@router.get("/distribution/{node_id}", response_model=PriceDistribution)
def get_price_distribution(
    node_id: int,
    start_date: datetime,
    end_date: datetime,
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price distribution (sorted from highest to lowest) for a node."""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Select data field
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    prices = (
        db.query(data_field)
        .filter(
            and_(
                PriceRecord.node_id == node_id,
                PriceRecord.timestamp >= start_date,
                PriceRecord.timestamp <= end_date,
                data_field.isnot(None)
            )
        )
        .order_by(data_field.desc())
        .all()
    )
    
    return PriceDistribution(
        node_id=node.id,
        node_code=node.code,
        prices=[p[0] for p in prices]
    )


@router.get("/congestion", response_model=List[CongestionData])
def get_congestion_pricing(
    node1_id: int,
    node2_id: int,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get congestion pricing between two nodes."""
    # Verify nodes exist
    node1 = db.query(Node).filter(Node.id == node1_id).first()
    node2 = db.query(Node).filter(Node.id == node2_id).first()
    
    if not node1 or not node2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both nodes not found"
        )
    
    # Get price records for both nodes
    records1 = (
        db.query(PriceRecord.timestamp, PriceRecord.price)
        .filter(
            and_(
                PriceRecord.node_id == node1_id,
                PriceRecord.timestamp >= start_date,
                PriceRecord.timestamp <= end_date
            )
        )
        .all()
    )
    
    records2 = (
        db.query(PriceRecord.timestamp, PriceRecord.price)
        .filter(
            and_(
                PriceRecord.node_id == node2_id,
                PriceRecord.timestamp >= start_date,
                PriceRecord.timestamp <= end_date
            )
        )
        .all()
    )
    
    # Create dictionaries for easy lookup
    prices1 = {r[0]: r[1] for r in records1}
    prices2 = {r[0]: r[1] for r in records2}
    
    # Calculate congestion for matching timestamps
    result = []
    for timestamp in prices1.keys():
        if timestamp in prices2:
            price1 = prices1[timestamp]
            price2 = prices2[timestamp]
            congestion = abs(price1 - price2) if price1 and price2 else None
            
            result.append(CongestionData(
                node1_id=node1_id,
                node2_id=node2_id,
                node1_code=node1.code,
                node2_code=node2.code,
                timestamp=timestamp,
                node1_price=price1,
                node2_price=price2,
                congestion_price=congestion
            ))
    
    return sorted(result, key=lambda x: x.timestamp)


@router.get("/stats/{node_id}", response_model=AggregatedStats)
def get_aggregated_stats(
    node_id: int,
    start_date: datetime,
    end_date: datetime,
    data_type: DataType = DataType.PRICE,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get aggregated statistics for a node."""
    # Select data field
    field_map = {
        DataType.PRICE: PriceRecord.price,
        DataType.SOLAR_CAPTURE: PriceRecord.solar_capture,
        DataType.WIND_CAPTURE: PriceRecord.wind_capture
    }
    data_field = field_map[data_type]
    
    stats = (
        db.query(
            func.avg(data_field).label('avg'),
            func.max(data_field).label('max'),
            func.min(data_field).label('min'),
            func.count(data_field).label('count')
        )
        .filter(
            and_(
                PriceRecord.node_id == node_id,
                PriceRecord.timestamp >= start_date,
                PriceRecord.timestamp <= end_date,
                data_field.isnot(None)
            )
        )
        .first()
    )
    
    return AggregatedStats(
        avg=float(stats[0]) if stats[0] else None,
        max=float(stats[1]) if stats[1] else None,
        min=float(stats[2]) if stats[2] else None,
        count=stats[3]
    )


@router.get("/hourly-snapshot", response_model=List[dict])
def get_hourly_snapshot(
    timestamp: datetime,
    market: str = "ERCOT",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get price snapshot for all nodes at a specific hour (for heatmap)."""
    # Truncar timestamp a hora completa (eliminar minutos, segundos, microsegundos)
    hour_start = timestamp.replace(minute=0, second=0, microsecond=0)
    hour_end = hour_start + timedelta(hours=1)
    
    # Buscar registros dentro de esa hora (entre hour_start y hour_end)
    # Agrupar por nodo y tomar el promedio si hay múltiples registros
    records = (
        db.query(
            Node.id,
            Node.code,
            Node.name,
            Node.latitude,
            Node.longitude,
            func.avg(PriceRecord.price).label('avg_price'),
            func.max(PriceRecord.timestamp).label('latest_timestamp')
        )
        .join(PriceRecord, PriceRecord.node_id == Node.id)
        .filter(
            and_(
                PriceRecord.timestamp >= hour_start,
                PriceRecord.timestamp < hour_end,
                PriceRecord.market == market
            )
        )
        .group_by(Node.id, Node.code, Node.name, Node.latitude, Node.longitude)
        .all()
    )
    
    return [
        {
            "node_id": r[0],
            "code": r[1],
            "name": r[2],
            "latitude": r[3],
            "longitude": r[4],
            "price": r[5],
            "timestamp": r[6]
        }
        for r in records
    ]


@router.get("/voronoi-map", response_model=Dict[str, Any])
def get_voronoi_map(
    timestamp: datetime,
    market: str = "ERCOT",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get Voronoi polygons for all nodes with their prices at a specific hour.
    Returns GeoJSON FeatureCollection with polygon geometries.
    """
    try:
        # Obtener todos los nodos activos de la base de datos
        nodes = db.query(Node).filter(Node.is_active == True).all()
        
        if not nodes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active nodes found in database"
            )
        
        print(f"DEBUG: Found {len(nodes)} active nodes in database")
        
        # Convertir nodos a formato diccionario
        nodes_dict = [
            {
                'code': node.code,
                'name': node.name,
                'latitude': float(node.latitude),
                'longitude': float(node.longitude),
                'market': node.market,
                'zone': node.zone
            }
            for node in nodes
        ]
        
        # Generar polígonos de Voronoi
        print("DEBUG: Generating Voronoi polygons...")
        texas_boundary = create_texas_boundary()
        geojson = generate_voronoi_polygons(nodes_dict, texas_boundary)
        print(f"DEBUG: Generated {len(geojson.get('features', []))} polygons")
        
        # Obtener precios para la hora especificada
        hour_start = timestamp.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        
        print(f"DEBUG: Querying prices from {hour_start} to {hour_end}")
        
        # Consultar precios promedio por nodo
        price_records = (
            db.query(
                Node.code,
                func.avg(PriceRecord.price).label('avg_price')
            )
            .join(PriceRecord, PriceRecord.node_id == Node.id)
            .filter(
                and_(
                    PriceRecord.timestamp >= hour_start,
                    PriceRecord.timestamp < hour_end,
                    PriceRecord.market == market
                )
            )
            .group_by(Node.code)
            .all()
        )
        
        print(f"DEBUG: Found prices for {len(price_records)} nodes")
        
        # Crear diccionario de precios por código de nodo
        prices_by_code = {code: float(price) for code, price in price_records}
        
        # Agregar precios a las propiedades de cada feature
        for feature in geojson['features']:
            node_code = feature['properties']['code']
            feature['properties']['price'] = prices_by_code.get(node_code, None)
        
        return geojson
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in voronoi-map endpoint: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating Voronoi map: {str(e)}"
        )
