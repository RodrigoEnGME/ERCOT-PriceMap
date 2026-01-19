"""
Generador de polígonos de Voronoi para los nodos de Texas.
Recorta los polígonos con los límites geográficos de Texas.
"""
import json
from typing import List, Dict, Tuple
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, Point, MultiPolygon, box
from shapely.ops import unary_union
import openpyxl


# Límites aproximados de Texas (bounding box)
TEXAS_BOUNDS = {
    'min_lat': 25.8,
    'max_lat': 36.5,
    'min_lng': -106.65,
    'max_lng': -93.5
}


def load_nodes_from_excel(excel_path: str) -> List[Dict]:
    """
    Carga los nodos desde el archivo Excel.
    
    Returns:
        Lista de diccionarios con datos de nodos
    """
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active
    
    nodes = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        code, name, lat, lng, market, zone, is_active, created_at = row
        if is_active:
            nodes.append({
                'code': code,
                'name': name,
                'latitude': float(lat),
                'longitude': float(lng),
                'market': market,
                'zone': zone
            })
    
    return nodes


def create_texas_boundary() -> Polygon:
    """
    Crea un polígono rectangular que representa los límites de Texas.
    En producción, esto debería usar un GeoJSON real con los límites políticos.
    """
    return box(
        TEXAS_BOUNDS['min_lng'],
        TEXAS_BOUNDS['min_lat'],
        TEXAS_BOUNDS['max_lng'],
        TEXAS_BOUNDS['max_lat']
    )


def generate_voronoi_polygons(nodes: List[Dict], texas_boundary: Polygon) -> Dict:
    """
    Genera un cuadrado de 0.5834° por lado centrado en cada nodo.
    Total de celdas = número de nodos (150).
    
    Args:
        nodes: Lista de nodos con coordenadas
        texas_boundary: Polígono que representa Texas
        
    Returns:
        Diccionario con GeoJSON features
    """
    if not nodes:
        return {'type': 'FeatureCollection', 'features': []}
    
    # Tamaño del cuadrado por lado (en grados)
    square_size = 0.5834
    half_size = square_size / 2
    side_size = 0.6828/2
    
    print(f"Generando {len(nodes)} cuadrados de {square_size}° por lado")
    
    features = []
    
    for node_idx, node in enumerate(nodes):
        lng = node['longitude']
        lat = node['latitude']
        
        # Crear cuadrado centrado en el nodo
        square_coords = [
            [lng - side_size, lat - half_size],
            [lng + side_size, lat - half_size],
            [lng + side_size, lat + half_size],
            [lng - side_size, lat + half_size],
            [lng - side_size, lat - half_size]
        ]
        
        try:
            polygon = Polygon(square_coords)
            
            # Validar el polígono
            if not polygon.is_valid:
                polygon = polygon.buffer(0)
            
            # Recortar con los límites de Texas (opcional)
            clipped = polygon.intersection(texas_boundary)
            
            if clipped.is_empty or clipped.area == 0:
                # Si la intersección es vacía, usar el polígono completo
                clipped = polygon
            
            # Convertir a GeoJSON
            if isinstance(clipped, Polygon):
                coords = [list(clipped.exterior.coords)]
            elif isinstance(clipped, MultiPolygon):
                # Tomar el polígono más grande
                largest = max(clipped.geoms, key=lambda p: p.area)
                coords = [list(largest.exterior.coords)]
            else:
                continue
            
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': coords
                },
                'properties': {
                    'node_id': node_idx + 1,
                    'code': node['code'],
                    'name': node['name'],
                    'latitude': node['latitude'],
                    'longitude': node['longitude'],
                    'market': node['market'],
                    'zone': node['zone']
                }
            }
            features.append(feature)
            
        except Exception as e:
            print(f"Error creando cuadrado para nodo {node['code']}: {e}")
            continue
    
    print(f"Generados {len(features)} cuadrados")
    
    return {
        'type': 'FeatureCollection',
        'features': features
    }


def generate_voronoi_geojson(excel_path: str, output_path: str = None) -> Dict:
    """
    Función principal que genera el GeoJSON de Voronoi.
    
    Args:
        excel_path: Ruta al archivo Excel con nodos
        output_path: Ruta opcional para guardar el GeoJSON
        
    Returns:
        Diccionario con el GeoJSON
    """
    # Cargar nodos
    nodes = load_nodes_from_excel(excel_path)
    print(f"Cargados {len(nodes)} nodos activos")
    
    # Crear límites de Texas
    texas_boundary = create_texas_boundary()
    
    # Generar polígonos de Voronoi
    geojson = generate_voronoi_polygons(nodes, texas_boundary)
    print(f"Generados {len(geojson['features'])} polígonos")
    
    # Guardar si se especifica ruta
    if output_path:
        with open(output_path, 'w') as f:
            json.dump(geojson, f, indent=2)
        print(f"GeoJSON guardado en: {output_path}")
    
    return geojson


if __name__ == "__main__":
    # Test del generador
    excel_path = "../../Fuentes/TX Nodos de Referencia_r1.xlsx"
    output_path = "texas_voronoi.geojson"
    
    geojson = generate_voronoi_geojson(excel_path, output_path)
    print(f"Generación completa: {len(geojson['features'])} regiones")
