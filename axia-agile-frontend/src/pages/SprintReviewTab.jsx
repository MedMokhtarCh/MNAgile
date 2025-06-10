
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
} from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTasks } from '../store/slices/taskSlice';
import { fetchSprints } from '../store/slices/sprintSlice';
import { getOverallMetrics, getSprintMetrics } from '../utils/sprintMetrics';
import { ScrollableContainer } from '../components/backlog/theme';
import PageTitle from '../components/common/PageTitle';
import MetricsCards from '../components/sprint-review/MetricsCards';
import SprintCard from '../components/sprint-review/SprintCard';

const SprintReviewTab = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
const {
  tasks: { tasks, status, error: reduxError },
  sprints: { sprints },

} = useSelector((state) => ({
  tasks: state.tasks,
  sprints: state.sprints,
  users: state.users,
}));
  const projectUsers = useSelector((state) => state.users?.users || []);
  
  const [sprintPage, setSprintPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const sprintsPerPage = 2;

  useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sprintsResult, tasksResult] = await Promise.all([
        dispatch(fetchSprints({ projectId: parseInt(projectId) })).unwrap(),
        dispatch(fetchAllTasks({ projectId: parseInt(projectId) })).unwrap(),
      ]);
      console.log('[loadData] Sprints fetched:', sprintsResult);
      console.log('[loadData] Tasks fetched:', tasksResult);
    } catch (err) {
      console.error('[loadData] Error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      setError(err.message || 'Erreur lors du chargement des données de révision.');
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [dispatch, projectId]);

  const handleSprintPageChange = (event, value) => {
    setSprintPage(value);
  };

  const startIndex = (sprintPage - 1) * sprintsPerPage;
  const endIndex = startIndex + sprintsPerPage;
const paginatedSprints = (sprints || []).slice(startIndex, endIndex);
const totalSprintPages = Math.ceil((sprints?.length || 0) / sprintsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || reduxError) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error || reduxError}
      </Alert>
    );
  }

  return (
    <ScrollableContainer sx={{ p: 3, minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <PageTitle>Révision des Sprints</PageTitle>
        <Typography variant="body1" color="text.secondary">
          Analyse détaillée des performances des sprints
        </Typography>
      </Box>

      <MetricsCards metrics={getOverallMetrics(sprints, tasks, projectUsers)} />

      {paginatedSprints.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <TimelineIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun sprint disponible pour la révision
          </Typography>
        </Paper>
      ) : (
        <>
          {paginatedSprints.map((sprint) => (
            <SprintCard 
              key={sprint.id} 
              sprint={sprint} 
              metrics={getSprintMetrics(sprint, tasks, projectUsers)} 
            />
          ))}
          {totalSprintPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalSprintPages}
                page={sprintPage}
                onChange={handleSprintPageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPagination-ul': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                    padding: 1,
                    boxShadow: 2,
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </ScrollableContainer>
  );
};

export default SprintReviewTab;