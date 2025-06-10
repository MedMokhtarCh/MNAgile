import React from 'react';
    import {
      Dialog,
      DialogTitle,
      DialogContent,
      DialogContentText,
      DialogActions,
      Button,
      FormControl,
      InputLabel,
      Select,
      MenuItem,
      CircularProgress,
    } from '@mui/material';

    const RenewalDialog = ({
      renewDialogOpen,
      handleCloseRenewDialog,
      handleRenewSubscription,
      selectedPlan,
      setSelectedPlan,
      renewing,
    }) => {
      return (
        <Dialog
          open={renewDialogOpen}
          onClose={handleCloseRenewDialog}
          aria-labelledby="renew-subscription-dialog-title"
          aria-describedby="renew-subscription-dialog-description"
        >
          <DialogTitle id="renew-subscription-dialog-title">
            Renouveler l'abonnement
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="renew-subscription-dialog-description" sx={{ mb: 2 }}>
              Sélectionnez un nouveau plan pour renouveler l'abonnement.
            </DialogContentText>
            <FormControl fullWidth >
              <InputLabel id="plan-select-label">Plan d'abonnement</InputLabel>
              <Select
                labelId="plan-select-label"
                id="plan-select"
                value={selectedPlan}
                label="Plan d'abonnement"
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <MenuItem value="monthly">Mensuel</MenuItem>
                <MenuItem value="quarterly">Trimestriel</MenuItem>
                <MenuItem value="semiannual">Semestriel</MenuItem>
                <MenuItem value="annual">Annuel</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRenewDialog} color="secondary" disabled={renewing}>
              Annuler
            </Button>
            <Button
              onClick={handleRenewSubscription}
              color="primary"
              autoFocus
              disabled={renewing}
            >
              {renewing ? <CircularProgress size={24} /> : 'Renouveler'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    export default RenewalDialog;