import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8' }, // Google Blue
    secondary: { main: '#ea4335' }, // Google Red
    success: { main: '#34a853' }, // Google Green
    background: { default: '#f1f3f4' }, // Light grey background
  },
  typography: {
    fontFamily: ['Google Sans', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 } },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
    },
  },
});

export default theme;