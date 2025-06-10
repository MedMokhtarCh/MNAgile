import { createTheme } from '@mui/material';

// Custom Theme
export const theme = createTheme({
  palette: {
    primary: { main: '#4d75f4' },
    secondary: { main: '#f6bc66' },
    success: { main: '#84c887' },
    error: { main: '#f67d74' },
    info: { main: '#50c1e9' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    subtitle1: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.08)', borderRadius: 12 },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: { root: { height: 24, fontSize: '0.7rem' } },
    },
  },
});

// French localization constants
export const weekdaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Helper function to format dates
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`;
};

// Priority colors
export const priorityColors = {
  HIGH: 'error',
  MEDIUM: 'secondary',
  LOW: 'success',
};