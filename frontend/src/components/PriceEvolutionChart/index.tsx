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
  chart_year: number;
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
    chart_year: item.chart_year,
    month: MONTH_NAMES[item.month - 1],
    timestamp: `${MONTH_NAMES[item.month - 1]} ${item.chart_year}`, // Nueva propiedad para el eje X
    value: item.value,
  }));

  const getLabel = () => {
    switch (dataType) {
      case DataType.PRICE:
        return 'LMPs [$/MWh]';
      case DataType.SOLAR_CAPTURE:
        return 'Energy Selling prices [$/MWh] solar generators';
      case DataType.WIND_CAPTURE:
        return 'Energy Selling prices [$/MWh] wind generators';
      case DataType.NEGATIVE_HOURS:
        return 'Number of negative LMPs';
    }
  };
  const getSubtitle = () => {
    switch (dataType) {
      case DataType.PRICE:
        return 'Historical values for all ERCOT settlements points located within the geographic area of the selected grid cell';
      case DataType.SOLAR_CAPTURE:
        return 'Historical values for solar generators located within the geographic area of the selected grid cell';
      case DataType.WIND_CAPTURE:
        return 'Historical values for wind generators located within the geographic area of the selected grid cell';
      case DataType.NEGATIVE_HOURS:
        return 'Historical values for all ERCOT settlements points located within the geographic area of the selected grid cell';
    }
  };
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {data.node_name} - Monthly average
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {getSubtitle()}
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"  // Cambiar de "month" a "timestamp"
            tick={{ fontSize: 12 }}
            angle={-45}           // Agregar ángulo como en congestion
            textAnchor="end"      // Agregar anchor
            height={80}           // Agregar altura
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0 && payload[0].payload) {
                const chart_year = payload[0].payload.chart_year;
                return `${label} ${chart_year}`;
              }
              return label;
            }}
            formatter={(value: any) => {
              if (value == null) return 'Sin datos';
              const unit = dataType === DataType.NEGATIVE_HOURS ? 'Hours' : '$/MWh';
              return `${value.toFixed(2)} ${unit}`;
            }}
            separator=''
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
