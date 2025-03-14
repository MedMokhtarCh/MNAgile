import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, LinearProgress, Button, Typography, Box, Grid } from '@mui/material';
import { FaRegClock, FaCheckCircle, FaRegDotCircle } from 'react-icons/fa'; 


const calculateTimeLeft = (endDate) => {
  const now = new Date();
  const tunisianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Tunis' }));
  const timeDifference = new Date(endDate) - tunisianTime;
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
};

const ActiveSprintPage = () => {
  const [sprint] = useState({
    name: "Sprint 1",
    startDate: "2024-02-20T00:00:00",
    endDate: "2024-03-05T00:00:00",
    tasks: [
      { id: 1, title: "Tâche 1", completed: true },
      { id: 2, title: "Tâche 2", completed: false },
      { id: 3, title: "Tâche 3", completed: false },
      { id: 4, title: "Tâche 4", completed: true }
    ],
    meetings: [
      { id: 1, date: "2024-02-21", title: "Réunion de lancement", status: "in-progress" },
      { id: 2, date: "2024-02-23", title: "Réunion de suivi", status: "completed" }
    ]
  });

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(sprint.endDate));

  // Mise à jour du temps restant toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(sprint.endDate));
    }, 60000);
    return () => clearInterval(timer);
  }, [sprint.endDate]);

  const completedTasks = sprint.tasks.filter(task => task.completed).length;
  const totalTasks = sprint.tasks.length;
  const progress = (completedTasks / totalTasks) * 100;

  const ongoingMeetings = sprint.meetings.filter(meeting => meeting.status === 'in-progress');
  const completedMeetings = sprint.meetings.filter(meeting => meeting.status === 'completed');
  const ongoingTasks = sprint.tasks.filter(task => !task.completed);
  const completedTasksList = sprint.tasks.filter(task => task.completed);

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f4f4f4' }}>
      <Grid container spacing={4}>
        {/* Card du sprint actif */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{
            backgroundColor: '#42A5F5', // Bleu clair
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
          }}>
            <CardHeader 
              title={`Sprint Actif: ${sprint.name}`} 
              subheader={`Durée: ${sprint.startDate} - ${sprint.endDate}`} 
              sx={{ color: 'white' }}
            />
            <CardContent>
              {/* Compte à rebours */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FaRegClock size={20} color="#ffeb3b" />
                <Typography variant="body1" sx={{ color: '#ffeb3b' }}>
                  Temps restant: {timeLeft.hours}h {timeLeft.minutes}m
                </Typography>
              </Box>

              {/* Barre de progression des tâches */}
              <Box sx={{ marginTop: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Progrès des tâches:</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ marginTop: 2, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" sx={{ marginTop: 2, color: 'white' }}>
                  {completedTasks} sur {totalTasks} tâches complétées
                </Typography>
              </Box>

              {/* Réunions en cours et terminées */}
              <Box sx={{ marginTop: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Réunions:</Typography>
                {ongoingMeetings.map(meeting => (
                  <Box key={meeting.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                    <FaRegDotCircle color="orange" size={20} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {meeting.title} - {meeting.date} (En cours)
                    </Typography>
                  </Box>
                ))}
                {completedMeetings.map(meeting => (
                  <Box key={meeting.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                    <FaCheckCircle color="green" size={20} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {meeting.title} - {meeting.date} (Terminée)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card pour afficher les tâches */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{
            backgroundColor: '#42A5F5', // Bleu clair
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
          }}>
            <CardHeader title="Tâches en cours" sx={{ color: 'white' }} />
            <CardContent>
              {ongoingTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'white' }}>Aucune tâche en cours</Typography>
              ) : (
                ongoingTasks.map(task => (
                  <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                    <FaRegDotCircle color="orange" size={20} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {task.title}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Card pour afficher les tâches terminées */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{
            backgroundColor: '#42A5F5', // Bleu clair
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
          }}>
            <CardHeader title="Tâches terminées" sx={{ color: 'white' }} />
            <CardContent>
              {completedTasksList.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'white' }}>Aucune tâche terminée</Typography>
              ) : (
                completedTasksList.map(task => (
                  <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                    <FaCheckCircle color="green" size={20} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {task.title}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActiveSprintPage;
