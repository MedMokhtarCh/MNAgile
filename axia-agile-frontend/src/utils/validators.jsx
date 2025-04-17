export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password, isEditMode) => {
  return isEditMode ? !password || password.length >= 8 : password.length >= 8;
};

export const validateUser = (user, requiredFields, isEditMode) => {
  const errors = [];

  requiredFields.forEach((field) => {
    if (!user[field] && !(isEditMode && field === 'password')) {
      errors.push(`Le champ ${field} est requis`);
    }
  });

  if (user.email && !validateEmail(user.email)) {
    errors.push("Format d'email invalide");
  }

  if (user.password && !validatePassword(user.password, isEditMode)) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  return errors;
};

export const validateProject = (project, team, isEditMode) => {
  const errors = [];
  const requiredFields = ['title', 'description', 'method'];

  // Validate required fields for new projects
  if (!isEditMode) {
    requiredFields.forEach((field) => {
      if (!project[field]) {
        errors.push(`Le champ ${field} est requis`);
      }
    });
  }

  // Validate method
  const validMethods = ['scrum', 'scrumban', 'kanban'];
  if (project.method && !validMethods.includes(project.method)) {
    errors.push('La méthode agile doit être Scrum, Scrumban ou Kanban');
  }

 

  // Validate team member emails
  const allMembers = [
    ...(team.projectManagers || []),
    ...(team.productOwners || []),
    ...(team.scrumMasters || []),
    ...(team.developers || []),
    ...(team.testers || []),
  ];

  allMembers.forEach((member) => {
    if (!validateEmail(member.email)) {
      errors.push(`L'email ${member.email} est invalide`);
    }
  });

  return errors;
};