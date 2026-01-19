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
    navigate('/login', { replace: true });
  };

  // Generate timestamp for heatmap (hora completa sin minutos/segundos)
  const getHeatmapTimestamp = (): string => {
    let date: Date;
    
    if (selectedDate) {
      date = new Date(selectedDate);
    } else {
      const now = new Date();
      date = new Date(
        selectedYear || now.getFullYear(),
        (selectedMonth || now.getMonth() + 1) - 1,
        selectedDay || now.getDate(),
        selectedHour ?? now.getHours()
      );
    }
    
    // Truncar a hora completa (eliminar minutos, segundos, milisegundos)
    date.setMinutes(0, 0, 0);
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

      {/* Main Content - Sin margen izquierdo para el mapa */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          width: '100%',
        }}
      >
        {/* Price Heatmap - Ancho completo empezando después del FilterPanel */}
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          width: 'calc(100% - 20px)', // Restar el ancho del FilterPanel
          ml: '20px', // Margen izquierdo = ancho del FilterPanel
          borderRadius: 0,
          boxSizing: 'border-box'
        }}>
          <Typography variant="h6" gutterBottom>
            Nodal Price Heatmap
          </Typography>
          <PriceHeatmap timestamp={getHeatmapTimestamp()} market={market} />
        </Paper>

        {/* Area Status Indicator */}
        <Box sx={{ p: 3, ml: '20px' }}>
          <AreaStatusIndicator timestamp={getHeatmapTimestamp()} market={market} />
        </Box>

        {/* Contenedor con padding para el resto del contenido */}
        <Box sx={{ p: 3, ml: '20px' }}>
          {/* Stats Cards */}
          {/* {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Average
                    </Typography>
                    <Typography variant="h5">
                      ${stats.avg?.toFixed(2) || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Maximum
                    </Typography>
                    <Typography variant="h5">
                      ${stats.max?.toFixed(2) || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Minimum
                    </Typography>
                    <Typography variant="h5">
                      ${stats.min?.toFixed(2) || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Data Points
                    </Typography>
                    <Typography variant="h5">{stats.count}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )} */}

          {/* Charts Grid */}
          <Grid container spacing={3}>
          {selectedNode1 && selectedYear && selectedDay !== undefined && selectedHour !== undefined && (
            <>
              <Grid size={{ xs: 12, lg: 6 }}>
                <PriceEvolutionChart
                  nodeId={selectedNode1}
                  year={selectedYear}
                  day={selectedDay}
                  hour={selectedHour}
                  dataType={dataType}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <PriceDistributionChart
                  timestamp={getHeatmapTimestamp()}
                  market={market}
                  dataType={dataType}
                />
              </Grid>
            </>
          )}

          {/* {selectedNode1 && selectedNode2 && (
            <Grid size={{ xs: 12 }}>
              <CongestionChart
                node1Id={selectedNode1}
                node2Id={selectedNode2}
                startDate={dateRange.start}
                endDate={dateRange.end}
              />
            </Grid>
          )} */}
        </Grid>
        </Box>
        {/* Fin del contenedor con padding */}
      </Box>
    </Box>
  );
};

export default Dashboard;
