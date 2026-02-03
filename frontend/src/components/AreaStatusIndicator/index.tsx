import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { priceService } from '../../services/priceService';
import { DataType } from '../../types';

interface Props {
  timestamp: string;
  market: string;
  dataType?: DataType;
}

interface NodeStatus {
  node_id: number;
  code: string;
  name: string;
  zone: string;
  value: number | null;
}

const AreaStatusIndicator: React.FC<Props> = ({ timestamp, market, dataType = DataType.PRICE }) => {
  const [data, setData] = useState<NodeStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (timestamp) {
      loadData();
    }
  }, [timestamp, market, dataType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statusData = await priceService.getStatusIndicators(timestamp, market, dataType);
      setData(statusData);
      console.log('Loaded status indicators:', statusData);
    } catch (err) {
      console.error('Failed to load status indicators', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (value: number | null): string => {
    if (value === null || value === undefined) return '#CCCCCC'; // Gris para sin datos
    
    if (value < -20) return '#00008B';
    if (value < -10) return '#0000CD';
    if (value < 0) return '#4169E1';
    if (value < 10) return '#006400';
    if (value < 20) return '#32CD32';
    if (value < 30) return '#FFFF99';
    if (value < 40) return '#FFFF00';
    if (value < 50) return '#FFD700';
    if (value < 60) return '#FFA500';
    if (value < 70) return '#FF8C00';
    if (value < 80) return '#FF6347';
    if (value < 90) return '#FF0000';
    if (value >= 90) return '#8B0000';
    return '#006400';
  };

  // Determinar color de texto según fondo
  const getTextColor = (value: number | null): string => {
    if (value === null || value === undefined) return '#666';
    if (value < 50) return '#000'; // Negro para fondos claros
    return '#fff'; // Blanco para fondos oscuros
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box p={2}>
        <Typography color="warning.main">No status data available</Typography>
      </Box>
    );
  }

  // Categorizar nodos por ID (ajusta estos rangos según tus datos reales)
  const hubs = data.filter((n: NodeStatus) => ['HB_HUSTON','HB_NORTH','HB_PAN','HB_SOUTH','HB_WEST'].includes(n.name));
  const loadZones = data.filter((n: NodeStatus) => ['LZ_CPS', 'LZ_HUSTON', 'LZ_LCRA', 'LZ_NORTH', 'LZ_SOUTH', 'LZ_WEST'].includes(n.name));
  const reserves = data.filter((n: NodeStatus) => ['Reg-Up', 'Reg-Down', 'RRS', 'ECRS', 'Non-Spin'].includes(n.name));

  const newNames: { [key: number]: string } = {
    135: 'HB_HUSTON',
    136: 'HB_NORTH',
    137: 'HB_PAN',
    138: 'HB_SOUTH',
    139: 'HB_WEST',
    140: 'LZ_CPS',
    141: 'LZ_HUSTON',
    142: 'LZ_LCRA',
    143: 'LZ_NORTH',
    144: 'LZ_SOUTH',
    145: 'LZ_WEST',
    146: 'Reg-Up',
    147: 'Reg-Down',
    148: 'RRS',
    149: 'ECRS',
    150: 'Non-Spin'
  };

  const StatusCircle: React.FC<{ node: NodeStatus }> = ({ node }) => {
    const displayValue = node.value !== null ? Math.round(node.value) : '-';
    
    return (
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
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: getPriceColor(node.value),
            border: '2px solid #333',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            color: getTextColor(node.value),
          }}
        >
          {displayValue}
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {newNames[node.node_id] || node.name}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
      {/* Contenedor LMPs */}
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          LMPs monthly average[$/MWh]
        </Typography>
        {/* <Typography variant="body2" color="text.secondary" gutterBottom>
          LMPs monthly average
        </Typography> */}
        
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'space-evenly' }}>
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
        </Box>
      </Paper>

      {/* Contenedor Reserves - Separado */}
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Ancillary Services prices monthly average [$/MW]
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
          <Box sx={{ minWidth: 180 }}>
            {reserves.map((node: NodeStatus) => (
              <StatusCircle key={node.node_id} node={node} />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AreaStatusIndicator;