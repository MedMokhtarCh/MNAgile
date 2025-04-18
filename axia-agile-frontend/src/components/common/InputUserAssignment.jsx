import React from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Avatar,
  createFilterOptions,
} from '@mui/material';

const filter = createFilterOptions();

const InputUserAssignment = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  getAvatarColor,
  generateInitials,
}) => {
  const safeOptions = options || [];
  const safeValue = value || [];

  return (
    <Autocomplete
      multiple
      options={safeOptions}
      value={safeValue}
      onChange={(event, newValue) => onChange(event, newValue)}
      getOptionLabel={(option) =>
        `${option.nom || ''} ${option.prenom || ''}`.trim() || option.email || ''
      }
      isOptionEqualToValue={(option, val) => option.email === val.email}
      filterOptions={(options, params) => {
        const input = params.inputValue.toLowerCase();
        return options.filter((option) => {
          const fullName = `${option.nom || ''} ${option.prenom || ''}`.toLowerCase();
          const email = (option.email || '').toLowerCase();
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
              <Avatar sx={{ bgcolor: getAvatarColor(option.nom || option.email) }}>
                {generateInitials(option.nom || option.email)}
              </Avatar>
            }
            label={`${option.nom || ''} ${option.prenom || ''}`.trim() || option.email}
            {...getTagProps({ index })}
            sx={{ borderRadius: 16 }}
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props}>
          <Avatar
            sx={{
              bgcolor: getAvatarColor(option.nom || option.email),
              width: 24,
              height: 24,
              fontSize: 12,
              marginRight: 1,
            }}
          >
            {generateInitials(option.nom || option.email)}
          </Avatar>
          {`${option.nom || ''} ${option.prenom || ''}`.trim()} ({option.email})
        </li>
      )}
      sx={{ mb: 2 }}
    />
  );
};

export default InputUserAssignment;
