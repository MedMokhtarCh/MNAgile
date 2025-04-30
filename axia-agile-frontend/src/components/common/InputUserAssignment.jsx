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
  const safeOptions = options || [];
  const safeValue = value || [];

  return (
    <Autocomplete
      multiple
      options={safeOptions}
      value={safeValue}
      onChange={onChange}
      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
      isOptionEqualToValue={(option, val) => option.email === val.email}
      filterOptions={(options, params) => {
        const input = params.inputValue.toLowerCase();
        return options.filter((option) => {
          const fullName = `${option.firstName} ${option.lastName}`.toLowerCase();
          const email = option.email.toLowerCase();
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
            key={option.email}
            avatar={
              <Avatar sx={{ bgcolor: getAvatarColor(`${option.firstName} ${option.lastName}`) }}>
                {generateInitials(`${option.firstName} ${option.lastName}`)}
              </Avatar>
            }
            label={`${option.firstName} ${option.lastName}`}
            {...getTagProps({ index })}
            sx={{ borderRadius: 16 }}
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props}>
          <Avatar
            sx={{
              bgcolor: getAvatarColor(`${option.firstName} ${option.lastName}`),
              width: 24,
              height: 24,
              fontSize: 12,
              marginRight: 1,
            }}
          >
            {generateInitials(`${option.firstName} ${option.lastName}`)}
          </Avatar>
          {`${option.firstName} ${option.lastName} (${option.email})`}
        </li>
      )}
      sx={{ mb: 2 }}
    />
  );
};

export default InputUserAssignment;