import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const PageTitle = ({ level = 2, children, style = {} }) => {
  const defaultStyle = { 
    marginTop: '16px',
    marginBottom: '24px',
    color: '#2c2c2c', 
    fontWeight: 600,
    ...style 
  };

  return (
    <Title level={level} style={defaultStyle}>
      {children}
    </Title>
  );
};

export default PageTitle;
