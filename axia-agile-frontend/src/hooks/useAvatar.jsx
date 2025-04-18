import { useMemo } from 'react';

export const useAvatar = () => {
  const colorCache = useMemo(() => new Map(), []);

  const generateInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      const first = parts[0][0] || '';
      const second = parts[0][1] || '';
      return (first + second).toUpperCase();
    }
  };

  const getAvatarColor = (identifier) => {
    if (colorCache.has(identifier)) {
      return colorCache.get(identifier);
    }

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
    const normalizedIdentifier = (identifier || '').trim().toLowerCase();
    let sum = 0;
    for (let i = 0; i < normalizedIdentifier.length; i++) {
      sum += normalizedIdentifier.charCodeAt(i);
    }
    const color = colors[sum % colors.length];
    colorCache.set(identifier, color);
    return color;
  };

  return { generateInitials, getAvatarColor };
};