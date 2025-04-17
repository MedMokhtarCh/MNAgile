
export const authService = {
    authenticateSuperAdmin: (email, password) => {
      return email === 'superadmin@gmail.com' && password === 'superadmin123';
    },
  
    authenticateAdmin: (email, password) => {
      const storedAdmins = JSON.parse(localStorage.getItem('admins')) || [];
      return storedAdmins.find((admin) => admin.email === email && admin.password === password);
    },
  
    authenticateUser: (email, password) => {
      const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const user = storedUsers.find((user) => user.email === email && user.password === password);
      return user
        ? {
            id: user.id,
            email: user.email,
            password: user.password,
            nom: user.nom || '',
            prenom: user.prenom || '',
            telephone: user.telephone || '',
            role: user.role || 'user',
            jobTitle: user.jobTitle || '',
            permissions: user.permissions || [],
            isActive: user.isActive !== undefined ? user.isActive : true,
            dateCreated: user.dateCreated || new Date().toISOString(),
            lastLogin: user.lastLogin || null,
            createdBy: user.createdBy || '',
          }
        : null;
    },
  };
  
  export const roleConfig = {
    superadmin: {
      welcomeMessage: 'Bienvenue sur AxiaAgile, Super Admin !',
      token: 'fake-superadmin-jwt-token',
      redirectPath: '/SuperAdminStatistics',
    },
    admin: {
      welcomeMessage: 'Bienvenue sur AxiaAgile, Administrateur !',
      token: 'fake-admin-jwt-token',
      redirectPath: '/UserStatisticsDashboard',
    },
    chef_projet: {
      welcomeMessage: 'Bienvenue sur AxiaAgile, Chef de Projet !',
      token: 'fake-chef_projet-jwt-token',
      redirectPath: '/dashboard',
    },
    default: {
      welcomeMessage: 'Bienvenue sur AxiaAgile, Utilisateur !',
      token: 'fake-user-jwt-token',
      redirectPath: '/projects',
    },
  };