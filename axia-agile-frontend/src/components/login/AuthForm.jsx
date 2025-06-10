import React from 'react';
import { Box, Grid, Fade, Typography, Button } from '@mui/material';
import {
  StyledButton,
  StyledTextField,
  FormTitle,
  FormSubtitle,
  InputLabel,
  PlanSelector,
  PlanOption,
  EnhancedAlert,
  AlertContent,
  AlertTitle,
  AlertMessage,
  StyledCheckbox,
  ForgotPasswordButton,
  SignUpButton,
} from './theme';

const AuthForm = ({
  formTitle,
  formSubtitle,
  fields,
  onSubmit,
  submitButtonText,
  isLoading,
  alert,
  setAlert,
  getAlertIcon,
  additionalElements,
  footer,
}) => {
  return (
    <Box sx={{ width: '480px', maxWidth: '90%', paddingBottom: '40px' }}>
      <FormTitle variant="h4">{formTitle}</FormTitle>
      <FormSubtitle variant="body1">{formSubtitle}</FormSubtitle>

      <form onSubmit={onSubmit}>
        {additionalElements && additionalElements()}

        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid item xs={12} sm={field.gridSize || 12} key={field.name}>
              <InputLabel>{field.label} {field.required && '*'}</InputLabel>
              <StyledTextField
                fullWidth
                name={field.name}
                type={field.type}
                variant="outlined"
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                size={field.size || 'small'}
                disabled={isLoading}
                required={field.required}
              />
            </Grid>
          ))}
        </Grid>

        <Fade in={alert.open}>
          <Box>
            {alert.open && (
              <EnhancedAlert
                severity={alert.severity}
                icon={getAlertIcon(alert.severity)}
                onClose={() => setAlert({ ...alert, open: false })}
              >
                <AlertContent>
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertMessage>{alert.message}</AlertMessage>
                </AlertContent>
              </EnhancedAlert>
            )}
          </Box>
        </Fade>

        <StyledButton
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? `${submitButtonText}...` : submitButtonText}
        </StyledButton>

        {footer && footer()}
      </form>
    </Box>
  );
};

export default AuthForm;