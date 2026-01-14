import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../../services/priceService';
import { PriceDistribution, DataType } from '../../types';

interface Props {
  nodeId: number;
  startDate: string;
  endDate: string;
  dataType: DataType;
}

const PriceDistributionChart: React.FC<Props> = ({ nodeId, startDate, endDate, dataType }) => {
  const [data, setData] = useState<PriceDistribution | null>(null);
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
      const distribution = await priceService.getPriceDistribution(nodeId, startDate, endDate, dataType);
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

  if (!data || data.prices.length === 0) {
    return (
      <Box p={2}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  // Group prices into buckets for better visualization
  const bucketSize = 50;
  const chartData = data.prices
    .slice(0, Math.min(data.prices.length, 200))  // Limit to 200 data points
    .map((price, index) => ({
      index: Math.floor(index / bucketSize) * bucketSize,
      price: price,
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
        Price Distribution - {data.node_code}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Sorted from highest to lowest
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index" 
            label={{ value: 'Hour Rank', position: 'insideBottom', offset: -5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis label={{ value: getLabel(), angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="price" fill="#82ca9d" name={getLabel()} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PriceDistributionChart;
