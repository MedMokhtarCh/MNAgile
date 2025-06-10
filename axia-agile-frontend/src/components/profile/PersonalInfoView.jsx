import React from 'react';
import { Grid, Card, CardHeader, CardContent } from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import InfoField from './InfoField';

const PersonalInfoView = ({ profile }) => {
  return (
    <Card>
      <CardHeader title="Informations personnelles" />
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <InfoField label="Prénom" value={profile.firstName} icon={<PersonIcon />} />
            <InfoField label="Nom" value={profile.lastName} icon={<PersonIcon />} />
            <InfoField label="Email" value={profile.email} icon={<EmailIcon />} />
            <InfoField label="Téléphone" value={profile.phoneNumber} icon={<PhoneIcon />} />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoField label="Titre de poste" value={profile.jobTitle} icon={<WorkIcon />} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoView;