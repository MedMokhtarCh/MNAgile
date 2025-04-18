// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  Grid,
  Container,
  useTheme,
  CircularProgress,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardHeader,
  CardContent,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Place as PlaceIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [profileImage, setProfileImage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [editData, setEditData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    entreprise: "",
    adresse: "",
    jobTitle: "",
  });

  useEffect(() => {
    console.log("Profile component mounted");
    const loadUserData = () => {
      try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        console.log("Current user from localStorage:", user);

        if (!user || !user.email) {
          console.log("No valid user found, redirecting to /login");
          navigate("/Login");
          return;
        }

        let fullUserData = user;
        if (user.role === "admin" || user.role === "superadmin") {
          const admins = JSON.parse(localStorage.getItem("admins")) || [];
          fullUserData = admins.find((admin) => admin.email === user.email) || user;
        } else {
          const users = JSON.parse(localStorage.getItem("users")) || [];
          fullUserData = users.find((u) => u.email === user.email) || user;
        }

        console.log("Full user data:", fullUserData);
        setCurrentUser(fullUserData);
        setEditData({
          nom: fullUserData.nom || "",
          prenom: fullUserData.prenom || "",
          email: fullUserData.email || "",
          telephone: fullUserData.telephone || "",
          entreprise: fullUserData.entreprise || "",
          adresse: fullUserData.adresse || "",
          jobTitle: fullUserData.jobTitle || "",
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Erreur lors du chargement du profil");
        setLoading(false);
      }
    };

    setLoading(true);
    loadUserData();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      setEditData({
        nom: currentUser.nom || "",
        prenom: currentUser.prenom || "",
        email: currentUser.email || "",
        telephone: currentUser.telephone || "",
        entreprise: currentUser.entreprise || "",
        adresse: currentUser.adresse || "",
        jobTitle: currentUser.jobTitle || "",
      });
    }
  };

  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSaveProfile = () => {
    try {
      const updatedUserData = {
        ...currentUser,
        nom: editData.nom,
        prenom: editData.prenom,
        email: editData.email,
        telephone: editData.telephone,
        jobTitle: editData.jobTitle,
        entreprise: editData.entreprise,
        adresse: editData.adresse,
      };

      if (profileImage) {
        updatedUserData.profileImage = profileImage;
      }

      localStorage.setItem("currentUser", JSON.stringify(updatedUserData));

      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
        const admins = JSON.parse(localStorage.getItem("admins")) || [];
        const updatedAdmins = admins.map((admin) =>
          admin.email === currentUser.email ? { ...admin, ...updatedUserData } : admin
        );
        localStorage.setItem("admins", JSON.stringify(updatedAdmins));
      } else {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const updatedUsers = users.map((user) =>
          user.email === currentUser.email ? { ...user, ...updatedUserData } : user
        );
        localStorage.setItem("users", JSON.stringify(updatedUsers));
      }

      setCurrentUser(updatedUserData);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Erreur lors de la sauvegarde du profil");
    }
  };

  const handleChangePassword = () => {
    if (passwordData.currentPassword !== currentUser.password) {
      alert("Le mot de passe actuel est incorrect");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    try {
      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
        const admins = JSON.parse(localStorage.getItem("admins")) || [];
        const updatedAdmins = admins.map((admin) =>
          admin.email === currentUser.email ? { ...admin, password: passwordData.newPassword } : admin
        );
        localStorage.setItem("admins", JSON.stringify(updatedAdmins));
      } else {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const updatedUsers = users.map((user) =>
          user.email === currentUser.email ? { ...user, password: passwordData.newPassword } : user
        );
        localStorage.setItem("users", JSON.stringify(updatedUsers));
      }

      const updatedUser = { ...currentUser, password: passwordData.newPassword };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      handleClosePasswordDialog();
      alert("Mot de passe changé avec succès");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Erreur lors du changement de mot de passe");
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    console.log("Profile is in loading state");
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
            flexDirection: "column",
          }}
        >
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Chargement du profil...</Typography>
        </Box>
      </Container>
    );
  }

  const InfoField = ({ label, value, icon }) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      {icon && (
        <Box sx={{ mr: 2, color: "text.secondary" }}>
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value || "—"}</Typography>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 4, position: "relative", overflow: "visible" }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            p: 3,
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profileImage || currentUser.profileImage}
              sx={{
                width: 100,
                height: 100,
                fontSize: 40,
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
              }}
            >
              {(currentUser.prenom?.charAt(0) || "") + (currentUser.nom?.charAt(0) || currentUser.email.charAt(0))}
            </Avatar>

            {editMode && (
              <label htmlFor="upload-photo">
                <input
                  style={{ display: "none" }}
                  id="upload-photo"
                  name="upload-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  sx={{
                    position: "absolute",
                    right: -10,
                    bottom: -10,
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "background.default" },
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            )}
          </Box>

          <Box sx={{ ml: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              {(currentUser.prenom || "") + " " + (currentUser.nom || "")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
              <EmailIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body1" color="text.secondary">
                {currentUser.email}
              </Typography>
            </Box>
          </Box>

          <IconButton
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              bgcolor: editMode ? theme.palette.error.light : theme.palette.primary.light,
              color: editMode ? theme.palette.error.contrastText : theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: editMode ? theme.palette.error.main : theme.palette.primary.main,
              },
            }}
            onClick={toggleEditMode}
          >
            {editMode ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Informations personnelles" />
          <Tab label="Mot de passe" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {!editMode ? (
            <Card>
              <CardHeader title="Informations personnelles" />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <InfoField label="Prénom" value={currentUser.prenom} icon={<PersonIcon />} />
                    <InfoField label="Nom" value={currentUser.nom} icon={<PersonIcon />} />
                    <InfoField label="Email" value={currentUser.email} icon={<EmailIcon />} />
                    <InfoField label="Téléphone" value={currentUser.telephone} icon={<PhoneIcon />} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {(currentUser.role === "admin" || currentUser.role === "chef_projet" || currentUser.role === "user") && (
                      <>
                        <InfoField label="Titre de poste" value={currentUser.jobTitle} icon={<WorkIcon />} />
                        <InfoField label="Entreprise" value={currentUser.entreprise} icon={<BusinessIcon />} />
                        <InfoField label="Adresse" value={currentUser.adresse} icon={<PlaceIcon />} />
                      </>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Modifier vos informations" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      name="prenom"
                      value={editData.prenom}
                      onChange={handleEditChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      name="nom"
                      value={editData.nom}
                      onChange={handleEditChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={editData.email}
                      onChange={handleEditChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                    />
                  </Grid>

                  {currentUser.role !== "superadmin" && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Téléphone"
                        name="telephone"
                        value={editData.telephone}
                        onChange={handleEditChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Grid>
                  )}

                  {(currentUser.role === "admin" || currentUser.role === "chef_projet" || currentUser.role === "user") && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Titre de poste"
                          name="jobTitle"
                          value={editData.jobTitle}
                          onChange={handleEditChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <WorkIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Entreprise"
                          name="entreprise"
                          value={editData.entreprise}
                          onChange={handleEditChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Adresse"
                          name="adresse"
                          value={editData.adresse}
                          onChange={handleEditChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PlaceIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                          variant="outlined"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={toggleEditMode}>
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    startIcon={<SaveIcon />}
                  >
                    Enregistrer
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Sécurité" />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium">
                Mot de passe
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Modifiez votre mot de passe pour sécuriser votre compte.
              </Typography>

              <Button variant="outlined" startIcon={<LockIcon />} onClick={handleOpenPasswordDialog}>
                Changer le mot de passe
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />
          </CardContent>
        </Card>
      )}

      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Mot de passe actuel"
              type={showPassword.current ? "text" : "password"}
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClickShowPassword("current")} edge="end">
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showPassword.new ? "text" : "password"}
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClickShowPassword("new")} edge="end">
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showPassword.confirm ? "text" : "password"}
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              margin="normal"
              error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ""}
              helperText={
                passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ""
                  ? "Les mots de passe ne correspondent pas"
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClickShowPassword("confirm")} edge="end">
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClosePasswordDialog}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;