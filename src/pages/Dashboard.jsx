import React, { useState } from 'react';
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

// Sample data for projects
const projectsData = {
  "Projet A": {
    tasks: 12,
    members: 5,
    activeTasks: 8,
    scrumData: [
      { name: 'Sprint 1', activeTasks: 5, totalTasks: 12 },
      { name: 'Sprint 2', activeTasks: 8, totalTasks: 20 },
    ],
    burndownData: {
      labels: ['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4', 'Jour 5', 'Jour 6', 'Jour 7', 'Jour 8', 'Jour 9', 'Jour 10'],
      remaining: [20, 18, 15, 14, 12, 10, 8, 5, 3, 0],
      ideal: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
    }
  },
  "Projet B": {
    tasks: 20,
    members: 7,
    activeTasks: 12,
    scrumData: [
      { name: 'Sprint 1', activeTasks: 7, totalTasks: 15 },
      { name: 'Sprint 2', activeTasks: 10, totalTasks: 25 },
    ],
    burndownData: {
      labels: ['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4', 'Jour 5', 'Jour 6', 'Jour 7', 'Jour 8', 'Jour 9', 'Jour 10'],
      remaining: [25, 23, 20, 18, 15, 13, 10, 8, 5, 2],
      ideal: [25, 22.5, 20, 17.5, 15, 12.5, 10, 7.5, 5, 2.5]
    }
  }
};

const Dashboard = () => {
  const [selectedProject, setSelectedProject] = useState("Projet A");

  const options = Object.keys(projectsData).map(project => ({
    value: project,
    label: project,
  }));

  const currentProject = projectsData[selectedProject];

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
    labels: currentProject.burndownData.labels,
    datasets: [
      {
        label: 'Travail restant',
        data: currentProject.burndownData.remaining,
        borderColor: '#0958d9',
        backgroundColor: 'rgba(9, 88, 217, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Ligne idéale',
        data: currentProject.burndownData.ideal,
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
              value={selectedProject}
              onChange={setSelectedProject}
              options={options}
              placeholder="Rechercher ou sélectionner un projet"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
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
                    {currentProject.tasks}
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
                    {currentProject.activeTasks}
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
                    {currentProject.members}
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
          {currentProject.scrumData.map((sprint, index) => (
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

export default Dashboard;