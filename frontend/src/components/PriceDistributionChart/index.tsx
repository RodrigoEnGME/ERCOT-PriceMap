import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../../services/priceService';
import { DataType } from '../../types';

interface Props {
  timestamp: string;
  market: string;
  dataType: DataType;
}

interface NodePricePoint {
  node_id: number;
  node_code: string;
  node_name: string;
  price: number;
}

interface AllNodesDistribution {
  timestamp: string;
  data: NodePricePoint[];
}

const PriceDistributionChart: React.FC<Props> = ({ timestamp, market, dataType }) => {
  const [data, setData] = useState<AllNodesDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timestamp && dataType !== DataType.NODES) {
      loadData();
    }
  }, [timestamp, market, dataType]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const distribution = await priceService.getAllNodesDistribution(timestamp, market, dataType);
      setData(distribution);
    } catch (err: any) {
      setError('Failed to load price distribution');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Box p={2}>
        <Typography>No hay datos disponibles para este momento</Typography>
      </Box>
    );
  }

  // Preparar datos para el gráfico (ordenados de mayor a menor)
  const chartData = data.data.map((item, index) => ({
    rank: index + 1,
    price: item.price,
    node_code: item.node_code,
    node_name: item.node_name,
  }));

  const getLabel = () => {
    switch (dataType) {
      case DataType.PRICE:
        return 'Price ($/MWh)';
      case DataType.SOLAR_CAPTURE:
        return 'Solar Capture (MW)';
      case DataType.WIND_CAPTURE:
        return 'Wind Capture (MW)';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Grid Cell Price Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {data.data.length} nodes ordered from highest to lowest price
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="rank" 
            label={{ value: 'Node Ranking', position: 'insideBottom', offset: -5 }}
            tick={{ fontSize: 10 }}
          />
          <YAxis label={{ value: getLabel(), angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => {
              return [
                `${value.toFixed(2)}`,
                `${props.payload.node_code}: ${props.payload.node_name}`
              ];
            }}
          />
          <Legend />
          <Bar dataKey="price" fill="#82ca9d" name={getLabel()} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PriceDistributionChart;
