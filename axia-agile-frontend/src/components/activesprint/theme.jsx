export const sprintCardStyles = {
  paper: (isExpired) => ({
    p: 3,
    mb: 3,
    borderRadius: 2,
    borderLeft: `5px solid ${isExpired ? '#F44336' : '#2196F3'}`,
  }),
  chipHigh: {
    bgcolor: '#F44336',
    color: 'white',
    minWidth: 100,
  },
  chipMedium: {
    bgcolor: '#FFC107',
    color: 'black',
    minWidth: 100,
  },
  chipLow: {
    bgcolor: '#4CAF50',
    color: 'white',
    minWidth: 100,
  },
  noSprintPaper: {
    p: 3,
    mb: 3,
    borderRadius: 2,
    borderLeft: '5px solid #B0BEC5',
  },
};