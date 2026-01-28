import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../../services/priceService';
import { DataType } from '../../types';

interface Props {
  nodeId: number;
  year: number;
  day: number;
  hour: number;
  dataType: DataType;
}

interface MonthlyData {
  month: number;
  value: number | null;
}

interface MonthlyComparisonData {
  node_id: number;
  node_code: string;
  node_name: string;
  year: number;
  day: number;
  hour: number;
  data: MonthlyData[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PriceEvolutionChart: React.FC<Props> = ({ nodeId, year, day, hour, dataType }) => {
  const [data, setData] = useState<MonthlyComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (nodeId && year && day !== undefined && hour !== undefined && dataType !== DataType.NODES) {
      loadData();
    }
  }, [nodeId, year, day, hour, dataType]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const comparison = await priceService.getMonthlyComparison(nodeId, year, day, hour, dataType);
      setData(comparison);
      console.log('Monthly Comparison Data:', comparison);
    } catch (err: any) {
      setError('Failed to load monthly comparison');
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
        <Typography>No hay datos disponibles para el día {day} a las {hour}:00 en {year}</Typography>
      </Box>
    );
  }

  const chartData = data.data.map((item) => ({
    month: MONTH_NAMES[item.month - 1],
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
      case DataType.NEGATIVE_HOURS:
        return 'Negative Hours';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {data.node_name} - Monthly Comparison {year}
      </Typography>
      {/* <Typography variant="body2" color="text.secondary" gutterBottom>
        Average {getLabel()} per month
      </Typography> */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => `${label} ${year}`}
            formatter={(value: any) => {
              if (value == null) return ['Sin datos', ''];
              const unit = dataType === DataType.NEGATIVE_HOURS ? 'Hours' : '$/MWh';
                          
              return [`${value.toFixed(2)} ${unit}`, ''];
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#1976d2" 
            name={getLabel()}
            connectNulls={false}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PriceEvolutionChart;
