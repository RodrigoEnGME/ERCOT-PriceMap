import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../../services/priceService';
import { NodePriceEvolution, DataType } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  nodeId: number;
  startDate: string;
  endDate: string;
  dataType: DataType;
}

const PriceEvolutionChart: React.FC<Props> = ({ nodeId, startDate, endDate, dataType }) => {
  const [data, setData] = useState<NodePriceEvolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (nodeId) {
      loadData();
    }
  }, [nodeId, startDate, endDate, dataType]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const evolution = await priceService.getPriceEvolution(nodeId, startDate, endDate, dataType);
      setData(evolution);
    } catch (err: any) {
      setError('Failed to load price evolution');
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
        <Typography>No data available for selected period</Typography>
      </Box>
    );
  }

  const chartData = data.data.map((item) => ({
    timestamp: format(parseISO(item.timestamp), 'MM/dd HH:mm'),
    value: item.value,
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
        {data.node_name} - {getLabel()}
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#1976d2" 
            name={getLabel()}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PriceEvolutionChart;
