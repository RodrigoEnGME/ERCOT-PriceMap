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
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Button,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ViewListIcon from '@mui/icons-material/ViewList';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { data, useNavigate } from 'react-router-dom';
import { useAuthStore, useFilterStore } from '../../store';
import FilterPanel from '../../components/FilterPanel';
import PriceHeatmap from '../../components/PriceHeatmap';
import PriceEvolutionChart from '../../components/PriceEvolutionChart';
import PriceDistributionChart from '../../components/PriceDistributionChart';
import CongestionChart from '../../components/CongestionChart';
import { priceService } from '../../services/priceService';
import { AggregatedStats, DataType } from '../../types';
import AreaStatusIndicator from '../../components/AreaStatusIndicator';

const START_URL = import.meta.env.VITE_START_URL || '';
const DRAWER_WIDTH = 280;

type ViewMode = 'list' | 'grid';

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
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showDetailedMap, setShowDetailedMap] = useState(false);

  useEffect(() => {
    const checkReady = () => {
      if (selectedYear && selectedMonth && market && dataType) {
        console.log('Dashboard ready with:', { selectedYear, selectedMonth, market, dataType });
        setIsReady(true);
        loadStats();
      }
    };
    const timer = setTimeout(checkReady, 300);
    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth, market, dataType]);

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

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getHeatmapTimestamp = (): string => {
    const year = selectedYear || new Date().getFullYear();
    const month = (selectedMonth || 1) - 1;
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
    
    const start = new Date(selectedYear, 0, 1, 0, 0, 0);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const dateRange = getDateRange();
  const yearRange = getYearRange();

  const getSubtitle = () => {
    switch (dataType) {
      case DataType.PRICE:
        return 'LMPs monthly average of all ERCOT settlements points located within the geographic area of each grid cell';
      case DataType.SOLAR_CAPTURE:
        return 'Energy Selling prices, monthly average, for solar generators located within the geographic area of each grid cell';
      case DataType.WIND_CAPTURE:
        return 'Energy Selling prices, monthly average, for wind generators located within the geographic area of each grid cell';
      case DataType.NEGATIVE_HOURS:
        return 'Number of negative LMPs, monthly average, for all ERCOT settlements nodes located within the geographic area of the grid cell';
      case DataType.NODES:
        return 'Number that identifies each grid cell, including Hub Prices, LZ prices and Reserves prices';
    }
  };

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex' }}>
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
        
        <FilterPanel />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: 8,
            ml: { xs: 0, sm: `${DRAWER_WIDTH}px` },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Dashboard...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Vista tipo lista (original)
  const renderListView = () => (
    <>
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
      }}>
        <Typography variant="h6" gutterBottom>
          Grid Cell Price Heatmap
        </Typography>
        <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
          {getSubtitle()}
        </Typography>
        
        <PriceHeatmap 
          key={`${getHeatmapTimestamp()}-${market}-${dataType}`} 
          timestamp={getHeatmapTimestamp()} 
          market={market} 
          dataType={dataType} 
          showDetailedMap={showDetailedMap}
        />
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Detailed Map View:
            </Typography>
            <Button
              variant={!showDetailedMap ? "contained" : "outlined"}
              onClick={() => setShowDetailedMap(false)}
              // fullWidth
              sx={{
                textTransform: 'none',
                fontSize: '0.85rem',
                py: 1
              }}
            >
              Plain
            </Button>
            <Button
              variant={showDetailedMap ? "contained" : "outlined"}
              onClick={() => setShowDetailedMap(true)}
              // fullWidth
              sx={{
                textTransform: 'none',
                fontSize: '0.85rem',
                py: 1
              }}
            >
              Detailed
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <AreaStatusIndicator 
          timestamp={getHeatmapTimestamp()} 
          market={market} 
          dataType={dataType} 
        />
      </Box>

      <Grid container spacing={2}>
        {selectedNode1 && selectedYear && (dataType!==DataType.NODES) &&(
          <>
            <Grid size={{ xs: 12 }}>
              <PriceEvolutionChart
                nodeId={selectedNode1}
                year={selectedYear}
                day={selectedDay || 1}
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
            {selectedNode2 && (dataType===DataType.PRICE || dataType===DataType.SOLAR_CAPTURE || dataType===DataType.WIND_CAPTURE) && (
              <Grid size={{ xs: 12 }}>
                <CongestionChart
                  node1Id={selectedNode1}
                  node2Id={selectedNode2}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  dataType={dataType}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </>
  );

  // Vista tipo grid (nueva - inspirada en las imágenes)
  const renderGridView = () => (
    <>
      {/* Metric Cards superiores */}
      {/* <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', bgcolor: 'primary.dark' }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Avg System Price
              </Typography>
              <Typography variant="h4" color="white">
                {stats?.avg_price ? `$${stats.avg_price.toFixed(2)}/MWh` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', bgcolor: 'info.dark' }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Max Price
              </Typography>
              <Typography variant="h4" color="white">
                {stats?.max_price ? `$${stats.max_price.toFixed(2)}/MWh` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', bgcolor: 'success.dark' }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Min Price
              </Typography>
              <Typography variant="h4" color="white">
                {stats?.min_price ? `$${stats.min_price.toFixed(2)}/MWh` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', bgcolor: 'warning.dark' }}>
            <CardContent>
              <Typography variant="body2" color="grey.400" gutterBottom>
                Selected Grid Cell
              </Typography>
              <Typography variant="h5" color="white">
                #{selectedNode1 || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Status Indicators */}
      <Box sx={{ mb: 3 }}>
        <AreaStatusIndicator 
          timestamp={getHeatmapTimestamp()} 
          market={market} 
          dataType={dataType} 
        />
      </Box>

      {/* Grid de 2 columnas */}
      <Grid container spacing={2}>
        {/* Columna izquierda - Mapa */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Grid Cell Price Heatmap
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <PriceHeatmap 
                key={`${getHeatmapTimestamp()}-${market}-${dataType}`} 
                timestamp={getHeatmapTimestamp()} 
                market={market} 
                dataType={dataType} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Columna derecha - Evolution Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {selectedNode1 && selectedYear && (
            <Box sx={{ height: '500px' }}>
              <PriceEvolutionChart
                nodeId={selectedNode1}
                year={selectedYear}
                day={selectedDay || 1}
                hour={selectedHour || 4}
                dataType={dataType}
              />
            </Box>
          )}
        </Grid>

        {/* Fila inferior - Distribution y Congestion */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {selectedNode1 && selectedYear && (
            <PriceDistributionChart
              timestamp={getHeatmapTimestamp()}
              market={market}
              dataType={dataType}
            />
          )}
        </Grid>

        {selectedNode2 && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <CongestionChart
              node1Id={selectedNode1 ? selectedNode1 : selectedNode1!}
              node2Id={selectedNode2}
              startDate={dateRange.start}
              endDate={dateRange.end}
              dataType={dataType}
            />
          </Grid>
        )}
      </Grid>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ERCOT Pricing Dashboard
          </Typography>
          
          {/* View Mode Toggle */}
          {/* <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon sx={{ mr: 0.5 }} fontSize="small" />
              <Typography variant="body2">List</Typography>
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
              <Typography variant="body2">Overview</Typography>
            </ToggleButton>
          </ToggleButtonGroup> */}

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
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: viewMode === 'grid' ? '1600px' : '1400px',
            px: 3,
            py: 2,
          }}
        >
          {renderListView()}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;