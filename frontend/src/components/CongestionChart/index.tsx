import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../../services/priceService';
import { CongestionData, DataType } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  node1Id: number;
  node2Id: number;
  startDate: string;
  endDate: string;
  dataType: DataType;
}

const CongestionChart: React.FC<Props> = ({ node1Id, node2Id, startDate, endDate, dataType }) => {
  const [data, setData] = useState<CongestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (node1Id && node2Id) {
      loadData();
    }
  }, [node1Id, node2Id, startDate, endDate, dataType]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const congestion = await priceService.getCongestionPricing(node1Id, node2Id, startDate, endDate, dataType);
      setData(congestion);
    } catch (err: any) {
      setError('Failed to load congestion data');
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

  if (!data || data.length === 0) {
    return (
      <Box p={2}>
        <Typography>No data available. Please select two nodes.</Typography>
      </Box>
    );
  }

  const chartData = data.map((item) => ({
    timestamp: format(parseISO(item.timestamp), 'MMM yyyy'),
    fullTimestamp: format(parseISO(item.timestamp), 'MMM yyyy'),
    node1_price: item.node1_price,
    node2_price: item.node2_price,
    congestion: item.congestion_price,
  }));
  const getLabel = () => {
    switch(dataType) {
      case DataType.PRICE:
        return 'Congestion Cost [$/MWh] monthly average between the selected grid cells';
      case DataType.SOLAR_CAPTURE:
        return 'Congestion Cost [$/MWh] monthly average between the selected grid cells in solar production hours';
      case DataType.WIND_CAPTURE:
        return 'Congestion Cost [$/MWh] monthly average between the selected grid cells in wind production hours';
      default:
        return 'LMPs [$/MWh]';
    }
  }
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Congestion Cost: {data[0]?.node1_code} to {data[0]?.node2_code}
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
          <YAxis label={{ angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(value: any) => {
              const item = chartData.find(d => d.timestamp === value);
              return item?.fullTimestamp || value;
            }}
            formatter={(value:any)=>{
              if (value == null) return ['Sin datos', ''];

              return [`${value.toFixed(2)} $/MWh`, ''];
            }}
            separator=''
          />
          <Legend />
          {/* <Line type="monotone" dataKey="node1_price" stroke="#1976d2" name={`${data[0]?.node1_code} Price`} dot={false} />
          <Line type="monotone" dataKey="node2_price" stroke="#dc004e" name={`${data[0]?.node2_code} Price`} dot={false} /> */}
          <Line
             type="monotone"
             dataKey="congestion" 
             stroke="#dc004e" 
             name={getLabel()}
             strokeWidth={2} 
             dot={false}
             />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CongestionChart;
