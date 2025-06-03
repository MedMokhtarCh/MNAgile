import { styled } from '@mui/material/styles';
import { Paper, Box } from '@mui/material';
import { DialogContent } from '@mui/material';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const TaskItem = styled(Box)(({ theme, isDragging }) => ({
  display: 'flex',
  alignItems: 'flex-start', // Alignement en haut
  padding: theme.spacing(1.5),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  marginBottom: theme.spacing(1.5),
  backgroundColor: isDragging ? '#f0f7ff' : '#fff',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderColor: '#bbdefb',
  },
  minHeight: '80px', // Hauteur minimale pour les tâches
}));

const BacklogHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const BacklogContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
}));

const BacklogContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  flexGrow: 1, // Allow content to grow as needed
}));

const ScrollableContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto', // Enables scrolling
  // Hide scrollbar for Webkit browsers (Chrome, Safari)
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  // Hide scrollbar for Firefox
  scrollbarWidth: 'none',
  // Hide scrollbar for IE and Edge
  '-ms-overflow-style': 'none',
}));

const FormDialogContent = styled(DialogContent)(({ theme }) => ({
  overflowY: 'auto',
  scrollbarWidth: 'none',
  '-ms-overflow-style': 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

export {
  StyledPaper,
  TaskItem,
  BacklogHeader,
  BacklogContainer,
  BacklogContent,
  ScrollableContainer,
  FormDialogContent,
};