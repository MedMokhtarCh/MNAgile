import React from 'react';
    import {
      Dialog,
      DialogTitle,
      DialogContent,
      DialogContentText,
      DialogActions,
      Button,
      CircularProgress,
    } from '@mui/material';

    const ValidationDialog = ({ openDialog, handleCloseDialog, handleValidateSubscription, validating }) => {
      return (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="validate-subscription-dialog-title"
          aria-describedby="validate-subscription-dialog-description"
        >
          <DialogTitle id="validate-subscription-dialog-title">
            Confirmer la validation
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="validate-subscription-dialog-description">
              Êtes-vous sûr de vouloir valider cet abonnement ? Cette action ne peut pas être annulée.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary" disabled={validating}>
              Annuler
            </Button>
            <Button
              onClick={handleValidateSubscription}
              color="primary"
              autoFocus
              disabled={validating}
            >
              {validating ? <CircularProgress size={24} /> : 'Valider'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    export default ValidationDialog;