import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Select, Card, Row, Col, Typography, Progress, Space } from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
import PageTitle from '../components/common/PageTitle';

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
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const dispatch = useDispatch();
  const { projects, status, error } = useSelector((state) => state.projects); // Access projects from Redux store

  useEffect(() => {
    // Load current user from localStorage (or update to Redux if user data is managed there)
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);

    // Fetch projects from Redux
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    // Filter projects based on user role and prepare project options
    if (currentUser && projects.length > 0) {
      let filteredProjects = [];
      if (currentUser.role === 'chef_projet') {
        filteredProjects = projects.filter(
          (project) =>
            project.createdBy === currentUser.email ||
            project.projectManagers?.includes(currentUser.email)
        );
      } else {
        filteredProjects = projects.filter(
          (project) =>
            project.users?.includes(currentUser.email) ||
            project.scrumMasters?.includes(currentUser.email) ||
            project.productOwners?.includes(currentUser.email) ||
            project.testers?.includes(currentUser.email)
        );
      }

      // Prepare project options for Select
      const options = filteredProjects.map((project) => ({
        value: project.id,
        label: project.title,
      }));

      setProjectOptions(options);

      // Set initial selected project
      if (filteredProjects.length > 0) {
        setSelectedProject(filteredProjects[0]);
      }
    }
  }, [currentUser, projects]);

  const handleProjectChange = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    setSelectedProject(project);
  };

  // Get team members for the selected project
  const getTeamMembers = () => {
    if (!selectedProject) return 0;

    const allMembers = [
      ...(selectedProject.projectManagers || []),
      ...(selectedProject.productOwners || []),
      ...(selectedProject.scrumMasters || []),
      ...(selectedProject.users || []),
      ...(selectedProject.testers || []),
    ];

    // Remove duplicates
    return [...new Set(allMembers)].length;
  };

  // Placeholder data for tasks and sprints (kept as fake data)
  const getProjectData = () => {
    if (!selectedProject) {
      return {
        tasks: 0,
        activeTasks: 0,
        scrumData: [],
        burndownData: {
          labels: [],
          remaining: [],
          ideal: [],
        },
      };
    }

    // Fake data for tasks, sprints, and burndown chart
    return {
      tasks: 12,
      activeTasks: 8,
      scrumData: [
        { name: 'Sprint 1', activeTasks: 5, totalTasks: 12 },
        { name: 'Sprint 2', activeTasks: 8, totalTasks: 20 },
      ],
      burndownData: {
        labels: [
          'Jour 1',
          'Jour 2',
          'Jour 3',
          'Jour 4',
          'Jour 5',
          'Jour 6',
          'Jour 7',
          'Jour 8',
          'Jour 9',
          'Jour 10',
        ],
        remaining: [20, 18, 15, 14, 12, 10, 8, 5, 3, 0],
        ideal: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2],
      },
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

  // Handle loading state
  if (status === 'loading') {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Chargement...</div>;
  }

  // Handle error state
  if (status === 'failed') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Erreur</AntTitle>
        <Text>{error || 'Une erreur est survenue lors du chargement des projets.'}</Text>
      </div>
    );
  }

  // Handle no projects available
  if (projectOptions.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Aucun projet disponible</AntTitle>
        <Text>Vous n'avez accès à aucun projet ou aucun projet n'a été créé.</Text>
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
              value={selectedProject?.id}
              onChange={handleProjectChange}
              options={projectOptions}
              placeholder="Sélectionner un projet"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16}>
          <Col span={8}>
            <Card style={statCardStyle}>
              <Space align="start">
                <ProjectOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Tâches Totales</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {currentProjectData.tasks}
                  </AntTitle>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={statCardStyle}>
              <Space align="start">
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#0958d9' }} />
                <div>
                  <Text type="secondary">Tâches Actives</Text>
                  <AntTitle level={3} style={{ margin: '8px 0 0 0', color: '#0958d9' }}>
                    {currentProjectData.activeTasks}
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

        {/* Burndown Chart */}
        <Card title="Burndown Chart du Sprint" style={cardStyle}>
          <div style={{ height: '400px', padding: '20px' }}>
            <Line data={burndownChartData} options={burndownChartOptions} />
          </div>
        </Card>

        {/* Sprint Progress */}
        <Row gutter={16}>
          {currentProjectData.scrumData.map((sprint, index) => (
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
                      {Math.round((sprint.activeTasks / sprint.totalTasks) * 100)}%
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round((sprint.activeTasks / sprint.totalTasks) * 100)}
                    strokeColor="#0958d9"
                  />
                  <Row justify="space-between">
                    <Col>
                      <Text type="secondary">Tâches actives: {sprint.activeTasks}</Text>
                    </Col>
                    <Col>
                      <Text type="secondary">Total: {sprint.totalTasks}</Text>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    </div>
  );
};

export default ProjectsDashboard;