
export const mapRoleIdToRole = (roleId) => {
  switch (roleId) {
    case 1: return 'superadmin';
    case 2: return 'admin';
    case 3: return 'chef_projet';
    case 4: return 'user';
    default: return null;
  }
};