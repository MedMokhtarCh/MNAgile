import React, { useState, useEffect } from 'react';
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
  Legend
} from 'chart.js';

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
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);

  useEffect(() => {
    // Load current user
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);

    // Load projects from localStorage
    const storedProjects = JSON.parse(localStorage.getItem('projects')) || [];
    setProjects(storedProjects);

    // Load users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    setUsers(storedUsers);

    // Filter projects based on user role
    if (user) {
      let filteredProjects = [];
      if (user.role === 'chef_projet') {
        filteredProjects = storedProjects.filter(
          project => project.createdBy === user.email || 
          project.projectManagers?.includes(user.email)
        );
      } else {
        filteredProjects = storedProjects.filter(
          project => project.users?.includes(user.email) ||
          project.scrumMasters?.includes(user.email) ||
          project.productOwners?.includes(user.email) ||
          project.testers?.includes(user.email)
        );
      }

      // Prepare project options for Select
      const options = filteredProjects.map(project => ({
        value: project.id,
        label: project.title,
      }));

      setProjectOptions(options);
      
      // Set initial selected project
      if (filteredProjects.length > 0) {
        setSelectedProject(filteredProjects[0]);
      }
    }
  }, []);

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
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
      ...(selectedProject.testers || [])
    ];
    
    // Remove duplicates
    return [...new Set(allMembers)].length;
  };

  // Sample data for tasks and sprints (to be replaced with real data later)
  const getProjectData = () => {
    if (!selectedProject) {
      return {
        tasks: 0,
        activeTasks: 0,
        scrumData: [],
        burndownData: {
          labels: [],
          remaining: [],
          ideal: []
        }
      };
    }

    // Placeholder data - to be replaced with real data from backend/localStorage
    return {
      tasks: 12, // This should come from project data
      activeTasks: 8, // This should come from project data
      scrumData: [
        { name: 'Sprint 1', activeTasks: 5, totalTasks: 12 },
        { name: 'Sprint 2', activeTasks: 8, totalTasks: 20 },
      ],
      burndownData: {
        labels: ['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4', 'Jour 5', 'Jour 6', 'Jour 7', 'Jour 8', 'Jour 9', 'Jour 10'],
        remaining: [20, 18, 15, 14, 12, 10, 8, 5, 3, 0],
        ideal: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
      }
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
        fill: true
      },
      {
        label: 'Ligne idéale',
        data: currentProjectData.burndownData.ideal,
        borderColor: '#91caff',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false
      }
    ]
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
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Points restants'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Jours du Sprint'
        }
      }
    }
  };

  if (!selectedProject && projectOptions.length > 0) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Chargement...</div>;
  }

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
            <AntTitle level={2} style={{ margin: 0}}>
              Tableau de Bord
            </AntTitle>
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
                    <Text strong>{Math.round((sprint.activeTasks / sprint.totalTasks) * 100)}%</Text>
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