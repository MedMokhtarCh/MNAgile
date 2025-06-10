import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { Box, Snackbar, Alert } from '@mui/material';
import {
  fetchChannels,
  fetchChannelMessages,
  fetchChannelMembers,
  sendMessage,
  createChannel,
  deleteChannel,
  updateChannel,
  initializeSignalR,
  selectChannels,
  selectConnectionStatus,
  selectChatError,
  selectChannelMembers,
} from '../store/slices/chatSlice';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { useNotification } from '../hooks/useNotifications';
import signalRService from '../services/signalRService';
import sendSound from '../assets/sounds/send.mp3';
import receiveSound from '../assets/sounds/receive.mp3';
import { ChatContainer } from '../components/chat/theme';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/chatInput';
import ChatHeader from '../components/chat/ChatHeader';
import ChatDialogs from '../components/chat/ChatDialogs';
import ChatMembersList from '../components/chat/ChatMembersList';
import { playAudio } from '../components/chat/theme';

// Utility to parse JWT token
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

const GroupDiscussion = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { createNotification } = useNotification();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
  const [updateChannelDialogOpen, setUpdateChannelDialogOpen] = useState(false);
  const [deleteChannelDialogOpen, setDeleteChannelDialogOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedChannelForMenu, setSelectedChannelForMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendAudioRef = useRef(new Audio(sendSound));
  const receiveAudioRef = useRef(new Audio(receiveSound));

  // Redux Selectors
  const channels = useSelector(selectChannels);
  const selectedChannel = useSelector((state) => state.chat.selectedChannel);
  const connectionStatus = useSelector(selectConnectionStatus);
  const chatError = useSelector(selectChatError);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const users = useSelector((state) => state.users.users);
  const channelMembers = useSelector((state) =>
    selectedChannel ? selectChannelMembers(state, selectedChannel.id) : []
  );

  // Check claims
  const hasCanCommunicate = Array.isArray(currentUser?.claims) && currentUser.claims.includes('CanCommunicate');
  const hasCanCreateChannel = Array.isArray(currentUser?.claims) && currentUser.claims.includes('CanCreateChannel');

  // Log JWT token and claims
  useEffect(() => {
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)AuthToken\s*=\s*([^;]*).*$)|^.*$/, '$1');
    console.log('JWT Token:', token);
    if (token) {
      const decoded = parseJwt(token);
      console.log('JWT Decoded:', decoded);
      console.log('JWT User ID:', decoded?.sub || decoded?.nameidentifier);
      console.log('Current User ID:', currentUser?.id);
      console.log('Claims from JWT:', decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded?.roles);
    }
  }, [currentUser]);

  // Initialization
  useEffect(() => {
    dispatch(fetchChannels());
    dispatch(fetchCurrentUser());
    dispatch(fetchUsers({}));
    dispatch(initializeSignalR());
  }, [dispatch]);

  // Fetch Messages, Members, and Join Channel
  useEffect(() => {
    if (selectedChannel?.id) {
      dispatch(fetchChannelMessages(selectedChannel.id));
      dispatch(fetchChannelMembers(selectedChannel.id));
      if (signalRService.isConnected()) {
        signalRService.connection.invoke('JoinChannel', selectedChannel.id)
          .catch(err => console.error('Failed to join channel:', err));
      }
    }
  }, [dispatch, selectedChannel]);

  // Handle Errors
  useEffect(() => {
    if (chatError) {
      setErrorMessage(chatError);
      setErrorSnackbarOpen(true);
    }
  }, [chatError]);

  // Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChannel]);

  // Preload Audio Files
  useEffect(() => {
    const preloadAudio = async (audio, type) => {
      try {
        await audio.load();
        console.log(`${type} audio loaded successfully`);
      } catch (error) {
        console.error(`Failed to load ${type} audio:`, error);
      }
    };
    preloadAudio(sendAudioRef.current, 'send');
    preloadAudio(receiveAudioRef.current, 'receive');
  }, []);

  // Handle Received Messages for Sound
  useEffect(() => {
    const handleMessageReceived = (message) => {
      console.log('Received message:', message);
      console.log('Current user ID:', currentUser?.id, 'Message sender ID:', message.senderId);
      if (String(message.senderId) !== String(currentUser?.id)) {
        playAudio(receiveAudioRef.current, 'receive');
      } else {
        console.log('Skipping receive sound: Message is from current user');
      }
    };

    let unsubscribe;
    if (signalRService.isConnected()) {
      console.log('Registering onMessageReceived callback');
      unsubscribe = signalRService.onMessageReceived(handleMessageReceived);
    } else {
      console.log('SignalR not connected, cannot register onMessageReceived');
    }

    return () => {
      if (unsubscribe) {
        console.log('Unregistering onMessageReceived callback');
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Enhanced Debug Logging
  useEffect(() => {
    console.log('Current User (Raw):', currentUser);
    console.log('Current User (Parsed):', {
      id: currentUser?.id,
      idType: typeof currentUser?.id,
      claims: currentUser?.claims,
      hasCanCreateChannel
    });
    console.log('Selected Channel (Raw):', selectedChannel);
    console.log('Selected Channel (Parsed):', {
      id: selectedChannel?.id,
      creatorId: selectedChannel?.creatorId,
      creatorIdType: typeof selectedChannel?.creatorId,
      name: selectedChannel?.name
    });
  }, [currentUser, selectedChannel, hasCanCreateChannel]);

  // Notify users added to a channel
  const notifyChannelUsers = async (channelId, channelName, memberIds, isEditing = false) => {
    // Wait for users to be fetched if still loading
    if (users.length === 0) {
      console.log('Waiting for users to load before sending notifications...');
      await new Promise((resolve) => {
        const checkUsers = setInterval(() => {
          if (users.length > 0) {
            clearInterval(checkUsers);
            resolve();
          }
        }, 100);
      });
    }

    const senderName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'Utilisateur inconnu';

    for (const userId of memberIds) {
      // Skip notification for the current user
      if (String(userId) === String(currentUser?.id)) {
        console.log(`Skipping notification for current user: ${userId}`);
        continue;
      }

      // Find user by ID among users
      const user = users.find((u) => String(u.id) === String(userId));
      if (!user || !user.id) {
        console.warn(`No valid user found for ID: ${userId}`);
        continue;
      }

      try {
        await createNotification({
          userId: String(user.id),
          type: 'canal',
          message: isEditing
            ? `Vous avez été ajouté au canal #${channelName} mis à jour par ${senderName}.`
            : `Vous avez été ajouté au canal #${channelName} par ${senderName}.`,
          relatedEntityType: 'Channel',
          relatedEntityId: String(channelId),
        });
        console.log(`Notification sent to user ${user.id} for channel #${channelName}`);
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
        setErrorMessage(`Erreur lors de l'envoi de la notification à l'utilisateur ${user.id}: ${error.message}`);
        setErrorSnackbarOpen(true);
      }
    }

    // Dispatch newNotification event
    window.dispatchEvent(new Event('newNotification'));
  };

  // Handlers
  const handleCreateChannel = async (channelData) => {
    if (!hasCanCreateChannel) {
      console.log('Create blocked: Missing permission', { hasCanCreateChannel });
      setErrorMessage("Vous n'avez pas la permission de créer un canal.");
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      const result = await dispatch(createChannel(channelData)).unwrap();
      const channelId = result?.id;
      const channelName = channelData.name;

      // Notify all member users (excluding current user)
      const memberIds = channelData.MemberIds || [];
      if (memberIds.length > 0) {
        await notifyChannelUsers(channelId, channelName, memberIds, false);
      }

      setCreateChannelDialogOpen(false);
    } catch (error) {
      console.error('CreateChannel error:', error);
      setErrorMessage(error.message || 'Erreur lors de la création du canal.');
      setErrorSnackbarOpen(true);
    }
  };

  const handleUpdateChannel = async (channelData) => {
    if (!hasCanCreateChannel || !selectedChannelForMenu) {
      console.log('Update blocked: Missing permission or channel', {
        hasCanCreateChannel,
        selectedChannelForMenu,
      });
      setErrorMessage("Vous n'avez pas la permission de modifier ce canal.");
      setErrorSnackbarOpen(true);
      return;
    }
    const channelCreatorId = parseInt(selectedChannelForMenu.creatorId, 10);
    const userId = parseInt(currentUser?.id, 10);
    console.log('Updating channel:', {
      channelId: selectedChannelForMenu.id,
      channelCreatorId,
      userId,
      creatorIdRaw: selectedChannelForMenu.creatorId,
      userIdRaw: currentUser?.id,
      creatorIdType: typeof selectedChannelForMenu.creatorId,
      userIdType: typeof currentUser?.id,
      hasCanCreateChannel,
      channelData
    });
    if (isNaN(channelCreatorId) || isNaN(userId)) {
      console.error('Invalid IDs:', { channelCreatorId, userId });
      setErrorMessage("Erreur: Identifiants de créateur ou d'utilisateur invalides.");
      setErrorSnackbarOpen(true);
      return;
    }
    if (channelCreatorId !== userId) {
      console.log('Creator mismatch:', { channelCreatorId, userId });
      setErrorMessage('Seul le créateur du canal peut le modifier.');
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      const memberIdsToAdd = channelData.MemberIdsToAdd || [];
      const memberIdsToRemove = channelData.MemberIdsToRemove || [];
      await dispatch(
        updateChannel({
          channelId: selectedChannelForMenu.id,
          channelData: {
            name: channelData.name,
            MemberIdsToAdd: memberIdsToAdd,
            MemberIdsToRemove: memberIdsToRemove,
          },
        })
      ).unwrap();

      // Notify newly added members
      if (memberIdsToAdd.length > 0) {
        await notifyChannelUsers(selectedChannelForMenu.id, channelData.name, memberIdsToAdd, true);
      }

      // Optionally notify all channel members if the channel name changed
      const originalChannel = channels.find((c) => c.id === selectedChannelForMenu.id);
      if (originalChannel && originalChannel.name !== channelData.name) {
        const allMemberIds = channelMembers
          .map((member) => String(member.id))
          .filter((id) => String(id) !== String(currentUser?.id));
        await notifyChannelUsers(selectedChannelForMenu.id, channelData.name, allMemberIds, true);
      }

      setUpdateChannelDialogOpen(false);
      setSelectedChannelForMenu(null);
      setMenuAnchorEl(null);
    } catch (error) {
      console.error('UpdateChannel error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const message = error.message?.includes('Seul le créateur')
        ? 'Seul le créateur du canal peut le modifier.'
        : error.message?.includes('Unauthorized')
        ? "Erreur d'authentification. Veuillez vous reconnecter."
        : error.message?.includes('duplicate')
        ? 'Un canal avec ce nom existe déjà.'
        : error.message || 'Erreur lors de la mise à jour du canal.';
      setErrorMessage(message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleDeleteChannel = async () => {
    if (!hasCanCreateChannel || !selectedChannelForMenu) {
      console.log('Delete blocked: Missing permission or channel', { hasCanCreateChannel, selectedChannelForMenu });
      setErrorMessage("Vous n'avez pas la permission de supprimer ce canal.");
      setErrorSnackbarOpen(true);
      return;
    }
    const channelCreatorId = parseInt(selectedChannelForMenu.creatorId, 10);
    const userId = parseInt(currentUser?.id, 10);
    console.log('Deleting channel:', {
      channelId: selectedChannelForMenu.id,
      channelCreatorId,
      userId,
      creatorIdRaw: selectedChannelForMenu.creatorId,
      userIdRaw: currentUser?.id,
      creatorIdType: typeof selectedChannelForMenu.creatorId,
      userIdType: typeof currentUser?.id,
      hasCanCreateChannel
    });
    if (isNaN(channelCreatorId) || isNaN(userId)) {
      console.error('Invalid IDs:', { channelCreatorId, userId });
      setErrorMessage("Erreur: Identifiants de créateur ou d'utilisateur invalides.");
      setErrorSnackbarOpen(true);
      return;
    }
    if (channelCreatorId !== userId) {
      console.log('Creator mismatch:', { channelCreatorId, userId });
      setErrorMessage('Seul le créateur du canal peut le supprimer.');
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      await dispatch(deleteChannel(selectedChannelForMenu.id)).unwrap();
      setDeleteChannelDialogOpen(false);
      setMenuAnchorEl(null);
      setSelectedChannelForMenu(null);
    } catch (error) {
      console.error('DeleteChannel error:', error);
      const message = error.message?.includes('Seul le créateur')
        ? 'Seul le créateur du canal peut le supprimer.'
        : error.message || 'Erreur lors de la suppression du canal.';
      setErrorMessage(message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleSendMessage = async () => {
    if (!hasCanCommunicate) {
      setErrorMessage("Vous n'avez pas la permission d'envoyer des messages.");
      setErrorSnackbarOpen(true);
      return;
    }
    if (!selectedChannel) {
      setErrorMessage("Aucun canal sélectionné.");
      setErrorSnackbarOpen(true);
      return;
    }
    if (!messageInput.trim() && attachedFiles.length === 0) {
      setErrorMessage("Vous devez fournir un message ou un fichier.");
      setErrorSnackbarOpen(true);
      return;
    }
    const payload = {
      channelId: selectedChannel.id,
      content: messageInput.trim() || "",
      files: attachedFiles.map((f) => f.name),
    };
    console.log("Sending message payload:", payload);
    try {
      await dispatch(
        sendMessage({
          channelId: selectedChannel.id,
          content: messageInput.trim() || "",
          files: attachedFiles,
        })
      ).unwrap();
      console.log("Message sent successfully:", payload);
      playAudio(sendAudioRef.current, "send");
      setMessageInput("");
      setAttachedFiles([]);
    } catch (error) {
      console.error("Send message error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de l'envoi du message.";
      setErrorMessage(errorMessage);
      setErrorSnackbarOpen(true);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelection = (event) => {
    if (!hasCanCommunicate) {
      setErrorMessage("Vous n'avez pas la permission de joindre des fichiers.");
      setErrorSnackbarOpen(true);
      return;
    }
    setAttachedFiles(Array.from(event.target.files));
  };

  const handleEmojiClick = (emojiData) => {
    if (!hasCanCommunicate) {
      setErrorMessage("Vous n'avez pas la permission d'ajouter des emojis.");
      setErrorSnackbarOpen(true);
      return;
    }
    setMessageInput((prev) => prev + emojiData.emoji);
    setEmojiAnchorEl(null);
  };

  const handleFileClick = async (fileUrl, fileName) => {
    try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `https://localhost:7270${fileUrl}`;
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName || 'file');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      setErrorMessage('Erreur lors du téléchargement du fichier');
      setErrorSnackbarOpen(true);
    }
  };

  const toggleMembersDrawer = () => {
    setMembersDrawerOpen(!membersDrawerOpen);
  };

  return (
    <ChatContainer>
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        channels={channels}
        selectedChannel={selectedChannel}
        hasCanCreateChannel={hasCanCreateChannel}
        currentUser={currentUser}
        setCreateChannelDialogOpen={setCreateChannelDialogOpen}
        setUpdateChannelDialogOpen={setUpdateChannelDialogOpen}
        setDeleteChannelDialogOpen={setDeleteChannelDialogOpen}
        setSelectedChannelForMenu={setSelectedChannelForMenu}
        setMenuAnchorEl={setMenuAnchorEl}
        menuAnchorEl={menuAnchorEl}
      />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <ChatHeader
          isMobile={isMobile}
          setSidebarOpen={setSidebarOpen}
          selectedChannel={selectedChannel}
          channelMembers={channelMembers}
          currentUser={currentUser}
          toggleMembersDrawer={toggleMembersDrawer}
        />
        <ChatMessages
          selectedChannel={selectedChannel}
          currentUser={currentUser}
          channelMembers={channelMembers}
          users={users}
          messagesEndRef={messagesEndRef}
          handleFileClick={handleFileClick}
        />
        <ChatInput
          selectedChannel={selectedChannel}
          hasCanCommunicate={hasCanCommunicate}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          handleFileSelection={handleFileSelection}
          handleEmojiClick={handleEmojiClick}
          emojiAnchorEl={emojiAnchorEl}
          setEmojiAnchorEl={setEmojiAnchorEl}
          fileInputRef={fileInputRef}
        />
      </Box>
      <ChatDialogs
        createChannelDialogOpen={createChannelDialogOpen}
        setCreateChannelDialogOpen={setCreateChannelDialogOpen}
        updateChannelDialogOpen={updateChannelDialogOpen}
        setUpdateChannelDialogOpen={setUpdateChannelDialogOpen}
        deleteChannelDialogOpen={deleteChannelDialogOpen}
        setDeleteChannelDialogOpen={setDeleteChannelDialogOpen}
        handleCreateChannel={handleCreateChannel}
        handleUpdateChannel={handleUpdateChannel}
        handleDeleteChannel={handleDeleteChannel}
        users={users}
        currentUser={currentUser}
        selectedChannelForMenu={selectedChannelForMenu}
        hasCanCreateChannel={hasCanCreateChannel}
      />
      <ChatMembersList
        open={membersDrawerOpen}
        onClose={() => setMembersDrawerOpen(false)}
        members={channelMembers}
        currentUserId={currentUser?.id}
      />
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbarOpen(false)}
      >
        <Alert onClose={() => setErrorSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage || 'Une erreur est survenue'}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default GroupDiscussion;