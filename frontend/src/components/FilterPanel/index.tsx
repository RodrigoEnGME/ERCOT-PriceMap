import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFilterStore } from '../../store';
import { nodeService } from '../../services/nodeService';
import { priceService } from '../../services/priceService';
import { Node, DataType, AggregationType } from '../../types';
import DownloadIcon from '@mui/icons-material/Download';
import { exportService } from '../../services/exportService';

const DRAWER_WIDTH = 280;

interface Props {
  onExport?: () => void;
}

const FilterPanel: React.FC<Props> = ({ onExport }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  
  const {
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedHour,
    selectedDate,
    selectedNode1,
    selectedNode2,
    aggregationType,
    dataType,
    market,
    setYear,
    setMonth,
    setDay,
    setHour,
    setDate,
    setNode1,
    setNode2,
    setAggregationType,
    setDataType,
    setMarket,
    resetFilters,
  } = useFilterStore();

  useEffect(() => {
    loadNodes();
    loadAvailableYears();
    initializeDefaultValues();
  }, []);

  const initializeDefaultValues = () => {
    // Setear fecha por defecto: 2025-12-01T09:00
    const defaultDate = new Date('2025-12-01T09:00:00');
    setDate(defaultDate);
    setYear(defaultDate.getFullYear());
    setMonth(defaultDate.getMonth() + 1);
    setDay(defaultDate.getDate());
    setHour(defaultDate.getHours());
  };

  const loadNodes = async () => {
    try {
      const nodeList = await nodeService.getNodes({ limit: 1000 });
      console.log('Loaded nodes:', nodeList.length, 'nodes');
      setNodes(nodeList);
      
      // Setear nodos por defecto si hay al menos 2 nodos
      if (nodeList.length >= 2) {
        setNode1(nodeList[18].id);
        setNode2(nodeList[20].id);
        console.log('Default nodes set:', nodeList[18].code, nodeList[20].code);
      } else if (nodeList.length === 1) {
        setNode1(nodeList[18].id);
        console.log('Default node 1 set:', nodeList[18].code);
      }
      
      if (nodeList.length === 0) {
        console.warn('No nodes returned from API. Check if database has node data.');
      }
    } catch (err) {
      console.error('Failed to load nodes', err);
    }
  };

  const loadAvailableYears = async () => {
    try {
      const data = await priceService.getAvailableYears();
      setAvailableYears(data.years);
      setMarkets(data.markets);
    } catch (err) {
      console.error('Failed to load available years', err);
    }
  };

  const handleExport = async () => {
    if (!selectedNode1) {
      alert('Please select at least Node 1');
      return;
    }

    const nodeIds = [selectedNode1];
    if (selectedNode2) nodeIds.push(selectedNode2);

    const startDate = new Date(selectedYear || new Date().getFullYear(), 0, 1);
    const endDate = new Date((selectedYear || new Date().getFullYear()) + 1, 0, 1);

    try {
      const blob = await exportService.exportToExcel({
        node_ids: nodeIds,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        data_type: dataType,
        include_aggregations: true,
      });
      
      const filename = `ercot_data_${dataType}_${new Date().getTime()}.xlsx`;
      exportService.downloadFile(blob, filename);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Export failed');
      console.error(err);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64, // AppBar height
          height: 'calc(100% - 64px)',
          p: 2,
        },
      }}
    >
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {/* Date/Time Picker - Solo horas completas */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <DateTimePicker
            label="Select Date & Hour"
            value={selectedDate || new Date()}
            onChange={(newValue) => {
              if (newValue) {
                // Truncar a hora completa (sin minutos/segundos)
                const hourOnly = new Date(newValue);
                hourOnly.setMinutes(0, 0, 0);
                setDate(hourOnly);
                setYear(hourOnly.getFullYear());
                setMonth(hourOnly.getMonth() + 1);
                setDay(hourOnly.getDate());
                setHour(hourOnly.getHours());
              }
            }}
            views={['year', 'month', 'day', 'hours']}
            format="yyyy-MM-dd HH:00"
            ampm={false}
            slotProps={{ textField: { size: 'small' } }}
          />
        </FormControl>
      </LocalizationProvider>

      {/* Year */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Year</InputLabel>
        <Select
          value={selectedYear || ''}
          label="Year"
          onChange={(e) => setYear(e.target.value as number)}
        >
          {availableYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Market */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Market</InputLabel>
        <Select
          value={market}
          label="Market"
          onChange={(e) => setMarket(e.target.value)}
        >
          {markets.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Node 1 */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Node 1</InputLabel>
        <Select
          value={selectedNode1 || ''}
          label="Node 1"
          onChange={(e) => setNode1(e.target.value as number)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {nodes.map((node) => (
            <MenuItem key={node.id} value={node.id}>
              {node.code} - {node.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Node 2 */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Node 2</InputLabel>
        <Select
          value={selectedNode2 || ''}
          label="Node 2"
          onChange={(e) => setNode2(e.target.value as number)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {nodes.map((node) => (
            <MenuItem key={node.id} value={node.id}>
              {node.code} - {node.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Data Type */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Data Type</InputLabel>
        <Select
          value={dataType}
          label="Data Type"
          onChange={(e) => setDataType(e.target.value as DataType)}
        >
          <MenuItem value={DataType.PRICE}>Price</MenuItem>
          <MenuItem value={DataType.SOLAR_CAPTURE}>Solar Capture</MenuItem>
          <MenuItem value={DataType.WIND_CAPTURE}>Wind Capture</MenuItem>
        </Select>
      </FormControl>

      {/* Aggregation Type */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Aggregation</InputLabel>
        <Select
          value={aggregationType}
          label="Aggregation"
          onChange={(e) => setAggregationType(e.target.value as AggregationType)}
        >
          <MenuItem value={AggregationType.AVG}>Average</MenuItem>
          <MenuItem value={AggregationType.MAX}>Maximum</MenuItem>
          <MenuItem value={AggregationType.MIN}>Minimum</MenuItem>
          <MenuItem value={AggregationType.SUM}>Sum</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Export Button */}
      <Button
        variant="contained"
        fullWidth
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        sx={{ mb: 1 }}
      >
        Export to Excel
      </Button>

      {/* Reset Filters */}
      <Button variant="outlined" fullWidth onClick={resetFilters}>
        Reset Filters
      </Button>
    </Drawer>
  );
};

export default FilterPanel;
