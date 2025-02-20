import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PageNumber = styled(Box)(({ theme, active }) => ({
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: 4,
  margin: '0 4px',
  fontSize: '14px',
  color: active ? '#fff' : '#666',
  backgroundColor: active ? '#1976d2' : '#f5f5f5',
  '&:hover': {
    backgroundColor: active ? '#1976d2' : '#e0e0e0',
  }
}));

const NavigationButton = styled(IconButton)(({ theme }) => ({
  padding: 4,
  color: '#666',
  '&.Mui-disabled': {
    color: '#ccc',
  }
}));

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 10, 
  onPageChange,
  showFirstLast = true 
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }

    // First page
    if (showFirstLast && startPage > 1) {
      pages.push(
        <PageNumber
          key={1}
          active={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PageNumber>
      );
      if (startPage > 2) {
        pages.push(
          <Typography key="ellipsis1" sx={{ mx: 1, color: '#666' }}>
            ...
          </Typography>
        );
      }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PageNumber
          key={i}
          active={currentPage === i}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </PageNumber>
      );
    }

    // Last page
    if (showFirstLast && endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <Typography key="ellipsis2" sx={{ mx: 1, color: '#666' }} >
            ...
          </Typography>
        );
      }
      pages.push(
        <PageNumber
          key={totalPages}
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </PageNumber>
      );
    }

    return pages;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)', // Centrer horizontalement
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        backgroundColor: '#fff',
        borderRadius: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000, // Assurez-vous que la pagination est au-dessus du contenu de la page
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography 
          sx={{ 
            mr: 1, 
            color: '#666', 
            fontSize: '14px',
            cursor: currentPage > 1 ? 'pointer' : 'default',
            opacity: currentPage > 1 ? 1 : 0.5,
          }}
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        >
          Prev
        </Typography>
        <NavigationButton
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeftIcon fontSize="small" />
        </NavigationButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
        {renderPageNumbers()}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <NavigationButton
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <ChevronRightIcon fontSize="small" />
        </NavigationButton>
        <Typography 
          sx={{ 
            ml: 1, 
            color: '#666', 
            fontSize: '14px',
            cursor: currentPage < totalPages ? 'pointer' : 'default',
            opacity: currentPage < totalPages ? 1 : 0.5,
          }}
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        >
          Next
        </Typography>
      </Box>
    </Box>
  );
};

export default Pagination;
