import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Box, Typography } from '@mui/material';

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  label,
  unit,
  color = '#1976d2'
}) => {
  // Normalize value to percentage for the gauge
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <Box sx={{ width: '100%', height: 180, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: -2 }}>
        {label}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e0e0e0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ position: 'absolute', bottom: '20%', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
      </Box>
    </Box>
  );
};

export default GaugeChart;
