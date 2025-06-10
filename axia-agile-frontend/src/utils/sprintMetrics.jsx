import { calculateTaskCost } from "./estimatedcost-tasks";
export const getSprintMetrics = (sprint, tasks, projectUsers) => {
  if (!sprint || !tasks) {
    console.warn('[getSprintMetrics] Invalid sprint or tasks:', { sprint, tasks });
    return {
      sprintTasks: [],
      completedTasks: [],
      inProgressTasks: [],
      blockedTasks: [],
      totalCost: 0,
      completionRate: 0,
    };
  }

  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id) || [];
  const completedTasks = sprintTasks.filter((task) => task.status === 'Terminé') || [];
  const inProgressTasks = sprintTasks.filter((task) => task.status === 'En cours') || [];
  const blockedTasks = sprintTasks.filter((task) => task.status === 'Bloqué') || [];

  const totalCost = sprintTasks.reduce((sum, task) => {
    const assignedUsers = projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [];
    const taskCost = calculateTaskCost(assignedUsers, task.startDate, task.endDate, task.status);
    if (isNaN(taskCost)) {
      console.warn('[getSprintMetrics] Invalid task cost:', { taskId: task.id, taskCost, assignedUsers });
      return sum;
    }
    return sum + taskCost;
  }, 0);

  const completionRate = sprintTasks.length > 0 ? 
    (completedTasks.length / sprintTasks.length) * 100 : 0;

  return {
    sprintTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    totalCost,
    completionRate,
  };
};

export const getOverallMetrics = (sprints, tasks, projectUsers) => {
  if (!sprints || !tasks) {
    console.warn('[getOverallMetrics] Invalid sprints or tasks:', { sprints, tasks });
    return {
      totalTasks: 0,
      totalCompleted: 0,
      totalCost: 0,
      overallCompletionRate: 0,
    };
  }

  const metrics = sprints.reduce(
    (acc, sprint) => {
      const sprintMetrics = getSprintMetrics(sprint, tasks, projectUsers);
      acc.totalTasks += sprintMetrics.sprintTasks.length;
      acc.totalCompleted += sprintMetrics.completedTasks.length;
      acc.totalCost += sprintMetrics.totalCost;
      return acc;
    },
    { totalTasks: 0, totalCompleted: 0, totalCost: 0 }
  );

  const totalProjectCost = tasks.reduce((sum, task) => {
    const assignedUsers = projectUsers.filter((u) => task.assignedUserEmails?.includes(u.email)) || [];
    const taskCost = calculateTaskCost(assignedUsers, task.startDate, task.endDate, task.status);
    if (isNaN(taskCost)) {
      console.warn('[getOverallMetrics] Invalid task cost:', { taskId: task.id, taskCost, assignedUsers });
      return sum;
    }
    return sum + taskCost;
  }, 0);

  const overallCompletionRate = metrics.totalTasks > 0 ? 
    (metrics.totalCompleted / metrics.totalTasks) * 100 : 0;

  return {
    ...metrics,
    totalCost: totalProjectCost,
    overallCompletionRate,
  };
};