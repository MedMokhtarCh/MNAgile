import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Avatar, Tooltip, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { MessageContainer, FileAttachment, formatTimestamp, getInitials, getFileIcon, getAvatarColor } from './theme';
import { selectMessages } from '../../store/slices/chatSlice';

const ChatMessages = ({ selectedChannel, currentUser, channelMembers, users, messagesEndRef, handleFileClick }) => {
  const messages = useSelector((state) =>
    selectedChannel ? selectMessages(state, selectedChannel.id) : []
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedChannel) {
    return (
      <MessageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            Sélectionnez un canal pour commencer à discuter
          </Typography>
        </Box>
      </MessageContainer>
    );
  }

  if (messages.length === 0) {
    return (
      <MessageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Aucun message pour le moment. Commencez la conversation !
          </Typography>
        </Box>
      </MessageContainer>
    );
  }

  return (
    <MessageContainer>
      {messages.map((msg, index) => {
        const isCurrentUser = String(msg.senderId) === String(currentUser?.id);
        const sender = channelMembers.find((member) => String(member.id) === String(msg.senderId)) ||
                       users.find((user) => String(user.id) === String(msg.senderId)) ||
                       { firstName: '', lastName: '' };
        const firstName = sender.firstName ?? sender.FirstName ?? '';
        const lastName = sender.lastName ?? sender.LastName ?? '';
        const fullName = isCurrentUser 
          ? 'Vous' 
          : `${firstName} ${lastName}`.trim() || msg.senderName || 'Utilisateur inconnu';
        const avatarColor = getAvatarColor(fullName);

        return (
          <Box
            key={msg.id || index}
            sx={{
              mb: 2,
              display: 'flex',
              flexDirection: isCurrentUser ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              px: 1,
            }}
          >
            <Tooltip title={isCurrentUser ? 'Vous' : `${firstName} ${lastName}`.trim() || 'Utilisateur inconnu'}>
              <Avatar
                sx={{
                  bgcolor: avatarColor,
                  width: 40,
                  height: 40,
                  mt: 0.5,
                  mr: isCurrentUser ? 1 : 0,
                  ml: isCurrentUser ? 0 : 1,
                }}
              >
                {getInitials(isCurrentUser ? 'Vous' : `${firstName} ${lastName}`.trim() || 'Utilisateur')}
              </Avatar>
            </Tooltip>
            <Box sx={{ maxWidth: '70%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: isCurrentUser ? '#1e3a8a' : 'text.primary',
                    mr: 1,
                  }}
                >
                  {fullName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isCurrentUser ? '#1e3a8a' : 'text.secondary',
                  }}
                >
                  {formatTimestamp(msg.timestamp)}
                </Typography>
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: isCurrentUser ? '#bbdefb' : '#ffffff',
                  borderRadius: '16px',
                  borderTopLeftRadius: isCurrentUser ? '16px' : '4px',
                  borderTopRightRadius: isCurrentUser ? '4px' : '16px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: isCurrentUser ? '#1e3a8a' : 'text.primary',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </Typography>
                {msg.attachments?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {msg.attachments.map((attachment, i) => (
                      <FileAttachment key={i}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                          {getFileIcon(attachment.fileName)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {attachment.fileName}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="Ouvrir">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                const fullUrl = attachment.fileUrl.startsWith('http')
                                  ? attachment.fileUrl
                                  : `https://localhost:7270${attachment.fileUrl}`;
                                window.open(fullUrl, '_blank');
                              }}
                              sx={{ ml: 1 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Télécharger">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(attachment.fileUrl, attachment.fileName);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </FileAttachment>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </MessageContainer>
  );
};

export default ChatMessages;