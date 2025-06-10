import React from 'react';
import { Typography } from '@mui/material';
import { PlanOption } from './theme';

const PlanLabel = ({ plan, selected, onClick }) => {
  const getPlanLabel = (plan) => {
    switch (plan) {
      case 'annual': return 'Annuel';
      case 'semiannual': return 'Semestriel';
      case 'quarterly': return 'Trimestriel';
      case 'monthly': return 'Mensuel';
      default: return '';
    }
  };

  const getPlanBilling = (plan) => {
    switch (plan) {
      case 'annual': return 'Facturation annuelle';
      case 'semiannual': return 'Facturation semestrielle';
      case 'quarterly': return 'Facturation trimestrielle';
      case 'monthly': return 'Facturation mensuelle';
      default: return '';
    }
  };

  const getPlanFeature = (plan) => {
    switch (plan) {
      case 'annual': return 'Économie maximale';
      case 'semiannual': return 'Engagement moyen';
      case 'quarterly': return 'Option équilibrée';
      case 'monthly': return 'Sans engagement';
      default: return '';
    }
  };

  return (
    <PlanOption key={plan} selected={selected} onClick={onClick}>
      <Typography variant="subtitle2" fontWeight={600} color="#1A237E">
        {getPlanLabel(plan)}
      </Typography>
      <Typography variant="body2" color="#5c7999" sx={{ my: 0.5 }}>
        {getPlanBilling(plan)}
      </Typography>
      <Typography variant="caption" color="#4CAF50" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
        {getPlanFeature(plan)}
      </Typography>
    </PlanOption>
  );
};

export default PlanLabel;