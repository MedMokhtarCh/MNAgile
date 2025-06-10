import { styled } from '@mui/material/styles';
import { Button, Dialog } from '@mui/material';

// Styled Button
export const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
  padding: theme.spacing(0.8, 1.8),
  fontWeight: 500,
}));

// Styled Dialog
export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    msOverflowStyle: 'none',
  },
  '& .MuiDialog-paper': {
    borderRadius: 12,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[10],
  },
}));