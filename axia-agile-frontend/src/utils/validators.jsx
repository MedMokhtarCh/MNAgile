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

export const validateProject = (project, step) => {
  const errors = [];

  if (step === 0) {
    if (!project.title) {
      errors.push('Le nom du projet est requis.');

    }
  }


  

  return errors;
};