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

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const FilterPanel: React.FC<Props> = ({ onExport }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false); 

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
    initializeFilters();
  }, []);

  const initializeFilters = async () => {
    try {
      setIsInitialized(false);
      // 1. Primero cargar años y mercados
      await loadAvailableYears();
      
      // 2. Setear valores por defecto de fechas
      const defaultYear = 2025;
      const defaultMonth = 12;
      
      setYear(defaultYear);
      setMonth(defaultMonth);
      setDay(1);
      setHour(0);
      
      const defaultDate = new Date(defaultYear, defaultMonth - 1, 1, 0, 0, 0);
      setDate(defaultDate);
      
      // 3. Luego cargar nodos
      await loadNodes();
      
      // 4. Marcar como inicializado
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitialized(true);
      
    } catch (err) {
      console.error('Failed to initialize filters', err);
      setIsInitialized(true); 
    }
  };

  const loadNodes = async () => {
    try {
      const nodeList = await nodeService.getNodes({ limit: 150 });
      console.log('Loaded nodes:', nodeList.length, 'nodes');
      setNodes(nodeList);
      
      // Setear nodos por defecto si hay al menos 2 nodos
      if (nodeList.length >= 19) {
        setNode1(nodeList[18].id);
      }
      if (nodeList.length >= 21) {
        setNode2(nodeList[20].id);
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
      
      // Si no hay mercado seleccionado, usar el primero disponible
      if (data.markets.length > 0 && !market) {
        setMarket(data.markets[0]);
      }
    } catch (err) {
      console.error('Failed to load available years', err);
    }
  };

  // Actualizar fecha cuando cambia año o mes
  const handleYearChange = (year: number) => {
    setYear(year);
    setDay(1);
    setHour(0);
    
    // Actualizar selectedDate con día 1, hora 0
    const newDate = new Date(year, (selectedMonth || 1) - 1, 1, 0, 0, 0);
    setDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    setMonth(month);
    setDay(1);
    setHour(0);
    
    // Actualizar selectedDate con día 1, hora 0
    const newDate = new Date(selectedYear || new Date().getFullYear(), month - 1, 1, 0, 0, 0);
    setDate(newDate);
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

      {/* Year */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Year</InputLabel>
        <Select
          value={selectedYear || ''}
          label="Year"
          onChange={(e) => handleYearChange(e.target.value as number)}
        >
          {availableYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Month */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Month</InputLabel>
        <Select
          value={selectedMonth || ''}
          label="Month"
          onChange={(e) => handleMonthChange(e.target.value as number)}
        >
          {MONTHS.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
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
        <InputLabel>Grid Cell 1</InputLabel>
        <Select
          value={selectedNode1 || ''}
          label="Grid Cell 1"
          onChange={(e) => setNode1(e.target.value as number)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {nodes.map((node) => (
            <MenuItem key={node.id} value={node.id}>
              #{node.name.includes('#') ? node.name.split('#')[1].trim() : node.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Node 2 */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Grid Cell 2</InputLabel>
        <Select
          value={selectedNode2 || ''}
          label="Grid Cell 2"
          onChange={(e) => setNode2(e.target.value as number)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {nodes.map((node) => (
            <MenuItem key={node.id} value={node.id}>
              #{node.name.includes('#') ? node.name.split('#')[1].trim() : node.name}
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
          <MenuItem value={DataType.PRICE}>LPMs Average</MenuItem>
          <MenuItem value={DataType.SOLAR_CAPTURE}>Solar Captured Prices</MenuItem>
          <MenuItem value={DataType.WIND_CAPTURE}>Wind Captured Prices</MenuItem>
          <MenuItem value={DataType.NEGATIVE_HOURS}>Hours with Negative LPMs</MenuItem>
          <MenuItem value={DataType.NODES}>Grid Cell Number</MenuItem>
        </Select>
      </FormControl>

      {/* Aggregation Type */}
      {/* <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
      </FormControl> */}

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