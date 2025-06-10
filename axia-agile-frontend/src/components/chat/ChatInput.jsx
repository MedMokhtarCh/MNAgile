import React from 'react';
import { Box, TextField, Button, IconButton, InputAdornment, Chip, Popover } from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { InputArea, StyledTextField, SendButton } from './theme';

const ChatInput = ({
  selectedChannel,
  hasCanCommunicate,
  messageInput,
  setMessageInput,
  attachedFiles,
  setAttachedFiles,
  handleSendMessage,
  handleKeyPress,
  fileInputRef,
  handleFileSelection,
  handleEmojiClick,
  emojiAnchorEl,
  setEmojiAnchorEl,
}) => {
  return (
    selectedChannel && hasCanCommunicate && (
      <InputArea>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <input type="file" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileSelection} />
          <StyledTextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Envoyer un message à #${selectedChannel.name}`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
                    <EmojiEmotionsIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => fileInputRef.current.click()}>
                    <AttachFileIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <SendButton
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!messageInput.trim() && attachedFiles.length === 0}
          >
            Envoyer
          </SendButton>
        </Box>
        {attachedFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => {
                  const newFiles = [...attachedFiles];
                  newFiles.splice(index, 1);
                  setAttachedFiles(newFiles);
                }}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        )}
        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={() => setEmojiAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Popover>
      </InputArea>
    )
  );
};

export default ChatInput;