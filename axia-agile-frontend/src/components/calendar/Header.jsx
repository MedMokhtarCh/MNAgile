import React from 'react';
import { Paper, Box, Typography, IconButton, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';

const Header = ({ currentDate, viewMode, setViewMode, navigateToday, navigatePrevious, navigateNext, formatDate, months }) => {
  const monthName = months[currentDate.getMonth()];
  let dateTitle = viewMode === 'month'
    ? `${monthName} ${currentDate.getFullYear()}`
    : (() => {
        const weekDates = [];
        const day = currentDate.getDay() || 7;
        const diff = currentDate.getDate() - day + 1;
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(diff);
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          weekDates.push(date);
        }
        return `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`;
      })();

  return (
    <Paper sx={{ p: 2, backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mr: 2 }}>
          {dateTitle}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={navigatePrevious} color="primary">
            <ChevronLeftIcon />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            onClick={navigateToday}
            startIcon={<TodayIcon />}
            sx={{ mx: 1 }}
          >
            Aujourd'hui
          </Button>
          <IconButton size="small" onClick={navigateNext} color="primary">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <IconButton
            size="small"
            onClick={() => setViewMode('month')}
            color={viewMode === 'month' ? 'primary' : 'default'}
            sx={{ borderRadius: '4px 0 0 4px' }}
          >
            <CalendarViewMonthIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode('week')}
            color={viewMode === 'week' ? 'primary' : 'default'}
            sx={{ borderRadius: '0 4px 4px 0' }}
          >
            <CalendarViewWeekIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default Header;