import React from 'react';
import { Autocomplete, TextField, Chip, Avatar } from '@mui/material';

const InputUserAssignment = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  getAvatarColor,
  generateInitials,
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = Array.isArray(value) ? value : [];

  // Helper function to get full name
  const getFullName = (option) => {
    if (option.firstName && option.lastName) {
      return `${option.firstName} ${option.lastName}`;
    }
    if (option.nom && option.prenom) {
      return `${option.nom} ${option.prenom}`;
    }
    return option.email || 'Utilisateur inconnu';
  };

  return (
    <Autocomplete
      multiple
      options={safeOptions}
      value={safeValue}
      onChange={onChange}
      getOptionLabel={(option) => `${getFullName(option)} (${option.email})`}
      isOptionEqualToValue={(option, val) => option.email === (val.email || val)}
      filterOptions={(options, params) => {
        const input = params.inputValue.toLowerCase();
        return options.filter((option) => {
          const fullName = getFullName(option).toLowerCase();
          const email = option.email?.toLowerCase() || '';
          return fullName.includes(input) || email.includes(input);
        });
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            key={option.email || index}
            avatar={
              <Avatar sx={{ bgcolor: getAvatarColor(getFullName(option)) }}>
                {generateInitials(getFullName(option))}
              </Avatar>
            }
            label={getFullName(option)}
            {...getTagProps({ index })}
            sx={{ borderRadius: 16 }}
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props}>
          <Avatar
            sx={{
              bgcolor: getAvatarColor(getFullName(option)),
              width: 24,
              height: 24,
              fontSize: 12,
              marginRight: 1,
            }}
          >
            {generateInitials(getFullName(option))}
          </Avatar>
          {`${getFullName(option)} (${option.email})`}
        </li>
      )}
      sx={{ mb: 2 }}
    />
  );
};

export default InputUserAssignment;