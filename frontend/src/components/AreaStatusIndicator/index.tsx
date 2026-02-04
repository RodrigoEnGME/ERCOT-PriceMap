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
  const hubs = data.filter((n: NodeStatus) => ['HB_Huston','HB_North','HB_Pan','HB_South','HB_West'].includes(n.name));
  const loadZones = data.filter((n: NodeStatus) => ['LZ_CPS', 'LZ_Huston', 'LZ_LCRA', 'LZ_North', 'LZ_South', 'LZ_West'].includes(n.name));
  const reserves = data.filter((n: NodeStatus) => ['Reg-Up', 'Reg-Down', 'RRS', 'ECRS', 'Non-Spin'].includes(n.name));

  const newNames: { [key: string]: string } = {
    'HB_Huston': 'HB_Huston',
    'HB_North': 'HB_North',
    'HB_Pan': 'HB_Pan',
    'HB_South': 'HB_South',
    'HB_West': 'HB_West',
    'LZ_CPS': 'LZ_CPS',
    'LZ_Huston': 'LZ_Huston',
    'LZ_LCRA': 'LZ_LCRA',
    'LZ_North': 'LZ_North',
    'LZ_South': 'LZ_South',
    'LZ_West': 'LZ_West',
    'Reg-Up': 'Reg-Up',
    'Reg-Down': 'Reg-Down',
    'RRS': 'RRS',
    'ECRS': 'ECRS',
    'Non-Spin': 'Non-Spin'
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
          {newNames[node.name] || node.name}
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
      {

        dataType === DataType.PRICE && (<Paper sx={{ p: 2, flex: 1 }}>
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
      </Paper>)
          }
    </Box>
  );
};

export default AreaStatusIndicator;