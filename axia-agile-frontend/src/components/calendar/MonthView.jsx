import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';

const MonthView = ({ currentDate, selectedDay, setCurrentDate, setSelectedDay, events, handleOpenTaskPopover, weekdaysShort, theme }) => {
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
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

  const isStartDate = (date, startDate) => {
    if (!startDate) return false;
    const start = new Date(startDate);
    const checkDate = new Date(date);
    start.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === start.getTime();
  };

  const isEndDate = (date, endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const checkDate = new Date(date);
    end.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === end.getTime();
  };

  const getMonthDates = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const result = [];
    let currentWeek = [];
    const prevMonth = new Date(currentDate);
    prevMonth.setDate(0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      currentWeek.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i),
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      currentWeek.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: i === selectedDay && date.getMonth() === currentDate.getMonth(),
      });
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      let dayCounter = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayCounter),
          day: dayCounter++,
          isCurrentMonth: false,
          isToday: false,
        });
      }
      result.push(currentWeek);
    }
    return result;
  };

  const monthDates = getMonthDates();

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
        {weekdaysShort.map((day, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              p: 1,
              textAlign: 'center',
              color: 'text.secondary',
              fontWeight: 'medium',
              fontSize: '0.85rem',
            }}
          >
            {day}
          </Box>
        ))}
      </Box>
      {monthDates.map((week, weekIndex) => (
        <Box
          key={weekIndex}
          sx={{
            display: 'flex',
            borderBottom: weekIndex < monthDates.length - 1 ? '1px solid #eaeaea' : 'none',
          }}
        >
          {week.map((day, dayIndex) => (
            <Box
              key={dayIndex}
              sx={{
                flex: 1,
                position: 'relative',
                borderRight: dayIndex < week.length - 1 ? '1px solid #eaeaea' : 'none',
                backgroundColor: day.isSelected ? '#f0f7ff' : day.isToday ? '#fafeff' : 'transparent',
                opacity: day.isCurrentMonth ? 1 : 0.4,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: day.isCurrentMonth ? '#f5f9ff' : 'transparent' },
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={() => {
                if (day.isCurrentMonth) {
                  setCurrentDate(new Date(day.date));
                  setSelectedDay(day.day);
                }
              }}
            >
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: day.isToday ? 'primary.main' : 'transparent',
                    color: day.isToday ? 'white' : day.isSelected ? 'primary.main' : 'inherit',
                    fontWeight: day.isToday || day.isSelected ? 'default' : 'normal',
                  }}
                >
                  {day.day}
                </Typography>
              </Box>
              <Box sx={{ px: 1, pb: 1, flexGrow: 1 }}>
                {events
                  .filter((event) => isDateInRange(day.date, event.startDate, event.endDate))
                  .map((event) => {
                    const isStart = isStartDate(day.date, event.startDate);
                    const isEnd = isEndDate(day.date, event.endDate);
                    return (
                      <Box
                        key={event.id}
                        sx={{
                          mb: 0.5,
                          borderRadius: '4px',
                          padding: '3px 6px',
                          backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main,
                          color: 'white',
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          borderLeft: isStart ? `3px solid ${theme.palette.background.paper}` : 'none',
                          borderRight: isEnd ? `3px solid ${theme.palette.background.paper}` : 'none',
                          cursor: 'pointer',
                          opacity: event.status === 'COMPLETED' ? 0.7 : 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTaskPopover({ anchorEl: e.currentTarget, task: event });
                        }}
                      >
                        <TaskIcon sx={{ fontSize: '12px', mr: 0.5 }} />
                        <Typography variant="caption" noWrap>{event.title}</Typography>
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  );
};

export default MonthView;