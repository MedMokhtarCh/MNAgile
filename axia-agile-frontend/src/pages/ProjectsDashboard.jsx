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
import { useAuth } from '../contexts/AuthContext'; // Import useAuth for currentUser

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

  const dispatch = useDispatch();
  const { projects, status, error } = useSelector((state) => state.projects);
  const { currentUser } = useAuth(); // Use AuthContext instead of localStorage

  useEffect(() => {
    console.log('Fetching projects...');
    dispatch(fetchProjects()).then((result) => {
      console.log('Fetch projects result:', result);
    }).catch((err) => {
      console.error('Fetch projects error:', err);
    });
  }, [dispatch]);

  useEffect(() => {
    console.log('Current user:', currentUser);
    console.log('Projects:', projects);

    if (currentUser && projects.length > 0) {
      let filteredProjects = [];

      // Normalize role for comparison
      const isChefProjet = ['chef_projet', 'ChefProjet', 'Admin', 3].includes(currentUser.role || currentUser.roleId);

      if (isChefProjet) {
        filteredProjects = projects.filter((project) => {
          const match = project.createdBy === currentUser.email ||
                        project.projectManagers?.includes(currentUser.email) ||
                        project.observers?.includes(currentUser.email); // Include observers
          console.log(`Project ${project.title} (chef_projet):`, { createdBy: project.createdBy, projectManagers: project.projectManagers, observers: project.observers, match });
          return match;
        });
      } else {
        filteredProjects = projects.filter((project) => {
          const match = project.users?.includes(currentUser.email) ||
                        project.scrumMasters?.includes(currentUser.email) ||
                        project.productOwners?.includes(currentUser.email) ||
                        project.testers?.includes(currentUser.email) ||
                        project.observers?.includes(currentUser.email); // Include observers
          console.log(`Project ${project.title} (other roles):`, { users: project.users, scrumMasters: project.scrumMasters, productOwners: project.productOwners, testers: project.testers, observers: project.observers, match });
          return match;
        });
      }

      console.log('Filtered projects:', filteredProjects);

      const options = filteredProjects.map((project) => ({
        value: project.id,
        label: project.title,
      }));

      setProjectOptions(options);

      if (filteredProjects.length > 0 && !selectedProject) {
        setSelectedProject(filteredProjects[0]);
      }
    }
  }, [currentUser, projects, selectedProject]);

  const handleProjectChange = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    console.log('Selected project:', project);
    setSelectedProject(project);
  };

  const getTeamMembers = () => {
    if (!selectedProject) return 0;

    const allMembers = [
      ...(selectedProject.projectManagers || []),
      ...(selectedProject.productOwners || []),
      ...(selectedProject.scrumMasters || []),
      ...(selectedProject.users || []),
      ...(selectedProject.testers || []),
      ...(selectedProject.observers || []), // Include observers
    ];

    return [...new Set(allMembers)].length;
  };

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

  if (status === 'loading') {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Chargement...</div>;
  }

  if (status === 'failed') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Erreur</AntTitle>
        <Text>{error || 'Une erreur est survenue lors du chargement des projets.'}</Text>
      </div>
    );
  }

  if (projectOptions.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <AntTitle level={4}>Aucun projet disponible</AntTitle>
        <Text>
          Vous n'avez accès à aucun projet ou aucun projet n'a été créé. Vérifiez votre rôle et vos affectations.
        </Text>
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

        <Card title="Burndown Chart du Sprint" style={cardStyle}>
          <div style={{ height: '400px', padding: '20px' }}>
            <Line data={burndownChartData} options={burndownChartOptions} />
          </div>
        </Card>

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