import { styled, keyframes } from '@mui/system';
import { Button, TextField, Typography, Box, Checkbox, Alert } from '@mui/material';

// Shared styled components for Login and Subscribe
export const StyledButton = styled(Button)({
  padding: '12px 0',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
});

export const StyledTextField = styled(TextField)({
  marginBottom: 16,
  '& .MuiOutlinedInput-root': { 
    borderRadius: 8, 
    '&:hover': { 
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#5B9BD5' } 
    } 
  },
  '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1.5px' },
  '& .MuiInputLabel-root': { color: '#2c4b6f' },
  '& .MuiInputBase-input': { padding: '12px' },
});

export const FormTitle = styled(Typography)({
  fontWeight: 700,
  color: '#1A237E',
  marginBottom: '5px',
  fontSize: '1.8rem',
});

export const FormSubtitle = styled(Typography)({
  color: '#5c7999',
  fontWeight: 500,
  marginBottom: '20px',
  fontSize: '0.95rem',
});

export const InputLabel = styled(Typography)({
  fontWeight: 600,
  color: '#2c4b6f',
  marginBottom: '4px',
  fontSize: '0.95rem',
});

// Subscribe-specific styled components
export const PlanSelector = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
  gap: '12px',
});

export const PlanOption = styled(Box)(({ selected }) => ({
  flex: 1,
  padding: '12px',
  border: '2px solid',
  borderColor: selected ? '#1A237E' : '#e0e0e0',
  borderRadius: '8px',
  backgroundColor: selected ? 'rgba(26, 35, 126, 0.05)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: '#5B9BD5',
    transform: 'translateY(-2px)',
  },
}));

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
`;

export const EnhancedAlert = styled(Alert)(({ severity }) => ({
  marginBottom: '16px',
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-200px',
    width: '200px',
    height: '100%',
    background: severity === 'success' 
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
      : severity === 'error'
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    animation: `${shimmer} 2s infinite`,
  },
  ...(severity === 'success' && {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'error' && {
    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'warning' && {
    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
  ...(severity === 'info' && {
    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    color: 'white',
    '& .MuiAlert-icon': {
      color: 'white',
      fontSize: '24px',
    },
  }),
}));

export const AlertContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const AlertTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: '1rem',
  marginBottom: '2px',
});

export const AlertMessage = styled(Typography)({
  fontSize: '0.9rem',
  opacity: 0.95,
  lineHeight: 1.4,
});

// Login-specific styled components
export const StyledCheckbox = styled(Checkbox)({
  color: '#5B9BD5',
  '&.Mui-checked': { color: '#1A237E' },
});

export const ForgotPasswordButton = styled(Button)({
  color: '#1A237E',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { backgroundColor: 'rgba(27, 94, 182, 0.1)' },
});

export const SignUpButton = styled(Button)({
  color: '#1A237E',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { backgroundColor: 'rgba(27, 94, 182, 0.1)' },
});