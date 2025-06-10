
export const isSprintOverdue = (sprint) => {
  if (!sprint?.endDate) return false;
  const endDate = new Date(sprint.endDate);
  const today = new Date();
  return endDate < today;
};

export const findNextUpcomingSprint = (sprints, currentDate) => {
  if (!sprints || sprints.length === 0) return null;
  const upcomingSprints = sprints.filter((sprint) => {
    const endDate = new Date(sprint.endDate);
    return endDate >= currentDate;
  });
  if (upcomingSprints.length === 0) return null;
  return upcomingSprints.reduce((closest, sprint) => {
    const startDate = new Date(sprint.startDate);
    if (!closest) return sprint;
    const closestStartDate = new Date(closest.startDate);
    return Math.abs(startDate - currentDate) < Math.abs(closestStartDate - currentDate)
      ? sprint
      : closest;
  }, null);
};
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return { days: 0, isExpired: true };
  const now = new Date();
  const endDateTime = new Date(endDate);
  const timeDifference = endDateTime - now;

  if (timeDifference <= 0) {
    return { days: 0, isExpired: true };
  }

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return { days, isExpired: false };
};
 export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  } catch {
    return 'Date invalide';
  }
};