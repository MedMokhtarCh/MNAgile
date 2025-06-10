import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const filterOptions = [
  {
    id: 'plan',
    label: 'Plan',
    options: [
      { value: '', label: 'Tous les plans' },
      { value: 'annual', label: 'Annuel' },
      { value: 'semiannual', label: 'Semestriel' },
      { value: 'quarterly', label: 'Trimestriel' },
      { value: 'monthly', label: 'Mensuel' },
    ],
  },
];

const SubscriptionFilters = ({ searchTerm, setSearchTerm, filterValues, setFilterValues, handleRefresh }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <TextField
        placeholder="Rechercher..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        }}
        sx={{ width: { xs: '100%', sm: '300px' } }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        {filterOptions.map((filter) => (
          <FormControl key={filter.id} size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={filterValues[filter.id]}
              label={filter.label}
              onChange={(e) => setFilterValues({ ...filterValues, [filter.id]: e.target.value })}
            >
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
        <Tooltip title="Rafraîchir">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default SubscriptionFilters;