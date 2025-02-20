import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Paper } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Assessment, Task, PendingActions } from '@mui/icons-material'; // Icônes ajoutées

// Enregistrer les composants de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Data simulation
const projectsData = [
  { name: 'Projet 1', tasks: 12, members: 5 },
  { name: 'Projet 2', tasks: 20, members: 7 },
  { name: 'Projet 3', tasks: 8, members: 3 },
  { name: 'Projet 4', tasks: 15, members: 6 },
];

const scrumActiveData = [
  { name: 'Scrum 1', activeTasks: 5, totalTasks: 12 },
  { name: 'Scrum 2', activeTasks: 8, totalTasks: 20 },
  { name: 'Scrum 3', activeTasks: 3, totalTasks: 8 },
  { name: 'Scrum 4', activeTasks: 6, totalTasks: 15 },
];

const dashboardData = [
  { name: 'Projets', value: 4 },
  { name: 'Tâches', value: 55 },
  { name: 'Tâches en cours', value: 30 }, // Tâches en cours
];

const COLORS = ['#ff8042', '#0088fe', '#00c49f'];

function Dashboard() {
  const [projects, setProjects] = useState(projectsData);
  const [scrumData, setScrumData] = useState(scrumActiveData);
  const [statsData, setStatsData] = useState(dashboardData);

  useEffect(() => {
    // Simule la récupération des données (API, etc.)
    // setProjects([...]);
    // setScrumData([...]);
    // setStatsData([...]);
  }, []);

  // Configuration du graphique en barres pour les projets
  const projectChartData = {
    labels: projects.map((proj) => proj.name),
    datasets: [
      {
        label: 'Tâches',
        data: projects.map((proj) => proj.tasks),
        backgroundColor: '#8884d8',
      },
      {
        label: 'Membres',
        data: projects.map((proj) => proj.members),
        backgroundColor: '#82ca9d',
      },
    ],
  };

  // Configuration du graphique en secteurs (pie chart) pour les statistiques globales
  const pieChartData = {
    labels: statsData.map((item) => item.name),
    datasets: [
      {
        data: statsData.map((item) => item.value),
        backgroundColor: COLORS,
      },
    ],
  };

  // Configuration du graphique Scrum (bar chart)
  const scrumChartData = {
    labels: scrumData.map((scrum) => scrum.name),
    datasets: [
      {
        label: 'Tâches Actives',
        data: scrumData.map((scrum) => scrum.activeTasks),
        backgroundColor: '#ff8042',
      },
      {
        label: 'Tâches Totales',
        data: scrumData.map((scrum) => scrum.totalTasks),
        backgroundColor: '#0088fe',
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Tableau de bord</Typography>

      <Grid container spacing={3}>
        {/* Carte des Projets */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardHeader
              avatar={<Assessment sx={{ fontSize: 30, color: '#2196f3' }} />}
              title={<Typography variant="h6">Nombre de Projets</Typography>}
            />
            <CardContent>
              <Typography variant="h4">{statsData[0].value}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte des Tâches */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardHeader
              avatar={<Task sx={{ fontSize: 30, color: '#ff9800' }} />}
              title={<Typography variant="h6">Nombre de Tâches</Typography>}
            />
            <CardContent>
              <Typography variant="h4">{statsData[1].value}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte des Tâches en cours */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardHeader
              avatar={<PendingActions sx={{ fontSize: 30, color: '#8bc34a' }} />}
              title={<Typography variant="h6">Tâches en Cours</Typography>}
            />
            <CardContent>
              <Typography variant="h4">{statsData[2].value}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Diagrammes alignés en ligne */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Projets et Tâches</Typography>
              <Bar data={projectChartData} width={500} height={250} options={{ responsive: true }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Statistiques</Typography>
              <Pie data={pieChartData} width={500} height={250} options={{ responsive: true }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Tableau des Projets */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#f0f4f8' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Liste des Projets</Typography>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="projects table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom du Projet</TableCell>
                      <TableCell align="right">Nombre de Membres</TableCell>
                      <TableCell align="right">Nombre de Tâches</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.name}>
                        <TableCell component="th" scope="row">{project.name}</TableCell>
                        <TableCell align="right">{project.members}</TableCell>
                        <TableCell align="right">{project.tasks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
