from app.utils.voronoi_generator import generate_voronoi_geojson
import sys

excel_path = r'c:\Desarrollo\EMI\ERCOT_Priceing_Dashboard\Fuentes\TX Nodos de Referencia_r1.xlsx'

try:
    print("Testing Voronoi generator...")
    result = generate_voronoi_geojson(excel_path)
    print(f"Generated {len(result['features'])} features")
    
    if result['features']:
        first = result['features'][0]
        print(f"First feature properties: {list(first['properties'].keys())}")
        print(f"Geometry type: {first['geometry']['type']}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

