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
  // Ensure options and value are defined
  const safeOptions = options || [];
  const safeValue = value || [];

  return (
    <Autocomplete
      multiple
      options={safeOptions}
      getOptionLabel={(option) => `${option.nom} ${option.prenom}` || option.email || ''}
      isOptionEqualToValue={(option, val) => option.email === val.email}
      value={safeValue}
      onChange={(event, newValue) => onChange(event, newValue)}
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
              <Avatar sx={{ bgcolor: getAvatarColor(option.nom || option.email) }}>
                {generateInitials(option.nom || option.email)}
              </Avatar>
            }
            label={`${option.nom} ${option.prenom}` || option.email}
            {...getTagProps({ index })}
            sx={{ borderRadius: 16 }}
          />
        ))
      }
      sx={{ mb: 2 }}
    />
  );
};

export default InputUserAssignment;