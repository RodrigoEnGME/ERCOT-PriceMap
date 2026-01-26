import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { priceService } from '../../services/priceService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DataType } from '../../types';

interface Props {
  timestamp: string;
  market: string;
  dataType?: string;
}

interface VoronoiFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    node_id: number;
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    market: string;
    zone: string;
    price: number | null;
    value?: number | null;
  };
}

interface VoronoiData {
  type: 'FeatureCollection';
  features: VoronoiFeature[];
}
const MapInvalidator: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};
const ZoomLogger: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    const onZoomEnd = () => {
      console.log('Current zoom level:', map.getZoom());
    };
    
    // Log inicial
    console.log('Initial zoom level:', map.getZoom());
    
    // Escuchar cambios de zoom
    map.on('zoomend', onZoomEnd);
    
    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);
  
  return null;
};

const PriceHeatmap: React.FC<Props> = ({ timestamp, market, dataType }) => {
  const [voronoiData, setVoronoiData] = useState<VoronoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    loadData();
  }, [timestamp, market, dataType]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // console.log('Requesting Voronoi map data for timestamp:', timestamp, 'market:', market, 'dataType:', dataType);
      const data = await priceService.getVoronoiMap(timestamp, market, dataType as DataType);
      // console.log('Loaded Voronoi data:', data.features?.length, 'polygons');
      if (!data.features || data.features.length === 0) {
        setError('No data available for this timestamp. Make sure database is populated.');
      }
      setVoronoiData(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load map data';
      setError(errorMsg);
      console.error('Map load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && voronoiData && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.setZoom(5.5); // Cambia el zoom a 6
      }, 100);
    }
  }, [loading, voronoiData]);


  const getPriceColor = (value: number | null): string => {
    if (value === null || value === undefined) return '#ffffff';
    
    if (value < -20) return '#00008B';
    if (value < -10) return '#0000CD';
    if (value <   0) return '#4169E1';
    if (value <  10) return '#006400';
    if (value <  20) return '#32CD32';
    if (value <  30) return '#FFFF99';
    if (value <  40) return '#FFFF00';
    if (value <  50) return '#FFD700';
    if (value <  60) return '#FFA500';
    if (value <  70) return '#FF8C00';
    if (value <  80) return '#FF6347';
    if (value <  90) return '#FF0000';
    return '#8B0000';
  };

  const getPolygonStyle = (feature: VoronoiFeature) => {
    return {
      fillColor: getPriceColor(feature.properties.value ?? feature.properties.price),
      fillOpacity: 0.7,
      color: '#666',
      weight: 0.5,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const { name, code, value, price } = feature.properties;
      
      let valueText: string;
      if (value === null || value === undefined) {
        valueText = 'No data';
      } else if (typeof value === 'string') {
        valueText = `Node: ${value}`;
      } else if (typeof value === 'number' && (dataType !== DataType.NODES && dataType !== DataType.NEGATIVE_HOURS)) {
        valueText = `$${value.toFixed(2)}/MWh`;
      } else if (typeof value === 'number' && (dataType === DataType.NEGATIVE_HOURS)) {
        valueText = `${value} hours`;
      } else {
        valueText = 'No data';
      }
      
      layer.bindTooltip(
        `<div>
          <strong>${name}</strong><br/>
          Code: ${code}<br/>
          Value: ${valueText}
        </div>`,
        { permanent: false, direction: 'top' }
      );
    }
  };

  // Función para calcular el centroide de un polígono
  const getPolygonCentroid = (coordinates: number[][][]): [number, number] => {
    const points = coordinates[0]; // Primer anillo del polígono
    let sumLat = 0;
    let sumLng = 0;
    let count = points.length - 1; // Excluir el último punto (es igual al primero)

    for (let i = 0; i < count; i++) {
      sumLng += points[i][0];
      sumLat += points[i][1];
    }

    return [sumLat / count, sumLng / count];
  };

  // Crear icono de texto personalizado
  const createPriceIcon = (value: number | string | null): L.DivIcon => {
    let displayValue: string;
    let textColor: string;
    
    // Manejar diferentes tipos de valores
    if (value === null || value === undefined) {
      displayValue = '-';
      textColor = '#999'; // Gris para sin datos
    } else if (typeof value === 'string') {
      // Para NODES (strings como "120")
      displayValue = value;
      textColor = '#000';
    } else if (typeof value === 'number' && !isNaN(value)) {
      // Para números válidos
      displayValue = Math.round(value).toString();
      textColor = value < 50 ? '#000' : '#fff';
    } else {
      // Para NaN o valores inválidos
      displayValue = '-';
      textColor = '#999';
    }

    const charWidth = 8;
    const totalWidth = displayValue.length * charWidth;
    const anchorX = totalWidth / 2;
    
    return L.divIcon({
      className: 'price-label',
      html: `<div style="
        font-size: 12px;
        font-weight: bold;
        color: ${textColor};
        white-space: nowrap;
        pointer-events: none;
      ">${displayValue}</div>`,
      iconSize: [totalWidth, 14],
      iconAnchor: [anchorX - 1, 7],
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={500}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Typography variant="body2" color="text.secondary">
          Tip: Make sure database is populated with price data.
        </Typography>
      </Box>
    );
  }

  if (!voronoiData || voronoiData.features.length === 0) {
    return (
      <Box p={2}>
        <Typography color="warning.main" gutterBottom>
          No nodes with data found for the selected timestamp.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select a different date/hour or populate the database.
        </Typography>
      </Box>
    );
  }

  const texasBounds: [[number, number], [number, number]] = [
    [25.8, -106.65],
    [36.5, -93.5]
  ];
  const INITIAL_ZOOM = 5.5;

  const center: [number, number] = [31.0, -100.0];

  const legendItems = [
    { color: '#00008B', label: '< -20' },
    { color: '#0000CD', label: '-20 to -10' },
    { color: '#4169E1', label: '-10 to 0' },
    { color: '#006400', label: '0 to 10' },
    { color: '#32CD32', label: '10 to 20' },
    { color: '#FFFF99', label: '20 to 30' },
    { color: '#FFFF00', label: '30 to 40' },
    { color: '#FFD700', label: '40 to 50' },
    { color: '#FFA500', label: '50 to 60' },
    { color: '#FF8C00', label: '60 to 70' },
    { color: '#FF6347', label: '70 to 80' },
    { color: '#FF0000', label: '80 to 90' },
    { color: '#8B0000', label: '> 90' },
  ];

  const colorMapTags = {
  'price': 'LPM ($/MWh)',
  'solar_capture': 'Solar Capture ($/MW)',
  'wind_capture': 'Wind Capture ($/MW)',
  'negative_hours': 'Negative Hours [Hrs]',
  'nodes': 'Grid Cell',

  }

  return (
    <Box sx={{ height: '500px', width: '100%', display: 'flex', gap: 2, position: 'relative' }}>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={INITIAL_ZOOM}
          maxBounds={texasBounds}
          maxBoundsViscosity={1.0}
          minZoom={INITIAL_ZOOM}
          maxZoom={7}
          zoomSnap={0.5}
          zoomDelta={0.5} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={true}
          whenReady={() => {
            // Invalidar después de que el mapa esté listo
            setTimeout(() => {
              mapRef.current?.invalidateSize();
            }, 100);
          }}
        >
          <MapInvalidator />
          <ZoomLogger />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            opacity={1}
          />
          {voronoiData && (
            <GeoJSON
              data={voronoiData as any}
              style={getPolygonStyle as any}
              onEachFeature={onEachFeature}
            />
          )}
          {/* Marcadores de precio en el centro de cada polígono */}
          {voronoiData && voronoiData.features.map((feature, index) => {
            const centroid = getPolygonCentroid(feature.geometry.coordinates);
            // Usar value si existe, sino price
            const displayValue = feature.properties.value ?? feature.properties.price;
            return (
              <Marker
                key={`price-${index}`}
                position={centroid}
                icon={createPriceIcon(displayValue)}
              />
            );
          })}
        </MapContainer>
      </Box>

      <Paper 
        elevation={2}
        sx={{ 
          width: 120, 
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1.5,
            textAlign: 'center',
            fontSize: '0.9rem',
            borderBottom: '2px solid #333',
            pb: 0.5
          }}
        >
          {colorMapTags[dataType as keyof typeof colorMapTags] || 'Value'}
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {legendItems.map((item) => (
            <Box 
              key={item.label} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 18,
                  backgroundColor: item.color,
                  border: '1px solid #333',
                  flexShrink: 0,
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.75rem', color: '#333' }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default PriceHeatmap;