export const calculateTaskCost = (assignedUsers, startDate, endDate, status) => {
  if (!assignedUsers || assignedUsers.length === 0 || !startDate || !endDate) {
    console.warn('calculateTaskCost - Missing required data:', { assignedUsers, startDate, endDate });
    return 0;
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      console.warn('calculateTaskCost - Invalid dates:', { start, end });
      return 0;
    }

    // Calculate duration in hours
    const durationHours = (end - start) / (1000 * 60 * 60);

    // Calculate duration in days (partial days allowed)
    const durationDays = durationHours / 24;

    let totalCost = 0;
    let missingCostData = false;

    assignedUsers.forEach(user => {
      if (!user) {
        console.warn('calculateTaskCost - Null user encountered');
        return;
      }

      let userCost = 0;

      // Prefer costPerHour for precise calculations
      if (user.costPerHour !== undefined && user.costPerHour !== null) {
        userCost = user.costPerHour * durationHours;
        console.log('calculateTaskCost - Using costPerHour:', {
          email: user.email,
          costPerHour: user.costPerHour,
          durationHours,
          userCost,
        });
      } else if (user.costPerDay !== undefined && user.costPerDay !== null) {
        // Use costPerDay for full or partial days
        userCost = user.costPerDay * durationDays;
        console.log('calculateTaskCost - Using costPerDay:', {
          email: user.email,
          costPerDay: user.costPerDay,
          durationDays,
          userCost,
        });
      } else {
        missingCostData = true;
        console.warn('calculateTaskCost - No cost data for user:', user);
      }

      totalCost += userCost;
    });

    if (missingCostData) {
      console.warn('calculateTaskCost - Some users lack costPerDay or costPerHour, contributing 0 to total cost.');
    }

    return Math.round(totalCost * 100) / 100;
  } catch (error) {
    console.error('calculateTaskCost - Error:', error);
    return 0;
  }
};