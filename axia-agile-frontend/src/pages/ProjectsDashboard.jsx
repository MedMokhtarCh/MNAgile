
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Select, Card, Row, Col, Typography, Progress, Space } from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
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
import { fetchProjects } from '../store/slices/projectsSlice';
import { fetchSprints, fetchAllTasks, fetchBacklogs } from '../store/slices/taskSlice';
import PageTitle from '../components/common/PageTitle';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const { Title: AntTitle, Text } = Typography;

const ProjectsDashboard = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);

  const dispatch = useDispatch();
  const { projects, status: projectsStatus, error: projectsError } = useSelector((state) => state.projects);
  const { sprints, tasks, backlogs, status: tasksStatus, error: tasksError } = useSelector((state) => state.tasks);
  const { currentUser } = useAuth();

  // Fetch projects on mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Filter projects based on user role and set project options
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      let filteredProjects = [];

      const isChefProjet = ['chef_projet', 'ChefProjet', 'Admin', 3].includes(currentUser.role || currentUser.roleId);

      if (isChefProjet) {
        filteredProjects = projects.filter((project) =>
          project.createdBy === currentUser.email ||
          project.projectManagers?.includes(currentUser.email) ||
          project.observers?.includes(currentUser.email)
        );
      } else {
        filteredProjects = projects.filter((project) =>
          project.users?.includes(currentUser.email) ||
          project.scrumMasters?.includes(currentUser.email) ||
          project.productOwners?.includes(currentUser.email) ||
          project.testers?.includes(currentUser.email) ||
          project.observers?.includes(currentUser.email)
        );
      }

      const options = filteredProjects.map((project) => ({
        value: project.id,
        label: project.title,
      }));

      setProjectOptions(options);

      if (filteredProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(filteredProjects[0].id);
      }
    } else {
      setProjectOptions([]);
      setSelectedProjectId(null);
    }
  }, [currentUser, projects, selectedProjectId]);

  // Fetch sprints, tasks, and backlogs for the selected project
  useEffect(() => {
    if (selectedProjectId && currentUser) {
      console.log('[ProjectsDashboard] Fetching data for projectId:', selectedProjectId);
      dispatch(fetchSprints({ projectId: selectedProjectId }));
      dispatch(fetchAllTasks({ projectId: selectedProjectId }));
      dispatch(fetchBacklogs({ projectId: selectedProjectId }));
    }
  }, [selectedProjectId, currentUser, dispatch]);

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId));

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

  const getProjectData = () => {
    if (!selectedProject) {
      return {
        totalTasks: 0,
        totalBacklog: 0,
        scrumData: [],
        burndownData: {
          labels: ['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4', 'Jour 5', 'Jour 6', 'Jour 7', 'Jour 8', 'Jour 9', 'Jour 10'],
          remaining: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          ideal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      };
    }

    // Filter tasks for the selected project
    const projectTasks = tasks.filter((task) => String(task.projectId) === String(selectedProjectId));
    console.log('[getProjectData] selectedProjectId:', selectedProjectId);
    console.log('[getProjectData] tasks:', tasks);
    console.log('[getProjectData] projectTasks:', projectTasks);
    console.log('[getProjectData] totalTasks:', projectTasks.length);

    // Calculate total tasks across all sprints
    const totalTasks = projectTasks.length;

    // Calculate total backlog items
    const totalBacklog = backlogs.length;

    // Prepare scrum data for sprints
    const scrumData = sprints.map((sprint) => ({
      name: sprint.name,
      totalTasks: projectTasks.filter((task) => String(task.sprintId) === String(sprint.id)).length,
      completedTasks: projectTasks.filter((task) => String(task.sprintId) === String(sprint.id) && task.status === 'done').length,
    }));

    // Generate burndown chart data for the latest sprint
    let burndownData = {
      labels: ['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4', 'Jour 5', 'Jour 6', 'Jour 7', 'Jour 8', 'Jour 9', 'Jour 10'],
      remaining: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ideal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    if (sprints.length > 0) {
      const latestSprint = sprints[sprints.length - 1];
      const sprintTasks = projectTasks.filter((task) => String(task.sprintId) === String(latestSprint.id));
      console.log('[getProjectData] latestSprint:', latestSprint);
      console.log('[getProjectData] sprintTasks:', sprintTasks);

      // Calculate sprint duration
      let sprintDays = 10; // Default to 10 days if dates are unavailable
      let startDate, endDate;
      if (latestSprint.startDate && latestSprint.endDate) {
        startDate = new Date(latestSprint.startDate);
        endDate = new Date(latestSprint.endDate);
        const timeDiff = endDate - startDate;
        sprintDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Days including start and end
        console.log('[getProjectData] sprintDays:', sprintDays, 'startDate:', startDate, 'endDate:', endDate);
      } else {
        console.warn('[getProjectData] Missing startDate or endDate, using default 10 days');
      }

      // Ensure sprintDays is at least 1
      sprintDays = Math.max(sprintDays, 1);

      // Calculate total story points
      const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
      console.log('[getProjectData] totalStoryPoints:', totalStoryPoints);

      // Generate labels for each day
      const labels = Array.from({ length: sprintDays }, (_, i) => {
        if (startDate) {
          const day = new Date(startDate);
          day.setDate(startDate.getDate() + i);
          return day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
        return `Jour ${i + 1}`;
      });

      // Calculate remaining story points per day
      const remaining = Array.from({ length: sprintDays }, (_, i) => {
        const currentDate = startDate ? new Date(startDate) : new Date();
        currentDate.setDate(currentDate.getDate() + i);
        const tasksCompletedByDay = sprintTasks.filter(
          (task) =>
            task.status === 'done' &&
            new Date(task.updatedAt) <= currentDate
        );
        const completedPoints = tasksCompletedByDay.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
        return totalStoryPoints - completedPoints;
      });

      // Ideal burndown line
      const ideal = Array.from({ length: sprintDays }, (_, i) =>
        totalStoryPoints * (1 - (i + 1) / sprintDays)
      );

      burndownData = { labels, remaining, ideal };
      console.log('[getProjectData] burndownData:', burndownData);
    }

    return {
      totalTasks,
      totalBacklog,
      scrumData,
      burndownData,
    };
  };

  const currentProjectData = getProjectData();

  const cardStyle = {
    borderRadius: '8px',
    backgroundColor: '#f7f9fc',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const statCardStyle = {
    ...cardStyle,
    height: '120px',
  };

  const burndownChartData = {
    labels: currentProjectData.burndownData.labels,
    datasets: [
      {
        label: 'Travail restant',
        data: currentProjectData.burndownData.remaining,
        borderColor: '#0958d9',
        backgroundColor: 'rgba(9, 88, 217, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Ligne idéale',
        data: currentProjectData.burndownData.ideal,
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
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Points restants',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Jours du Sprint',
        },
      },
    },
  };

  // Combine loading and error states from projects and tasks slices
  if (projectsStatus === 'loading' || tasksStatus === 'loading') {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Chargement...</div>;
  }

  if (projectsStatus === 'failed' || tasksStatus === 'failed') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Erreur</AntTitle>
        <Text>{projectsError || tasksError || 'Une erreur est survenue lors du chargement des données.'}</Text>
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
          <Col span={8}>
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

        <Row gutter={16}>
          <Col span={8}>
            <Card style={statCardStyle}>
              <Space align="start">
                <ProjectOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Tâches Totales</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {currentProjectData.totalTasks || 'Aucune tâche'}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={statCardStyle}>
              <Space align="start">
                <ProjectOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Backlog Total</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {currentProjectData.totalBacklog || 'Aucun backlog'}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={statCardStyle}>
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

        <Card title="Burndown Chart du Sprint" style={cardStyle}>
          <div style={{ height: '400px', padding: '20px' }}>
            <Line data={burndownChartData} options={burndownChartOptions} />
          </div>
        </Card>

        <Row gutter={16}>
          {currentProjectData.scrumData.length > 0 ? (
            currentProjectData.scrumData.map((sprint, index) => (
              <Col span={12} key={index}>
                <Card
                  title={
                    <Space>
                      <CheckCircleOutlined style={{ color: '#0958d9' }} />
                      {sprint.name}
                    </Space>
                  }
                  style={cardStyle}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Progression</Text>
                      <Text strong>
                        {sprint.totalTasks > 0
                          ? Math.round((sprint.completedTasks / sprint.totalTasks) * 100)
                          : 0}%
                      </Text>
                    </div>
                    <Progress
                      percent={
                        sprint.totalTasks > 0
                          ? Math.round((sprint.completedTasks / sprint.totalTasks) * 100)
                          : 0
                      }
                      strokeColor="#0958d9"
                    />
                    <Row justify="space-between">
                      <Col>
                        <Text type="secondary">Tâches complétées: {sprint.completedTasks}</Text>
                      </Col>
                      <Col>
                        <Text type="secondary">Total: {sprint.totalTasks}</Text>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Card style={cardStyle}>
                <Text type="secondary">Aucun sprint disponible</Text>
              </Card>
            </Col>
          )}
        </Row>
      </Space>
    </div>
  );
};

export default ProjectsDashboard;
