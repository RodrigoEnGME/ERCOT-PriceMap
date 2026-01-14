import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip } from 'react-leaflet';
import { Box, Typography, CircularProgress } from '@mui/material';
import { priceService } from '../../services/priceService';
import { HourlySnapshot } from '../../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  timestamp: string;
  market: string;
}

const PriceHeatmap: React.FC<Props> = ({ timestamp, market }) => {
  const [data, setData] = useState<HourlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [timestamp, market]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Requesting map data for timestamp:', timestamp, 'market:', market);
      const snapshot = await priceService.getHourlySnapshot(timestamp, market);
      console.log('Loaded map data:', snapshot.length, 'nodes');
      if (snapshot.length === 0) {
        setError('No data available for this timestamp. Make sure database is populated.');
      }
      setData(snapshot);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load map data';
      setError(errorMsg);
      console.error('Map load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (price: number): string => {
    // Color scale from green (low) to red (high)
    if (price < 20) return '#00ff00';
    if (price < 40) return '#7fff00';
    if (price < 60) return '#ffff00';
    if (price < 80) return '#ff7f00';
    if (price < 100) return '#ff0000';
    return '#8b0000';
  };

  // Tamaño del área cuadrada en grados (aproximadamente 0.3 grados = ~33 km)
  const SQUARE_SIZE_DEGREES = 0.6;

  // Crear bounds para el rectángulo centrado en las coordenadas del nodo
  const createSquareBounds = (lat: number, lng: number): [[number, number], [number, number]] => {
    const halfSize = SQUARE_SIZE_DEGREES / 2;
    return [
      [lat - halfSize, lng - halfSize], // southwest corner
      [lat + halfSize, lng + halfSize], // northeast corner
    ];
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

  if (data.length === 0 && !loading) {
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
    <Box sx={{ height: '700px', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((node) => (
          <Rectangle
            key={node.node_id}
            bounds={createSquareBounds(node.latitude, node.longitude)}
            pathOptions={{
              fillColor: getPriceColor(node.price),
              fillOpacity: 0.7,
              color: '#000',
              weight: 2,
            }}
          >
            <Tooltip>
              <div>
                <strong>{node.name}</strong>
                <br />
                Code: {node.code}
                <br />
                Price: ${node.price.toFixed(2)}/MWh
              </div>
            </Tooltip>
          </Rectangle>
        ))}
      </MapContainer>
      
      {/* Marca de Agua GME */}
      <Box
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
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        {[
          { color: '#00ff00', label: '< $20' },
          { color: '#7fff00', label: '$20-40' },
          { color: '#ffff00', label: '$40-60' },
          { color: '#ff7f00', label: '$60-80' },
          { color: '#ff0000', label: '$80-100' },
          { color: '#8b0000', label: '> $100' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: item.color,
                border: '2px solid #000',
              }}
            />
            <Typography variant="caption">{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PriceHeatmap;
