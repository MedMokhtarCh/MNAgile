import React from 'react';
import { Card, Col, Typography, Progress, Space, Tag, Row } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { styles } from './theme';

const { Title: AntTitle, Text } = Typography;

const CardSprints = ({ scrumData }) => {
  return (
    <>
      {scrumData.length > 0 ? (
        scrumData.map((sprint, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              title={
                <div>
                  <div style={styles.sprintCardTitle}>
                    <CheckCircleOutlined
                      style={{
                        color: sprint.isCompleted ? '#52c41a' : sprint.isActive ? '#1890ff' : '#d9d9d9',
                        fontSize: '20px',
                      }}
                    />
                    <AntTitle level={5} style={{ margin: 0 }}>
                      {sprint.name}
                    </AntTitle>
                    {sprint.isActive && (
                      <Tag color="processing" style={styles.sprintTag}>
                        Actif
                      </Tag>
                    )}
                    {sprint.isCompleted && (
                      <Tag color="success" style={styles.sprintTag}>
                        Terminé
                      </Tag>
                    )}
                  </div>
                  <Text style={styles.sprintDate}>
                    {dayjs(sprint.startDate).isValid()
                      ? dayjs(sprint.startDate).utc().format('DD/MM/YYYY')
                      : 'N/A'}{' '}
                    -{' '}
                    {dayjs(sprint.endDate).isValid()
                      ? dayjs(sprint.endDate).utc().format('DD/MM/YYYY')
                      : 'N/A'}
                  </Text>
                </div>
              }
              style={styles.card}
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
          <Card style={styles.card}>
            <Text type="secondary">Aucun sprint disponible</Text>
          </Card>
        </Col>
      )}
    </>
  );
};

export default CardSprints;