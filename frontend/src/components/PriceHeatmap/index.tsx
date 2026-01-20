import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { priceService } from '../../services/priceService';
import 'leaflet/dist/leaflet.css';

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
  };
}

interface VoronoiData {
  type: 'FeatureCollection';
  features: VoronoiFeature[];
}

const PriceHeatmap: React.FC<Props> = ({ timestamp, market, dataType }) => {
  const [voronoiData, setVoronoiData] = useState<VoronoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [timestamp, market, dataType]);

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
    if (price === null) return '#ffffff';
    
    if (price < -20) return '#00008B';
    if (price < -10) return '#0000CD';
    if (price < 0) return '#4169E1';
    
    if (price < 10) return '#006400';
    if (price < 20) return '#32CD32';
    if (price < 30) return '#FFFF99';
    if (price < 40) return '#FFFF00';
    if (price < 50) return '#FFD700';
    if (price < 60) return '#FFA500';
    if (price < 70) return '#FF8C00';
    if (price < 80) return '#FF6347';
    if (price < 90) return '#FF0000';
    return '#8B0000';
  };

  const getPolygonStyle = (feature: VoronoiFeature) => {
    return {
      fillColor: getPriceColor(feature.properties.price),
      fillOpacity: 0.7,
      color: '#666',
      weight: 0.5,
    };
  };

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
      <Box display="flex" justifyContent="center" alignItems="center" height={450}>
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

  // Texas bounds
  const texasBounds: [[number, number], [number, number]] = [
    [22.8, -108.65], // Southwest corner
    [39.5, -90.5]    // Northeast corner
  ];

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

  return (
    <Box sx={{ height: '450px', width: '100%', display: 'flex', gap: 2, position: 'relative' }}>
      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={5}
          maxBounds={texasBounds}
          maxBoundsViscosity={1.0}
          minZoom={5}
          maxZoom={9}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
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
        </MapContainer>
      </Box>

      {/* Legend - Right Side */}
      <Paper 
        elevation={2}
        sx={{ 
          width: 180, 
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
          {dataType==='price' ? 'Price ($/MWh)' : dataType==='solar_capture' ? 'Solar Capture (MW)' : dataType==='wind_capture' ? 'Wind Capture (MW)' : 'Price ($/MWh)'}
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