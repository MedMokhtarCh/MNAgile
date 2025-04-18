import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const Pagination = ({ page = 1, count = 10, onChange }) => {
  const handleChange = (newPage) => {
    if (onChange && newPage >= 1 && newPage <= count) {
      onChange(newPage);
    }
  };

  // Génère les numéros de page à afficher avec ellipses
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Nombre maximum de pages visibles

    if (count <= maxVisiblePages) {
      // Afficher toutes les pages si moins que maxVisiblePages
      for (let i = 1; i <= count; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les points de suspension
      pages.push(1);
      
      // Si on est proche du début
      if (page <= 3) {
        for (let i = 2; i <= 4; i++) {
          if (i <= count) pages.push(i);
        }
        if (count > 4) {
          pages.push('...');
          pages.push(count);
        }
      } 
      // Si on est proche de la fin
      else if (page > count - 3) {
        pages.push('...');
        for (let i = count - 3; i < count; i++) {
          pages.push(i);
        }
      } 
      // Au milieu
      else {
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        if (page + 1 < count - 1) {
          pages.push('...');
        }
        if (count > page + 1) {
          pages.push(count);
        }
      }
    }

    return pages;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center', // Centré comme dans l'image
        alignItems: 'center',
        py: 3,
        width: '100%',
      }}
    >
      <IconButton
        disabled={page === 1}
        onClick={() => handleChange(page - 1)}
        sx={{
          color: page === 1 ? '#ccc' : '#555',
          '&:hover': {
            backgroundColor: 'transparent'
          }
        }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>

      {generatePageNumbers().map((item, index) => (
        item === '...' ? (
          <Typography key={`ellipsis-${index}`} sx={{ mx: 1, color: '#888' }}>
            ...
          </Typography>
        ) : (
          <Button
            key={item}
            variant={page === item ? "contained" : "text"}
            sx={{
              minWidth: '32px',
              height: '32px',
              fontSize: '0.875rem',
              fontWeight: page === item ? 600 : 400,
              color: page === item ? '#fff' : '#555',
              backgroundColor: page === item ? '#1976d2' : 'transparent',
              '&:hover': {
                backgroundColor: page === item ? '#1976d2' : 'rgba(25, 118, 210, 0.04)',
                color: page === item ? '#fff' : '#1976d2'
              },
              mx: 0.5,
              borderRadius: '4px'
            }}
            onClick={() => handleChange(item)}
          >
            {item}
          </Button>
        )
      ))}

      <IconButton
        disabled={page === count}
        onClick={() => handleChange(page + 1)}
        sx={{
          color: page === count ? '#ccc' : '#555',
          '&:hover': {
            backgroundColor: 'transparent'
          }
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default Pagination;