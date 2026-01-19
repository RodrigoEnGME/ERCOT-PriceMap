import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { priceService } from '../../services/priceService';

interface Props {
  timestamp: string;
  market: string;
}

interface NodeStatus {
  node_id: number;
  code: string;
  name: string;
  zone: string;
  price: number | null;
}

const AreaStatusIndicator: React.FC<Props> = ({ timestamp, market }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (timestamp) {
      loadData();
    }
  }, [timestamp, market]);

  const loadData = async () => {
    setLoading(true);
    try {
      const voronoiData = await priceService.getVoronoiMap(timestamp, market);
      setData(voronoiData);
    } catch (err) {
      console.error('Failed to load area status', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (price: number | null): string => {
    if (price === null) return '#CCCCCC'; // Gris para sin datos
    if (price < 0) return '#FF0000'; // Rojo para negativos
    return '#00FF00'; // Verde para positivos
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!data || !data.features) {
    return null;
  }

  // Filtrar nodos del 135 al 150 (asumiendo que son los últimos 16 nodos)
  const statusNodes = data.features
    .filter((f: any) => f.properties.node_id >= 135 && f.properties.node_id <= 150)
    .map((f: any) => ({
      node_id: f.properties.node_id,
      code: f.properties.code,
      name: f.properties.name,
      zone: f.properties.zone,
      price: f.properties.price,
    }));

  // Categorizar nodos
  const hubs = statusNodes.filter((n: NodeStatus) => [135, 136, 137, 138, 139].includes(n.node_id));
  const loadZones = statusNodes.filter((n: NodeStatus) => [140, 141, 142, 143, 144, 145].includes(n.node_id));
  const reserves = statusNodes.filter((n: NodeStatus) => n.node_id > 145);

  const newNames: { [key: number]: string } = {
        135 : 'HB_HUSTON',
        136 : 'HB_NORTH',
        137 : 'HB_PAN',
        138 : 'HB_SOUTH',
        139 : 'HB_WEST',
        140 : 'LZ_CPS',
        141 : 'LZ_HUSTON',
        142 : 'LZ_LCRA',
        143 : 'LZ_NORTH',
        144 : 'LZ_SOUTH',
        145 : 'LZ_WEST',
        146 : 'Reg-Up',
        147 : 'Reg-Down',
        148 : 'RRS',
        149 : 'ECRS',
        150 : 'Non-Spin'
  }
  
  const StatusCircle: React.FC<{ node: NodeStatus }> = ({ node }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 0.5,
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: getStatusColor(node.price),
          border: '2px solid #333',
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
        {newNames[node.node_id]}
      </Typography>
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
        LMPs [USD/MWh]
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Hubs Column */}
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Hubs
          </Typography>
          {hubs.map((node: NodeStatus) => (
            <StatusCircle key={node.node_id} node={node} />
          ))}
        </Box>

        {/* Load Zones Column */}
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Load Zones
          </Typography>
          {loadZones.map((node: NodeStatus) => (
            <StatusCircle key={node.node_id} node={node} />
          ))}
        </Box>

        {/* Reserves Column */}
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Reserves [USD/kW]
          </Typography>
          {reserves.map((node: NodeStatus) => (
            <StatusCircle key={node.node_id} node={node} />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default AreaStatusIndicator;