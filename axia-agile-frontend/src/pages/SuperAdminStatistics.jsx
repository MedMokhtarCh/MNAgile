import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import PageTitle from '../components/common/PageTitle';
import StatisticsCards from '../components/superAdminDashboard/StatisticsCards';
import AdminDistributionChart from '../components/superAdminDashboard/AdminDistributionChart';
import EnterpriseList from '../components/superAdminDashboard/EnterpriseList';

const UserStatisticsDashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    totalEntreprises: 0
  });
  const [entrepriseData, setEntrepriseData] = useState([]);

  useEffect(() => {
    // Récupération des données du localStorage
    const admins = JSON.parse(localStorage.getItem('admins')) || [];
    
    // Calcul des statistiques
    const activeAdmins = admins.filter(admin => admin.isActive).length;
    
    // Groupement des admins par entreprise
    const entrepriseMap = new Map();
    
    admins.forEach(admin => {
      if (admin.entreprise) {
        if (!entrepriseMap.has(admin.entreprise)) {
          entrepriseMap.set(admin.entreprise, {
            name: admin.entreprise,
            adminCount: 1,
            activeCount: admin.isActive ? 1 : 0,
            admins: [admin]
          });
        } else {
          const data = entrepriseMap.get(admin.entreprise);
          data.adminCount += 1;
          data.activeCount += admin.isActive ? 1 : 0;
          data.admins.push(admin);
          entrepriseMap.set(admin.entreprise, data);
        }
      }
    });
    
    // Conversion en array pour l'affichage
    const entrepriseArray = Array.from(entrepriseMap.values());
    entrepriseArray.sort((a, b) => b.adminCount - a.adminCount);
    
    setStats({
      totalAdmins: admins.length,
      activeAdmins: activeAdmins,
      inactiveAdmins: admins.length - activeAdmins,
      totalEntreprises: entrepriseMap.size
    });
    
    setEntrepriseData(entrepriseArray);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Rapport Statistique des Comptes Admin</PageTitle>
      
      {/* Cartes de statistiques */}
      <StatisticsCards stats={stats} />
      
      {/* Graphiques */}
      <AdminDistributionChart stats={stats} />
      
      {/* Liste des entreprises et de leurs admins */}
      <EnterpriseList entrepriseData={entrepriseData} />
    </Box>
  );
};

export default UserStatisticsDashboard;