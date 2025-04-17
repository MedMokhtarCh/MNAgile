export const useAvatar = () => {
    const generateInitials = (name) => {
      if (!name) return '??';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    };
  
    const getAvatarColor = (name) => {
      const colors = [
        '#3f51b5',
        '#2196f3',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#8bc34a',
        '#ff9800',
        '#ff5722',
        '#795548',
      ];
      let sum = 0;
      for (let i = 0; i < (name || '').length; i++) {
        sum += name.charCodeAt(i);
      }
      return colors[sum % colors.length];
    };
  
    return { generateInitials, getAvatarColor };
  };