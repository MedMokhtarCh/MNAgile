import { styled } from '@mui/material/styles';
import { Button, Box, Paper, Typography, Card, CardContent } from '@mui/material';

export const CreateButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.primary.contrastText,
  padding: '12px 28px',
  borderRadius: 12,
  boxShadow: theme.shadows[4],
  fontSize: 16,
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    boxShadow: theme.shadows[8],
    transform: 'scale(1.05)',
  },
  '& .MuiButton-startIcon': {
    marginRight: 10,
  },
}));

export const FilterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '16px 24px',
  borderRadius: 12,
  boxShadow: theme.shadows[3],
  marginBottom: 32,
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

export const GenerateButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  borderRadius: 25,
  border: 0,
  color: 'white',
  height: 56,
  padding: '0 30px',
  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'linear-gradient(45deg, #ccc 30%, #ddd 90%)',
    boxShadow: 'none',
    transform: 'none',
  },
}));

export const DownloadButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
  borderRadius: 25,
  border: 0,
  color: 'white',
  height: 48,
  padding: '0 25px',
  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
    transform: 'translateY(-1px)',
  },
}));

export const CahierContainer = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  border: '1px solid #e3f2fd',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
}));

export const CahierContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(4),
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  lineHeight: 1.7,
  color: '#333',
  '& h1': {
    textAlign: 'center',
    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    textShadow: 'none',
  },
  '& .subtitle': {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    fontSize: '18px',
    marginBottom: theme.spacing(4),
    padding: theme.spacing(2),
    background: 'rgba(25, 118, 210, 0.05)',
    borderRadius: 12,
    border: '1px solid rgba(25, 118, 210, 0.1)',
  },
  '& .section': {
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e8eaf6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      transform: 'translateY(-1px)',
    },
  },
  '& .section-title, & h2': {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1976d2',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    borderBottom: '3px solid #e3f2fd',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -3,
      left: 0,
      width: '60px',
      height: '3px',
      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
      borderRadius: '2px',
    },
  },
  '& h3': {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1565c0',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  '& p': {
    marginBottom: theme.spacing(2),
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#444',
    textAlign: 'justify',
  },
  '& ul': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(0.5),
      fontSize: '15px',
      lineHeight: 1.6,
      color: '#555',
      position: 'relative',
      '&::marker': {
        color: '#1976d2',
        fontWeight: 'bold',
      },
    },
  },
  '& .footer': {
    textAlign: 'center',
    marginTop: theme.spacing(6),
    padding: theme.spacing(3),
    background: 'linear-gradient(135deg, #f5f5f5, #e8eaf6)',
    borderRadius: 12,
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    border: '1px solid #e0e0e0',
  },
  '& .warning': {
    color: '#d32f2f',
    fontStyle: 'italic',
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    background: 'rgba(211, 47, 47, 0.1)',
    borderRadius: 8,
    border: '1px solid rgba(211, 47, 47, 0.2)',
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '20px 0',
  },
  '& th, & td': {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
}));