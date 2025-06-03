import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Select, Card, Row, Col, Typography, Progress, Space, Tag } from 'antd';
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
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isBetween);
dayjs.extend(utc);

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
          labels: [],
          remaining: [],
          ideal: [],
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

    // Generate burndown chart data for the active sprint or most recent sprint
    let burndownData = {
      labels: [],
      remaining: [],
      ideal: [],
      totalPoints: 0,
      sprintName: '',
    };

    // Find active sprint or most recent sprint
    let targetSprint = scrumData.find((sprint) =>
      sprint.startDate &&
      sprint.endDate &&
      dayjs(sprint.startDate).isValid() &&
      dayjs(sprint.endDate).isValid() &&
      dayjs().utc().isBetween(dayjs(sprint.startDate).utc(), dayjs(sprint.endDate).utc(), null, '[]')
    );

    if (!targetSprint) {
      // Fallback to most recent sprint
      targetSprint = scrumData.sort((a, b) => dayjs(b.endDate).utc().diff(dayjs(a.endDate).utc()))[0];
    }

    if (targetSprint) {
      const sprintDuration = dayjs(targetSprint.endDate).utc().diff(dayjs(targetSprint.startDate).utc(), 'day') + 1;
      const sprintTasks = projectTasks.filter((task) => String(task.sprintId) === String(targetSprint.id));
      console.log('[getProjectData] targetSprint:', targetSprint);
      console.log('[getProjectData] sprintTasks:', sprintTasks);

      // Calculate total story points
      const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
      console.log('[getProjectData] totalStoryPoints:', totalStoryPoints);

      // Generate labels for each day
      const labels = Array.from({ length: sprintDuration }, (_, i) => {
        const date = dayjs(targetSprint.startDate).utc().add(i, 'day');
        return date.format('DD MMM');
      });

      // Calculate remaining story points per day
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

      // Ideal burndown line
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
        display: true,
        text: currentProjectData.burndownData.sprintName
          ? `Burndown Chart - ${currentProjectData.burndownData.sprintName} (${currentProjectData.burndownData.totalPoints || 0} points)`
          : 'Aucun sprint disponible',
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
            {currentProjectData.burndownData.labels.length > 0 ? (
              <Line data={burndownChartData} options={burndownChartOptions} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: '#888',
                }}
              >
                Aucun sprint disponible
              </div>
            )}
          </div>
        </Card>

        <Row gutter={16}>
          {currentProjectData.scrumData.length > 0 ? (
            currentProjectData.scrumData.map((sprint, index) => (
              <Col span={12} key={index}>
                <Card
                  title={
                    <Space>
                      <CheckCircleOutlined
                        style={{
                          color: sprint.isCompleted ? '#52c41a' : sprint.isActive ? '#1890ff' : '#d9d9d9',
                        }}
                      />
                      {sprint.name}
                      {sprint.isActive && <Tag color="processing">Actif</Tag>}
                      {sprint.isCompleted && <Tag color="success">Terminé</Tag>}
                    </Space>
                  }
                  style={cardStyle}
                  extra={
                    <Text type="secondary">
                      {dayjs(sprint.startDate).isValid()
                        ? dayjs(sprint.startDate).utc().format('DD/MM/YYYY')
                        : 'N/A'}{' '}
                      -{' '}
                      {dayjs(sprint.endDate).isValid() ? dayjs(sprint.endDate).utc().format('DD/MM/YYYY') : 'N/A'}
                    </Text>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Progression</Text>
                      <Text strong>
                        {sprint.totalTasks > 0
                          ? Math.round((sprint.completedTasks / sprint.totalTasks) * 100)
                          : 0}
                        %
                      </Text>
                    </div>
                    <Progress
                      percent={
                        sprint.totalTasks > 0
                          ? Math.round((sprint.completedTasks / sprint.totalTasks) * 100)
                          : 0
                      }
                      strokeColor={
                        sprint.isCompleted ? '#52c41a' : sprint.isActive ? '#1890ff' : '#d9d9d9'
                      }
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