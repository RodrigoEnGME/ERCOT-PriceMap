import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, GeoJSON } from 'react-leaflet';
import { Box, Typography, CircularProgress } from '@mui/material';
import { priceService } from '../../services/priceService';
import 'leaflet/dist/leaflet.css';

interface Props {
  timestamp: string;
  market: string;
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
  };
}

interface VoronoiData {
  type: 'FeatureCollection';
  features: VoronoiFeature[];
}

const PriceHeatmap: React.FC<Props> = ({ timestamp, market }) => {
  const [voronoiData, setVoronoiData] = useState<VoronoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [timestamp, market]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Requesting Voronoi map data for timestamp:', timestamp, 'market:', market);
      const data = await priceService.getVoronoiMap(timestamp, market);
      console.log('Loaded Voronoi data:', data.features?.length, 'polygons');
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

  const getPriceColor = (price: number | null): string => {
    if (price === null) return '#ffffff'; // Blanco para datos faltantes
    
    // Escala negativa (azules)
    if (price < -20) return '#00008B'; // Azul muy oscuro
    if (price < -10) return '#0000CD'; // Azul medio
    if (price < 0) return '#4169E1'; // Azul claro
    
    // Escala positiva siguiendo la imagen
    if (price < 10) return '#006400'; // Verde oscuro
    if (price < 20) return '#32CD32'; // Verde claro
    if (price < 30) return '#FFFF99'; // Amarillo claro
    if (price < 40) return '#FFFF00'; // Amarillo
    if (price < 50) return '#FFD700'; // Amarillo-naranja
    if (price < 60) return '#FFA500'; // Naranja claro
    if (price < 70) return '#FF8C00'; // Naranja
    if (price < 80) return '#FF6347'; // Naranja-rojo
    if (price < 90) return '#FF0000'; // Rojo
    return '#8B0000'; // Rojo oscuro (>90)
  };

  // Función para obtener estilo de cada polígono basado en su precio
  const getPolygonStyle = (feature: VoronoiFeature) => {
    return {
      fillColor: getPriceColor(feature.properties.price),
      fillOpacity: 0.6,
      color: '#333',
      weight: 1,
    };
  };

  // Función para manejar cada feature del GeoJSON
  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const { name, code, price } = feature.properties;
      const priceText = price !== null ? `$${price.toFixed(2)}/MWh` : 'No data';
      layer.bindTooltip(
        `<div>
          <strong>${name}</strong><br/>
          Code: ${code}<br/>
          Price: ${priceText}
        </div>`,
        { permanent: false, direction: 'top' }
      );
    }
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
          Tip: Make sure to run `python populate_db.py` to populate the database with sample data.
        </Typography>
      </Box>
    );
  }

  if (!voronoiData || voronoiData.features.length === 0 && !loading) {
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

  // Texas center coordinates
  const center: [number, number] = [31.0, -100.0];

  return (
    <Box sx={{ height: '450px', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={2}
        />
        {voronoiData && (
          <GeoJSON
            data={voronoiData as any}
            style={getPolygonStyle as any}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      
      {/* Marca de Agua GME */}
      {/* <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '120px',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.15)',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 400,
          letterSpacing: '20px',
        }}
      >
        GME
      </Box> */}
      
      {/* Legend */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {[
          { color: '#00008B', label: '< -$20' },
          { color: '#0000CD', label: '-$20 to -$10' },
          { color: '#4169E1', label: '-$10 to $0' },
          { color: '#006400', label: '$0 to $10' },
          { color: '#32CD32', label: '$10 to $20' },
          { color: '#FFFF99', label: '$20 to $30' },
          { color: '#FFFF00', label: '$30 to $40' },
          { color: '#FFD700', label: '$40 to $50' },
          { color: '#FFA500', label: '$50 to $60' },
          { color: '#FF8C00', label: '$60 to $70' },
          { color: '#FF6347', label: '$70 to $80' },
          { color: '#FF0000', label: '$80 to $90' },
          { color: '#8B0000', label: '> $90' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: item.color,
                border: '1px solid #666',
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PriceHeatmap;
