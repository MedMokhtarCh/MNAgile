export const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id ?? user.Id,
    email: user.email ?? user.Email,
    firstName: user.firstName ?? user.FirstName ?? '',
    lastName: user.lastName ?? user.LastName ?? '',
    phoneNumber: user.phoneNumber ?? user.PhoneNumber ?? '',
    jobTitle: user.jobTitle ?? user.JobTitle ?? user.jobTitle ?? '',
    entreprise: user.entreprise ?? user.Entreprise ?? '',
    isActive: user.isActive ?? user.IsActive ?? true,
    roleId: user.roleId ?? user.RoleId ?? 4,
    claimIds: user.claimIds ?? user.ClaimIds ?? [],
    dateCreated: user.dateCreated ?? user.DateCreated ?? new Date().toISOString(),
    lastLogin: user.lastLogin ?? user.LastLogin ?? null,
    createdById: user.createdById ?? user.CreatedById ?? null,
    rootAdminId: user.rootAdminId ?? user.RootAdminId ?? null,
    subscription: user.Subscription ? normalizeSubscription(user.Subscription) : null,
    costPerHour: user.CostPerHour ?? user.costPerHour ?? null,
    costPerDay: user.CostPerDay ?? user.costPerDay ?? null,
  };
};

export const normalizeSubscription = (sub) => {
  if (!sub) return null;
  return {
    id: sub.id ?? sub.Id,
    userId: sub.userId ?? sub.UserId,
    plan: sub.plan ?? sub.Plan ?? 'annual',
    status: sub.status ?? sub.Status ?? 'Pending',
    startDate: sub.startDate ?? sub.StartDate ?? new Date().toISOString(),
    endDate: sub.endDate ?? sub.EndDate ?? '',
    user: sub.User ? {
      id: sub.User.id ?? sub.User.Id,
      email: sub.User.email ?? sub.User.Email,
      firstName: sub.User.firstName ?? sub.User.FirstName,
      lastName: sub.User.lastName ?? sub.User.LastName,
      entreprise: sub.User.entreprise ?? sub.User.Entreprise,
    } : null,
  };
};



// Normalize role data
export const normalizeRole = (role) => {
  if (!role) return null;
  return {
    id: role.id ?? role.Id,
    label: role.name ?? role.Name,
    name: role.name ?? role.Name,
    createdByUserId: role.createdByUserId ?? role.CreatedByUserId,
    iconName: role.iconName ??
      (role.id === 1 ? 'Security' :
        role.id === 2 ? 'Security' :
          role.id === 3 ? 'SupervisorAccount' : 'Person'),
    disabled: role.disabled ?? false,
  };
};

export const normalizeClaim = (claim) => {
  if (!claim) return null;
  return {
    id: claim.id ?? claim.Id,
    name: claim.name ?? claim.Name,
    description: claim.description ?? claim.Description ?? '',
  };
};

export const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const GetSubscriptionDuration = (plan) => {
  switch (plan.toLowerCase()) {
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
    case 'quarterly':
      return 90 * 24 * 60 * 60 * 1000;
    case 'semiannual':
      return 180 * 24 * 60 * 60 * 1000;
    case 'annual':
      return 365 * 24 * 60 * 60 * 1000;
    default:
      throw new Error('Invalid subscription plan.');
  }
};
export const normalizePriority = (priority) => {
  if (!priority) return 'MEDIUM';
  const priorityMap = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return priorityMap[priority.toUpperCase()] || 'MEDIUM';
};
