import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  List,
  ListItem,
  Divider,
  Avatar,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Brightness1Icon from '@mui/icons-material/Brightness1';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4d75f4',
    },
    secondary: {
      main: '#f6bc66',
    },
    success: {
      main: '#84c887',
    },
    error: {
      main: '#f67d74',
    },
    info: {
      main: '#50c1e9',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 10,
        },
      },
    },
  },
});

const Calendar = () => {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 27)); // June 27, 2025
  const [selectedDay, setSelectedDay] = useState(27);

  const events = [
    {
      id: 1,
      title: 'Workout',
      start: '08:00',
      end: '08:40',
      startDate: new Date(2025, 5, 26),
      endDate: new Date(2025, 5, 26),
      color: 'error',
    },
    {
      id: 2,
      title: 'Workout',
      start: '08:00',
      end: '08:40',
      startDate: new Date(2025, 5, 28),
      endDate: new Date(2025, 5, 28),
      color: 'error',
    },
    {
      id: 3,
      title: 'Brunch with Alex and the design team',
      start: '09:00',
      end: '10:30',
      startDate: new Date(2025, 5, 27),
      endDate: new Date(2025, 5, 27),
      color: 'secondary',
    },
    {
      id: 4,
      title: 'Team Leaders end of month review & lunch',
      start: '10:00',
      end: '13:00',
      startDate: new Date(2025, 5, 26),
      endDate: new Date(2025, 5, 26),
      color: 'success',
    },
    {
      id: 5,
      title: 'Weekly Meeting',
      start: '10:00',
      end: '10:50',
      startDate: new Date(2025, 5, 28),
      endDate: new Date(2025, 5, 28),
      color: 'success',
    },
    {
      id: 6,
      title: 'Roadmap Planning',
      start: '11:00',
      end: '13:00',
      startDate: new Date(2025, 5, 27),
      endDate: new Date(2025, 5, 29),
      color: 'secondary',
    },
    {
      id: 7,
      title: 'Meet up with Hannah',
      start: '11:00',
      end: '13:00',
      startDate: new Date(2025, 5, 29),
      endDate: new Date(2025, 5, 29),
      color: 'info',
    },
    {
      id: 8,
      title: 'Lunch with Steve',
      start: '12:30',
      end: '13:50',
      startDate: new Date(2025, 5, 28),
      endDate: new Date(2025, 5, 28),
      color: 'info',
    },
    {
      id: 9,
      title: '30 Minute Code Review',
      start: '14:00',
      end: '14:30',
      startDate: new Date(2025, 5, 27),
      endDate: new Date(2025, 5, 27),
      color: 'success',
    },
    {
      id: 10,
      title: 'Company Party',
      start: '18:00',
      end: '22:00',
      startDate: new Date(2025, 5, 27),
      endDate: new Date(2025, 5, 27),
      color: 'primary',
      allDay: true,
    },
  ];

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekdaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getDaysBetween = (startDate, endDate) => {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const navigatePrevious = () => {
    const prevDate = new Date(currentDate);
    if (view === 'day') {
      prevDate.setDate(prevDate.getDate() - 1);
    } else if (view === 'week') {
      prevDate.setDate(prevDate.getDate() - 7);
    } else if (view === 'month') {
      prevDate.setMonth(prevDate.getMonth() - 1);
    }
    setCurrentDate(prevDate);
  };

  const navigateNext = () => {
    const nextDate = new Date(currentDate);
    if (view === 'day') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (view === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (view === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const getWeekDates = () => {
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentDate);
    monday.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date,
        day: date.getDate(),
        weekday: weekdays[i],
        weekdayShort: weekdaysShort[i],
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, currentDate),
      };
    });
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
        isSelected: i === selectedDay,
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

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const renderHeader = () => {
    const weekDates = getWeekDates();
    const startDate = weekDates[0].day;
    const endDate = weekDates[weekDates.length - 1].day;
    const monthName = months[currentDate.getMonth()];

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: 'white', borderBottom: '1px solid #eaeaea' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500, mr: 2 }}>
            {view === 'week' ? `${monthName} ${startDate} - ${endDate}` : view === 'day' ? `${monthName} ${currentDate.getDate()}` : `${monthName} ${currentDate.getFullYear()}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={navigatePrevious}>
              <ChevronLeftIcon />
            </IconButton>
            <Button variant="text" size="small" onClick={navigateToday} sx={{ textTransform: 'none' }}>
              TODAY
            </Button>
            <IconButton size="small" onClick={navigateNext}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', backgroundColor: '#f5f5f5', borderRadius: '8px', mr: 2 }}>
            <Button variant={view === 'day' ? 'contained' : 'text'} disableElevation onClick={() => setView('day')} sx={{ minWidth: '40px', borderRadius: '8px', color: view === 'day' ? 'white' : 'text.secondary' }}>
              Day
            </Button>
            <Button variant={view === 'week' ? 'contained' : 'text'} disableElevation onClick={() => setView('week')} sx={{ minWidth: '40px', borderRadius: '8px', color: view === 'week' ? 'white' : 'text.secondary' }}>
              Week
            </Button>
            <Button variant={view === 'month' ? 'contained' : 'text'} disableElevation onClick={() => setView('month')} sx={{ minWidth: '40px', borderRadius: '8px', color: view === 'month' ? 'white' : 'text.secondary' }}>
              Month
            </Button>
          </Box>

          <IconButton color="primary" sx={{ backgroundColor: theme.palette.primary.main, color: 'white', '&:hover': { backgroundColor: theme.palette.primary.dark } }}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const hourHeight = 60;

    const allDayEvents = events.filter(event => event.allDay);
    const regularEvents = events.filter(event => !event.allDay);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
        {allDayEvents.length > 0 && (
          <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', pl: '50px' }}>
            <Box sx={{ width: '50px', p: 1, fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem', position: 'absolute', left: 0 }}>
              ALL DAY
            </Box>
            {weekDates.map((day, i) => (
              <Box key={i} sx={{ flex: 1, position: 'relative', height: '40px', borderRight: i < weekDates.length - 1 ? '1px solid #eaeaea' : 'none' }}>
                {allDayEvents.filter(event => isSameDay(event.startDate, day.date)).map(event => (
                  <Box key={event.id} sx={{ position: 'absolute', top: '5px', left: '5px', right: '5px', height: '30px', backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main, borderRadius: '4px', padding: '4px 8px', color: 'white', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <Brightness1Icon sx={{ fontSize: '8px', mr: 1 }} />
                    {event.title}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', pl: '50px' }}>
          {weekDates.map((day, i) => (
            <Box key={i} sx={{ flex: 1, p: 1, textAlign: 'center', borderRight: i < weekDates.length - 1 ? '1px solid #eaeaea' : 'none', backgroundColor: day.isSelected ? '#f0f7ff' : 'transparent', cursor: 'pointer' }} onClick={() => { setCurrentDate(day.date); setSelectedDay(day.day); }}>
              <Typography variant="body2" sx={{ fontWeight: day.isToday ? 'bold' : 'normal', color: day.isToday ? 'primary.main' : 'text.secondary', textTransform: 'uppercase' }}>
                {day.weekdayShort}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'medium', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: '50%', backgroundColor: day.isToday ? 'primary.main' : 'transparent', color: day.isToday ? 'white' : 'inherit' }}>
                {day.day}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          <Box sx={{ width: '50px', flexShrink: 0, borderRight: '1px solid #eaeaea' }}>
            {hours.map((hour, i) => (
              <Box key={i} sx={{ height: `${hourHeight}px`, borderBottom: '1px solid #eaeaea', padding: '4px', color: 'text.secondary', fontSize: '0.75rem', textAlign: 'right', pr: 1 }}>
                {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? ' AM' : ' PM'}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {weekDates.map((day, dayIndex) => {
              const dayEvents = regularEvents
                .filter(event => {
                  const eventStart = new Date(event.startDate);
                  const eventEnd = new Date(event.endDate);
                  return eventStart <= day.date && eventEnd >= addDays(day.date, -dayIndex) && eventStart >= addDays(day.date, -dayIndex);
                })
                .sort((a, b) => {
                  const startA = parseInt(a.start.split(':')[0]) * 60 + parseInt(a.start.split(':')[1]);
                  const startB = parseInt(b.start.split(':')[0]) * 60 + parseInt(b.start.split(':')[1]);
                  return startA - startB;
                });

              return (
                <Box key={dayIndex} sx={{ flex: 1, position: 'relative', borderRight: dayIndex < weekDates.length - 1 ? '1px solid #eaeaea' : 'none', backgroundColor: day.isSelected ? '#f0f7ff' : 'transparent' }}>
                  {hours.map((hour, i) => (
                    <Box key={i} sx={{ height: `${hourHeight}px`, borderBottom: '1px solid #eaeaea' }} />
                  ))}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, p: 1 }}>
                    {dayEvents.map((event, eventIndex) => {
                      const eventStart = new Date(event.startDate);
                      const spanDays = getDaysBetween(eventStart, event.endDate);
                      const leftOffset = weekDates.findIndex(d => isSameDay(d.date, eventStart));
                      const width = spanDays * 100;

                      return (
                        <Box key={event.id} sx={{ position: 'relative', left: `${leftOffset * 100}%`, width: `${width}%`, mb: 1, borderRadius: '4px', padding: '8px', backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main, color: 'white', opacity: 0.9, '&:hover': { opacity: 1 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{event.title}</Typography>
                          <Typography variant="caption">{event.start} - {event.end}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderDayView = () => {
    const hourHeight = 60;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', pl: '50px' }}>
          <Box sx={{ flex: 1, p: 1, textAlign: 'center', backgroundColor: '#f0f7ff' }}>
            <Typography variant="body2" sx={{ fontWeight: isSameDay(currentDate, new Date()) ? 'bold' : 'normal', color: isSameDay(currentDate, new Date()) ? 'primary.main' : 'text.secondary', textTransform: 'uppercase' }}>
              {weekdaysShort[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'medium', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: '50%', backgroundColor: isSameDay(currentDate, new Date()) ? 'primary.main' : 'transparent', color: isSameDay(currentDate, new Date()) ? 'white' : 'inherit' }}>
              {currentDate.getDate()}
            </Typography>
          </Box>
        </Box>

        {events.filter(event => event.allDay && isSameDay(event.startDate, currentDate)).length > 0 && (
          <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', pl: '50px' }}>
            <Box sx={{ width: '50px', p: 1, fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem', position: 'absolute', left: 0 }}>
              ALL DAY
            </Box>
            <Box sx={{ flex: 1, position: 'relative', height: '40px' }}>
              {events.filter(event => event.allDay && isSameDay(event.startDate, currentDate)).map(event => (
                <Box key={event.id} sx={{ position: 'absolute', top: '5px', left: '5px', right: '5px', height: '30px', backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main, borderRadius: '4px', padding: '4px 8px', color: 'white', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                  <Brightness1Icon sx={{ fontSize: '8px', mr: 1 }} />
                  {event.title}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          <Box sx={{ width: '50px', flexShrink: 0, borderRight: '1px solid #eaeaea' }}>
            {hours.map((hour, i) => (
              <Box key={i} sx={{ height: `${hourHeight}px`, borderBottom: '1px solid #eaeaea', padding: '4px', color: 'text.secondary', fontSize: '0.75rem', textAlign: 'right', pr: 1 }}>
                {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? ' AM' : ' PM'}
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1, position: 'relative', backgroundColor: '#f0f7ff' }}>
            {hours.map((hour, i) => (
              <Box key={i} sx={{ height: `${hourHeight}px`, borderBottom: '1px solid #eaeaea' }} />
            ))}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, p: 1 }}>
              {events
                .filter(event => !event.allDay && isSameDay(event.startDate, currentDate))
                .sort((a, b) => {
                  const startA = parseInt(a.start.split(':')[0]) * 60 + parseInt(a.start.split(':')[1]);
                  const startB = parseInt(b.start.split(':')[0]) * 60 + parseInt(b.start.split(':')[1]);
                  return startA - startB;
                })
                .map((event, eventIndex) => (
                  <Box key={event.id} sx={{ position: 'relative', mb: 1, borderRadius: '4px', padding: '8px', backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main, color: 'white', opacity: 0.9, '&:hover': { opacity: 1 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{event.title}</Typography>
                    <Typography variant="caption">{event.start} - {event.end}</Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderMonthView = () => {
    const monthDates = getMonthDates();

    return (
      <Box sx={{ height: 'calc(100vh - 100px)', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', backgroundColor: '#f5f5f5' }}>
          {weekdaysShort.map((day, i) => (
            <Box key={i} sx={{ flex: 1, p: 1, textAlign: 'center', color: 'text.secondary', fontWeight: 'medium' }}>
              {day}
            </Box>
          ))}
        </Box>

        {monthDates.map((week, weekIndex) => (
          <Box key={weekIndex} sx={{ display: 'flex', borderBottom: weekIndex < monthDates.length - 1 ? '1px solid #eaeaea' : 'none', height: '120px' }}>
            {week.map((day, dayIndex) => (
              <Box key={dayIndex} sx={{ flex: 1, position: 'relative', borderRight: dayIndex < week.length - 1 ? '1px solid #eaeaea' : 'none', backgroundColor: day.isSelected ? '#f0f7ff' : 'transparent', opacity: day.isCurrentMonth ? 1 : 0.4, cursor: 'pointer', overflow: 'hidden', '&:hover': { backgroundColor: day.isCurrentMonth ? '#f5f5f5' : 'transparent' } }} onClick={() => { if (day.isCurrentMonth) { setCurrentDate(day.date); setSelectedDay(day.day); } }}>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: day.isToday ? 'primary.main' : 'transparent', color: day.isToday ? 'white' : day.isSelected ? 'primary.main' : 'inherit', fontWeight: day.isToday || day.isSelected ? 'bold' : 'normal' }}>
                    {day.day}
                  </Typography>
                </Box>
                <Box sx={{ px: 1 }}>
                  {events.filter(event => isSameDay(event.startDate, day.date)).map(event => (
                    <Box key={event.id} sx={{ mb: 0.5, borderRadius: '4px', padding: '4px', backgroundColor: theme.palette[event.color]?.main || theme.palette.primary.main, color: 'white', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.allDay ? <Brightness1Icon sx={{ fontSize: '8px', mr: 1, verticalAlign: 'middle' }} /> : null}
                      {event.title}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
        {renderHeader()}
        {view === 'day' ? renderDayView() : view === 'week' ? renderWeekView() : renderMonthView()}
      </Box>
    </ThemeProvider>
  );
};

export default Calendar;