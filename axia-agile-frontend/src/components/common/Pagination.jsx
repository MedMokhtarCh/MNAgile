import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const Pagination = ({ page = 1, count = 10, onChange }) => {
  const handleChange = (newPage) => {
    if (onChange && newPage >= 1 && newPage <= count) {
      onChange(newPage);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 3,
        gap: 0,
      }}
    >
      {/* Bouton Prev */}
      <Button
        startIcon={<ArrowBackIosNewIcon fontSize="small" />}
        disabled={page === 1}
        onClick={() => handleChange(page - 1)}
        sx={{
          minWidth: 'auto',
          color: '#666',
          backgroundColor: 'transparent',
          border: '1px solid #e0e0e0',
          borderRadius: '4px 0 0 4px',
          borderRight: 'none',
          padding: '6px 12px',
          textTransform: 'none',
          fontSize: '0.8rem',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
          '&.Mui-disabled': {
            color: '#ccc',
            border: '1px solid #e0e0e0',
            borderRight: 'none',
          }
        }}
      >
        Prev
      </Button>

      {/* Numéros de page */}
      {[1, 2, '...', 9, 10].map((item, index) => {
        if (item === '...') {
          return (
            <Typography 
              key={`ellipsis-${index}`} 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                minWidth: '32px',
                borderTop: '1px solid #e0e0e0',
                borderBottom: '1px solid #e0e0e0',
                color: '#666',
                fontSize: '0.8rem'
              }}
            >
              ...
            </Typography>
          );
        }
        
        return (
          <Button
            key={item}
            sx={{
              minWidth: '32px',
              height: '32px',
              padding: 0,
              color: page === item ? '#fff' : '#666',
              backgroundColor: page === item ? '#1976d2' : 'transparent',
              border: '1px solid #e0e0e0',
              borderRight: 'none',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: page === item ? '#1976d2' : '#f5f5f5',
              }
            }}
            onClick={() => handleChange(item)}
          >
            {item}
          </Button>
        );
      })}

      {/* Bouton Next */}
      <Button
        endIcon={<ArrowForwardIosIcon fontSize="small" />}
        disabled={page === count}
        onClick={() => handleChange(page + 1)}
        sx={{
          minWidth: 'auto',
          color: '#666',
          backgroundColor: 'transparent',
          border: '1px solid #e0e0e0',
          borderRadius: '0 4px 4px 0',
          padding: '6px 12px',
          textTransform: 'none',
          fontSize: '0.8rem',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
          '&.Mui-disabled': {
            color: '#ccc',
          }
        }}
      >
        Next
      </Button>
    </Box>
  );
};

export default Pagination;