from app.utils.voronoi_generator import generate_voronoi_geojson
excel_path = r'c:\Desarrollo\EMI\ERCOT_Priceing_Dashboard\Fuentes\TX Nodos de Referencia_r1.xlsx'
result = generate_voronoi_geojson(excel_path)
print(f'Generated {len(result[\
features\])} features')
