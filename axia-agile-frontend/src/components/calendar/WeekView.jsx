import React from 'react';
import { Paper, Box, Typography, Chip, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const WeekView = ({ currentDate, selectedDay, setCurrentDate, setSelectedDay, events, handleOpenTaskPopover, weekdaysShort, months, formatDate, theme }) => {
  const getWeekDates = () => {
    const result = [];
    const day = currentDate.getDay() || 7;
    const diff = currentDate.getDate() - day + 1;
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(diff);
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      result.push({
        date,
        day: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.getDate() === selectedDay && date.getMonth() === currentDate.getMonth(),
      });
    }
    return result;
  };

  const isDateInRange = (date, startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const checkDate = new Date(date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= start && checkDate <= end;
  };

  const weekDates = getWeekDates();

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
        <Box sx={{ width: '60px' }}></Box>
        {weekDates.map((day, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderLeft: '1px solid #eaeaea',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 'medium',
                mb: 0.5,
              }}
            >
              {weekdaysShort[i]}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: day.isToday ? 'primary.main' : day.isSelected ? '#e3f2fd' : 'transparent',
                color: day.isToday ? 'white' : day.isSelected ? 'primary.main' : 'inherit',
                fontWeight: day.isToday || day.isSelected ? 'bold' : 'normal',
                cursor: 'pointer',
                '&:hover': { backgroundColor: day.isToday ? 'primary.dark' : '#e3f2fd' },
              }}
              onClick={() => {
                setCurrentDate(new Date(day.date));
                setSelectedDay(day.day);
              }}
            >
              {day.day}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
        {weekDates.map((day, dayIndex) => (
          <Box key={dayIndex}>
            <Typography
              variant="subtitle2"
              sx={{
                p: 1,
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              }}
            >
              {day.date.getDate()} {months[day.date.getMonth()]}
            </Typography>
            <Box sx={{ p: 1 }}>
              {events
                .filter((event) => isDateInRange(day.date, event.startDate, event.endDate))
                .map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: '4px',
                      backgroundColor: `${theme.palette[event.color].light}20`,
                      borderLeft: `4px solid ${theme.palette[event.color].main}`,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: `${theme.palette[event.color].light}40` },
                      opacity: event.status === 'COMPLETED' ? 0.7 : 1,
                    }}
                    onClick={(e) => handleOpenTaskPopover({ anchorEl: e.currentTarget, task: event })}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                        {event.title}
                      </Typography>
                      <Chip
                        label={event.priority}
                        size="small"
                        color={event.color}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
                      <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                      <Typography variant="caption">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              {events.filter((event) => isDateInRange(day.date, event.startDate, event.endDate)).length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', py: 2 }}>
                  Aucune tâche pour ce jour
                </Typography>
              )}
            </Box>
            {dayIndex < weekDates.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default WeekView;