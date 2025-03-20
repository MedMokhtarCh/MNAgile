import React, { useState } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 24)); 

  const events = [
    { 
      id: 1, 
      title: 'Sprint Planning', 
      start: '08:00', 
      end: '09:00', 
      date: new Date(2025, 1, 22),
      type: 'primary'
    },
    { 
      id: 2, 
      title: 'Review', 
      start: '09:00', 
      end: '10:00', 
      date: new Date(2025, 1, 23),
      type: 'primary'
    },
    { 
      id: 3, 
      title: 'Daily Scrum',
      start: '09:00', 
      end: '09:30', 
      date: new Date(2025, 1, 22),
      type: 'primary'
    },
    { 
      id: 4, 
      title: 'New Employee Welcome Lunch', 
      start: '11:00', 
      end: '12:00', 
      date: new Date(2025, 1, 22),
      type: 'secondary'
    }
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', { 
      weekday: 'short', 
      day: 'numeric' 
    }).format(date);
  };

 
  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const navigatePrevious = () => {
    switch(view) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, -7));
        break;
      case 'month':
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentDate(prevMonth);
        break;
      case 'year':
        const prevYear = new Date(currentDate);
        prevYear.setFullYear(prevYear.getFullYear() - 1);
        setCurrentDate(prevYear);
        break;
    }
  };

  const navigateNext = () => {
    switch(view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentDate(nextMonth);
        break;
      case 'year':
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setCurrentDate(nextYear);
        break;
    }
  };


  const generateViewData = () => {
    switch(view) {
      case 'day':
        return {
          days: [currentDate],
          hours: Array.from({ length: 12 }, (_, i) => i + 7)
        };
      
      case 'week':
        
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        
        return {
          days: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
          hours: Array.from({ length: 12 }, (_, i) => i + 7)
        };
      
      case 'month':
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Générer toutes les dates du mois
        return {
          days: Array.from({ length: 35 }, (_, i) => {
            if (i < firstDay) {
              return addDays(monthStart, i - firstDay);
            }
            if (i >= firstDay && i < firstDay + daysInMonth) {
              return addDays(monthStart, i - firstDay);
            }
            return addDays(monthStart, i - firstDay);
          })
        };

      case 'year':
        return {
          months: Array.from({ length: 12 }, (_, i) => 
            new Date(currentDate.getFullYear(), i, 1)
          )
        };
    }
  };

  const viewData = generateViewData();

  const renderHeader = () => {
    let title = '';
    switch(view) {
      case 'day':
        title = formatDate(currentDate);
        break;
      case 'week':
        const weekStart = formatDate(viewData.days[0]);
        const weekEnd = formatDate(viewData.days[6]);
        title = `${weekStart} - ${weekEnd}`;
        break;
      case 'month':
        title = new Intl.DateTimeFormat('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        }).format(currentDate);
        break;
      case 'year':
        title = currentDate.getFullYear().toString();
        break;
    }

    return (
      <div className="calendar-header">
        <div className="navigation">
          <button className="nav-button" onClick={navigatePrevious}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2>{title}</h2>
          <button className="nav-button" onClick={navigateNext}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="view-controls">
          <button 
            className={`view-button ${view === 'day' ? 'active' : ''}`} 
            onClick={() => setView('day')}
          >
            Day
          </button>
          <button 
            className={`view-button ${view === 'week' ? 'active' : ''}`} 
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button 
            className={`view-button ${view === 'month' ? 'active' : ''}`} 
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={`view-button ${view === 'year' ? 'active' : ''}`} 
            onClick={() => setView('year')}
          >
            Year
          </button>
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="calendar-grid">
      <div className="time-column">
        {viewData.hours.map(hour => (
          <div key={hour} className="time-slot">
            {`${hour}:00`}
          </div>
        ))}
      </div>

      <div className="days-grid day-view">
        <div className="days-header">
          <div className="day-header">
            <span className="day-name">{formatDate(currentDate)}</span>
          </div>
        </div>

        <div className="day-column">
          {viewData.hours.map(hour => (
            <div key={hour} className="hour-slot" />
          ))}
          
          {events
            .filter(event => isSameDay(event.date, currentDate))
            .map(event => (
              <div
                key={event.id}
                className={`event ${event.type}`}
                style={{
                  top: `${(parseInt(event.start.split(':')[0]) - 7) * 60 + parseInt(event.start.split(':')[1])}px`,
                  height: `${(parseInt(event.end.split(':')[0]) - parseInt(event.start.split(':')[0])) * 60 + (parseInt(event.end.split(':')[1]) - parseInt(event.start.split(':')[1]))}px`
                }}
              >
                <div className="event-title">{event.title}</div>
                <div className="event-time">
                  {event.start} - {event.end}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="calendar-grid">
      <div className="time-column">
        {viewData.hours.map(hour => (
          <div key={hour} className="time-slot">
            {`${hour}:00`}
          </div>
        ))}
      </div>

      <div className="days-grid">
        <div className="days-header">
          {viewData.days.map(day => (
            <div key={day.getTime()} className="day-header">
              <span className="day-name">
                {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}
              </span>
              <span className="day-number">{day.getDate()}</span>
            </div>
          ))}
        </div>

        {viewData.days.map(day => (
          <div key={day.getTime()} className="day-column">
            {viewData.hours.map(hour => (
              <div key={hour} className="hour-slot" />
            ))}
            
            {events
              .filter(event => isSameDay(event.date, day))
              .map(event => (
                <div
                  key={event.id}
                  className={`event ${event.type}`}
                  style={{
                    top: `${(parseInt(event.start.split(':')[0]) - 7) * 60 + parseInt(event.start.split(':')[1])}px`,
                    height: `${(parseInt(event.end.split(':')[0]) - parseInt(event.start.split(':')[0])) * 60 + (parseInt(event.end.split(':')[1]) - parseInt(event.start.split(':')[1]))}px`
                  }}
                >
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">
                    {event.start} - {event.end}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="calendar-month-view">
      <div className="month-grid">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="month-header">{day}</div>
        ))}
        
        {viewData.days.map(date => (
          <div 
            key={date.getTime()} 
            className={`month-day ${isSameDay(date, currentDate) ? 'current' : ''}`}
          >
            <div className="month-day-header">{date.getDate()}</div>
            <div className="month-day-events">
              {events
                .filter(event => isSameDay(event.date, date))
                .map(event => (
                  <div 
                    key={event.id} 
                    className={`month-event ${event.type}`}
                    title={`${event.title} (${event.start} - ${event.end})`}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYearView = () => (
    <div className="calendar-year-view">
      <div className="year-grid">
        {viewData.months.map(month => (
          <div key={month.getTime()} className="year-month">
            <div className="year-month-header">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(month)}
            </div>
            <div className="year-month-days">
              {Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1).map(day => (
                <div 
                  key={day}
                  className={`year-day ${
                    events.some(event => 
                      event.date.getMonth() === month.getMonth() && 
                      event.date.getDate() === day
                    ) ? 'has-events' : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderView = () => {
    switch(view) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'year':
        return renderYearView();
      default:
        return renderWeekView();
    }
  };

  return (
    <div className="calendar">
      {renderHeader()}
      {renderView()}
    </div>
  );
};

export default Calendar;