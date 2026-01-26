import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useFilterStore } from '../../store';
import FilterPanel from '../../components/FilterPanel';
import PriceHeatmap from '../../components/PriceHeatmap';
import PriceEvolutionChart from '../../components/PriceEvolutionChart';
import PriceDistributionChart from '../../components/PriceDistributionChart';
import CongestionChart from '../../components/CongestionChart';
import { priceService } from '../../services/priceService';
import { AggregatedStats } from '../../types';
import AreaStatusIndicator from '../../components/AreaStatusIndicator';

const START_URL = import.meta.env.VITE_START_URL || '';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { 
    selectedYear, 
    selectedMonth, 
    selectedDay, 
    selectedHour,
    selectedDate,
    selectedNode1, 
    selectedNode2, 
    dataType,
    market 
  } = useFilterStore();

  const [stats, setStats] = useState<AggregatedStats | null>(null);

  useEffect(() => {
    if (selectedNode1) {
      loadStats();
    }
  }, [selectedNode1, selectedYear, dataType]);

  const loadStats = async () => {
    if (!selectedNode1 || !selectedYear) return;

    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear + 1, 0, 1);

    try {
      const aggregatedStats = await priceService.getAggregatedStats(
        selectedNode1,
        startDate.toISOString(),
        endDate.toISOString(),
        dataType
      );
      setStats(aggregatedStats);
      console.log('Loaded stats:', aggregatedStats);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`${START_URL}/login`, { replace: true });
  };

  // Generate timestamp for heatmap (hora completa sin minutos/segundos)
  // Generate timestamp for heatmap (siempre día 1, hora 0 del mes seleccionado)
  const getHeatmapTimestamp = (): string => {
    const year = selectedYear || new Date().getFullYear();
    const month = (selectedMonth || 1) - 1; // JavaScript months are 0-indexed
    
    // Siempre día 1, hora 1
    const date = new Date(year, month, 1, 1, 0, 0, 0);
    
    return date.toISOString();
  };

  const getDateRange = () => {
    if (!selectedYear) return { start: '', end: '' };
    
    const start = new Date(selectedYear, (selectedMonth || 1) - 1, selectedDay || 1);
    const end = selectedMonth && selectedDay
      ? new Date(selectedYear, (selectedMonth || 1) - 1, selectedDay || 1, 23, 59, 59)
      : selectedMonth
      ? new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      : new Date(selectedYear, 11, 31, 23, 59, 59);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const getYearRange = () => {
    if (!selectedYear) return { start: '', end: '' };
    
    // Siempre retorna el año completo: 1 de enero 0:00:00 a 31 de diciembre 23:59:59
    const start = new Date(selectedYear, 0, 1, 0, 0, 0);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const dateRange = getDateRange();
  const yearRange = getYearRange();

  return (
    <Box sx={{ display: 'flex' }}>
  {/* AppBar */}
  <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
    <Toolbar>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        ERCOT Pricing Dashboard
      </Typography>
      <IconButton color="inherit" onClick={handleLogout}>
        <LogoutIcon />
      </IconButton>
    </Toolbar>
  </AppBar>

  {/* Filter Panel */}
  <FilterPanel />

  {/* Main Content - Ahora completamente responsivo */}
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      mt: 8,
      width: { xs: '100%', sm: 'calc(100%)' }, // 280px es el ancho del FilterPanel
      ml: { xs: 0 }, // Margen izquierdo = ancho del drawer
    }}
  >
    {/* Price Heatmap - 100% del ancho disponible */}
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
      width: '100%',
      borderRadius: 0,
      boxSizing: 'border-box'
    }}>
      <Typography variant="h6" gutterBottom>
        Grid Cell Price Heatmap
      </Typography>
      <PriceHeatmap timestamp={getHeatmapTimestamp()} market={market} dataType={dataType} />
    </Paper>

    {/* Area Status Indicator */}
    <Box sx={{ px: 2, py: 1 }}>
      <AreaStatusIndicator timestamp={getHeatmapTimestamp()} market={market} />
    </Box>

    {/* Resto del contenido */}
    <Box sx={{ p: 2 }}>
      {/* Charts Grid - Cada gráfica ocupa 100% */}
      <Grid container spacing={2}>
        {selectedNode1 && selectedYear && (
          <>
            <Grid size={{ xs: 12 }}>
              <PriceEvolutionChart
                nodeId={selectedNode1}
                year={selectedYear}
                day={selectedDay || 1}  // ← Usar valor del store con fallback
                hour={selectedHour || 4}
                dataType={dataType}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <PriceDistributionChart
                timestamp={getHeatmapTimestamp()}
                market={market}
                dataType={dataType}
              />
            </Grid>
            {selectedNode2 && (
              <Grid size={{ xs: 12 }}>
                <CongestionChart
                  node1Id={selectedNode1}
                  node2Id={selectedNode2}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  </Box>
</Box>
  );
};

export default Dashboard;
