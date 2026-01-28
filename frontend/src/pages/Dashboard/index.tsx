import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useFilterStore } from '../../store';
import FilterPanel from '../../components/FilterPanel';
import PriceHeatmap from '../../components/PriceHeatmap';
import PriceEvolutionChart from '../../components/PriceEvolutionChart';
import PriceDistributionChart from '../../components/PriceDistributionChart';
import CongestionChart from '../../components/CongestionChart';
import GaugeChart from '../../components/GaugeChart';
import StyleSelector from '../../components/StyleSelector';
import AreaStatusIndicator from '../../components/AreaStatusIndicator';
import { priceService } from '../../services/priceService';
import { AggregatedStats, SystemStats } from '../../types';

const START_URL = import.meta.env.VITE_START_URL || '';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { 
    selectedYear, 
    selectedMonth, 
    selectedDay, 
    selectedHour,
    selectedNode1, 
    selectedNode2, 
    dataType,
    market 
  } = useFilterStore();

  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    if (selectedNode1) {
      loadStats();
    }
    loadSystemStats();
  }, [selectedNode1, selectedYear, selectedMonth, dataType, market]);

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
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadSystemStats = async () => {
    try {
      const timestamp = getHeatmapTimestamp();
      const stats = await priceService.getSystemStats(timestamp, market);
      setSystemStats(stats);
    } catch (err) {
      console.error('Failed to load system stats', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`${START_URL}/login`, { replace: true });
  };

  const getHeatmapTimestamp = (): string => {
    const year = selectedYear || new Date().getFullYear();
    const month = (selectedMonth || 1) - 1;
    // Usar las 12:00 PM para que se vea generación solar en el dashboard por defecto
    const date = new Date(year, month, 1, 12, 0, 0, 0);
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

  const dateRange = getDateRange();

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f0f2f5', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1a237e' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            ERCOT PRICING ANALYTICS
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Filter Panel */}
      <FilterPanel />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          p: 3,
          width: { xs: '100%', sm: 'calc(100% - 280px)' },
          ml: { xs: 0, sm: '280px' },
          boxSizing: 'border-box',
        }}
      >
        {/* Style Selector (Botonera) */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <StyleSelector />
        </Box>

        {/* Top Gauges Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', height: '100%', borderRadius: 2 }}>
              <GaugeChart
                label="System Avg Price"
                value={systemStats?.avg_price || 0}
                min={0}
                max={100}
                unit="USD/MWh"
                color="#f44336"
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', height: '100%', borderRadius: 2 }}>
              <GaugeChart
                label="Total Wind Generation"
                value={systemStats?.total_wind || 0}
                min={0}
                max={20000}
                unit="MW"
                color="#00bcd4"
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', height: '100%', borderRadius: 2 }}>
              <GaugeChart
                label="Total Solar Generation"
                value={systemStats?.total_solar || 0}
                min={0}
                max={15000}
                unit="MW"
                color="#ffeb3b"
              />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Left Column - Heatmap and Area Status */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                Regional Price Heatmap
              </Typography>
              <PriceHeatmap timestamp={getHeatmapTimestamp()} market={market} dataType={dataType} />
            </Paper>
            <Box sx={{ mb: 3 }}>
              <AreaStatusIndicator timestamp={getHeatmapTimestamp()} market={market} />
            </Box>
          </Grid>

          {/* Right Column - Distribution and Analytics */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                Price Distribution
              </Typography>
              <PriceDistributionChart
                timestamp={getHeatmapTimestamp()}
                market={market}
                dataType={dataType}
              />
            </Paper>

            {selectedNode1 && selectedYear && (
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <PriceEvolutionChart
                  nodeId={selectedNode1}
                  year={selectedYear}
                  day={selectedDay || 1}
                  hour={selectedHour || 0}
                  dataType={dataType}
                />
              </Paper>
            )}

            {selectedNode1 && selectedNode2 && (
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <CongestionChart
                  node1Id={selectedNode1}
                  node2Id={selectedNode2}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                />
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
