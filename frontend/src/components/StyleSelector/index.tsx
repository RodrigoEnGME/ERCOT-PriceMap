import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Typography } from '@mui/material';
import { DataType } from '../../types';
import { useFilterStore } from '../../store';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AirIcon from '@mui/icons-material/Air';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HubIcon from '@mui/icons-material/Hub';

const StyleSelector: React.FC = () => {
  const { dataType, setDataType } = useFilterStore();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newDataType: DataType | null,
  ) => {
    if (newDataType !== null) {
      setDataType(newDataType);
    }
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary' }}>
        Select Visual Style
      </Typography>
      <ToggleButtonGroup
        value={dataType}
        exclusive
        onChange={handleChange}
        aria-label="data type"
        size="small"
        color="primary"
        sx={{
          backgroundColor: 'background.paper',
          '& .MuiToggleButton-root': {
            px: 3,
            py: 1,
            display: 'flex',
            gap: 1,
          }
        }}
      >
        <ToggleButton value={DataType.PRICE} aria-label="price">
          <AttachMoneyIcon fontSize="small" />
          General
        </ToggleButton>
        <ToggleButton value={DataType.SOLAR_CAPTURE} aria-label="solar">
          <WbSunnyIcon fontSize="small" />
          Solar
        </ToggleButton>
        <ToggleButton value={DataType.WIND_CAPTURE} aria-label="wind">
          <AirIcon fontSize="small" />
          Wind
        </ToggleButton>
        <ToggleButton value={DataType.NEGATIVE_HOURS} aria-label="negative">
          <ErrorOutlineIcon fontSize="small" />
          Critical
        </ToggleButton>
        <ToggleButton value={DataType.NODES} aria-label="nodes">
          <HubIcon fontSize="small" />
          Grid
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default StyleSelector;
