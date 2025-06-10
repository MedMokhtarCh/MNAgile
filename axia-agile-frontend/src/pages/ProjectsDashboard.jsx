import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Select, Card, Row, Col, Typography, Progress, Space } from 'antd';
import { ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import { fetchProjects } from '../store/slices/projectsSlice';
import { fetchAllTasks } from '../store/slices/taskSlice';
import { fetchBacklogs } from '../store/slices/backlogSlice';
import { fetchSprints } from '../store/slices/sprintSlice';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { styles } from '../components/projectdashboard/theme';
import CardSprints from '../components/projectdashboard/CardSprints';

dayjs.extend(isBetween);
dayjs.extend(utc);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const { Title: AntTitle, Text } = Typography;

const ProjectsDashboard = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);

  const dispatch = useDispatch();
  const { projects, status: projectsStatus, error: projectsError } = useSelector((state) => state.projects);
  const { tasks, status: tasksStatus, error: tasksError } = useSelector((state) => state.tasks);
  const { backlogs, status: backlogsStatus, error: backlogsError } = useSelector((state) => state.backlogs);
  const { sprints, status: sprintsStatus, error: sprintsError } = useSelector((state) => state.sprints);
  const { currentUser } = useAuth();

  // Fetch projects on mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Filter projects based on user role and set project options
  const filterProjectsByRole = () => {
    if (!currentUser || projects.length === 0) {
      setProjectOptions([]);
      setSelectedProjectId(null);
      return;
    }

    const isChefProjet = ['chef_projet', 'ChefProjet', 'Admin', 3].includes(currentUser.role || currentUser.roleId);
    const filteredProjects = projects.filter((project) => {
      const userEmail = currentUser.email;
      if (isChefProjet) {
        return (
          project.createdBy === userEmail ||
          project.projectManagers?.includes(userEmail) ||
          project.observers?.includes(userEmail)
        );
      }
      return (
        project.users?.includes(userEmail) ||
        project.scrumMasters?.includes(userEmail) ||
        project.productOwners?.includes(userEmail) ||
        project.testers?.includes(userEmail) ||
        project.observers?.includes(userEmail)
      );
    });

    const options = filteredProjects.map((project) => ({
      value: project.id,
      label: project.title,
    }));

    setProjectOptions(options);

    if (filteredProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  };

  useEffect(() => {
    filterProjectsByRole();
  }, [currentUser, projects, selectedProjectId]);

  // Fetch data for the selected project
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprints({ projectId: selectedProjectId }));
      dispatch(fetchAllTasks({ projectId: selectedProjectId }));
      dispatch(fetchBacklogs({ projectId: selectedProjectId }));
    }
  }, [selectedProjectId, dispatch]);

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId));

  // Calculate team members count
  const getTeamMembers = () => {
    if (!selectedProject) return 0;
    const allMembers = [
      ...(selectedProject.projectManagers || []),
      ...(selectedProject.productOwners || []),
      ...(selectedProject.scrumMasters || []),
      ...(selectedProject.users || []),
      ...(selectedProject.testers || []),
      ...(selectedProject.observers || []),
    ];
    return [...new Set(allMembers)].length;
  };

  // Compute project data
  const getProjectData = () => {
    if (!selectedProject) {
      return {
        totalTasks: 0,
        totalBacklog: 0,
        scrumData: [],
        burndownData: { labels: [], remaining: [], ideal: [], totalPoints: 0, sprintName: '' },
      };
    }

    const projectTasks = tasks.filter((task) => String(task.projectId) === String(selectedProjectId));
    const totalTasks = projectTasks.length;
    const totalBacklog = backlogs.length || 0;

    // Prepare scrum data for sprints
    const scrumData = sprints
      .filter((sprint) => sprint.startDate && sprint.endDate && dayjs(sprint.startDate).isValid() && dayjs(sprint.endDate).isValid())
      .map((sprint) => {
        const sprintTasks = projectTasks.filter((task) => String(task.sprintId) === String(sprint.id));
        return {
          name: sprint.name,
          totalTasks: sprintTasks.length,
          completedTasks: sprintTasks.filter((task) => task.status === 'Terminé').length,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          isActive: dayjs().utc().isBetween(dayjs(sprint.startDate).utc(), dayjs(sprint.endDate).utc(), null, '[]'),
          isCompleted: dayjs().utc().isAfter(dayjs(sprint.endDate).utc()),
        };
      });

    // Generate burndown chart data
    let burndownData = { labels: [], remaining: [], ideal: [], totalPoints: 0, sprintName: '' };
    let targetSprint = scrumData.find((sprint) =>
      dayjs().utc().isBetween(dayjs(sprint.startDate).utc(), dayjs(sprint.endDate).utc(), null, '[]')
    );

    if (!targetSprint) {
      targetSprint = scrumData.sort((a, b) => dayjs(b.endDate).utc().diff(dayjs(a.endDate).utc()))[0];
    }

    if (targetSprint) {
      const sprintDuration = dayjs(targetSprint.endDate).utc().diff(dayjs(targetSprint.startDate).utc(), 'day') + 1;
      const sprintTasks = projectTasks.filter((task) => String(task.sprintId) === String(targetSprint.id));
      const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);

      const labels = Array.from({ length: sprintDuration }, (_, i) =>
        dayjs(targetSprint.startDate).utc().add(i, 'day').format('DD MMM')
      );

      const remaining = Array.from({ length: sprintDuration }, (_, i) => {
        const currentDate = dayjs(targetSprint.startDate).utc().add(i, 'day');
        const tasksCompletedByDay = sprintTasks.filter(
          (task) =>
            task.status === 'Terminé' &&
            dayjs(task.updatedAt).isValid() &&
            dayjs(task.updatedAt).utc().isSameOrBefore(currentDate)
        );
        const completedPoints = tasksCompletedByDay.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
        return totalStoryPoints - completedPoints;
      });

      const ideal = Array.from({ length: sprintDuration }, (_, i) =>
        totalStoryPoints * (1 - (i + 1) / sprintDuration)
      );

      burndownData = {
        labels,
        remaining,
        ideal,
        totalPoints: totalStoryPoints,
        sprintName: targetSprint.name,
      };
    }

    return { totalTasks, totalBacklog, scrumData, burndownData };
  };

  const projectData = getProjectData();

  // Burndown chart configuration
  const burndownChartData = {
    labels: projectData.burndownData.labels,
    datasets: [
      {
        label: 'Travail restant',
        data: projectData.burndownData.remaining,
        borderColor: '#0958d9',
        backgroundColor: 'rgba(9, 88, 217, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Ligne idéale',
        data: projectData.burndownData.ideal,
        borderColor: '#91caff',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const burndownChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: projectData.burndownData.sprintName
          ? `Burndown Chart - ${projectData.burndownData.sprintName} (${projectData.burndownData.totalPoints || 0} points)`
          : 'Aucun sprint disponible',
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Points restants' } },
      x: { title: { display: true, text: 'Jours du Sprint' } },
    },
  };

  // Combine loading and error states
  const isLoading = projectsStatus === 'loading' || tasksStatus === 'loading' || backlogsStatus === 'loading' || sprintsStatus === 'loading';
  const error = projectsError || tasksError || backlogsError || sprintsError;

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Erreur</AntTitle>
        <Text>{error || 'Une erreur est survenue lors du chargement des données.'}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <PageTitle>Tableau de Bord</PageTitle>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              showSearch
              style={{ width: '100%' }}
              value={selectedProjectId}
              onChange={handleProjectChange}
              options={projectOptions}
              placeholder="Sélectionner un projet"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              disabled={projectOptions.length === 0}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card style={styles.statCard}>
              <Space align="start">
                <ProjectOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Tâches Totales</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {projectData.totalTasks || 'Aucune tâche'}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card style={styles.statCard}>
              <Space align="start">
                <ProjectOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Backlog Total</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {projectData.totalBacklog || 'Aucun backlog'}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card style={styles.statCard}>
              <Space align="start">
                <TeamOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Membres</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {getTeamMembers()}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="Burndown Chart du Sprint" style={styles.card}>
          <div style={styles.burndownChart}>
            {projectData.burndownData.labels.length > 0 ? (
              <Line data={burndownChartData} options={burndownChartOptions} />
            ) : (
              <div style={styles.emptyState}>Aucun sprint disponible</div>
            )}
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <CardSprints scrumData={projectData.scrumData} />
        </Row>
      </Space>
    </div>
  );
};

export default ProjectsDashboard;