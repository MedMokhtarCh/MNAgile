using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using DiscussionService.Data;
using DiscussionService.DTOs;
using DiscussionService.Hubs;
using DiscussionService.Models;

namespace DiscussionService.Services
{
    public class DiscussionService
    {
        private readonly DiscussionDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DiscussionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Dictionary<int, UserDTO> _userCache;

        public DiscussionService(
            DiscussionDbContext context,
            IHubContext<ChatHub> hubContext,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<DiscussionService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _hubContext = hubContext;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _userCache = new Dictionary<int, UserDTO>();
        }

        private async Task<UserDTO> GetUserAsync(int userId)
        {
            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID {UserId} provided.", userId);
                throw new KeyNotFoundException($"Invalid user ID {userId}.");
            }

            if (_userCache.TryGetValue(userId, out var cachedUser))
            {
                return cachedUser;
            }

            var client = _httpClientFactory.CreateClient();
            var userServiceUrl = _configuration["UserService:BaseUrl"]
                ?? throw new InvalidOperationException("UserService:BaseUrl is not configured.");
            var request = new HttpRequestMessage(HttpMethod.Get, $"{userServiceUrl}/api/users/{userId}");

            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString()?.Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new KeyNotFoundException($"User {userId} not found in UserService.");
                }
                throw new HttpRequestException($"Failed to fetch user {userId} from UserService: {response.ReasonPhrase}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var user = JsonSerializer.Deserialize<UserDTO>(content);
            if (user == null)
            {
                throw new KeyNotFoundException($"User {userId} returned null from UserService.");
            }
            _userCache[userId] = user;
            _logger.LogInformation("Fetched user {UserId} from UserService.", userId);
            return user;
        }

        private async Task<List<UserDTO>> GetAllUsersAsync()
        {
            var client = _httpClientFactory.CreateClient();
            var userServiceUrl = _configuration["UserService:BaseUrl"]
                ?? throw new InvalidOperationException("UserService:BaseUrl is not configured.");
            var request = new HttpRequestMessage(HttpMethod.Get, $"{userServiceUrl}/api/users");

            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString()?.Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Failed to fetch users from UserService: {response.ReasonPhrase}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var users = JsonSerializer.Deserialize<List<UserDTO>>(content);
            if (users == null)
            {
                throw new InvalidOperationException("UserService returned null users list.");
            }
            foreach (var user in users)
            {
                if (user.Id > 0)
                {
                    _userCache[user.Id] = user;
                }
            }
            _logger.LogInformation("Fetched {UserCount} users from UserService.", users.Count);
            return users;
        }

        public async Task<List<ChannelDTO>> GetUserChannelsAsync(int userId)
        {
            _logger.LogInformation("Fetching channels for user {UserId}.", userId);
            var channels = await _context.ChannelMembers
                .Where(cm => cm.UserId == userId)
                .Include(cm => cm.Channel)
                .ThenInclude(c => c.Members)
                .Select(cm => new ChannelDTO
                {
                    Id = cm.Channel.Id,
                    Name = cm.Channel.Type == "dm" ? "DM" : cm.Channel.Name,
                    Type = cm.Channel.Type,
                    CreatorId = cm.Channel.CreatorId,
                    CreatedAt = cm.Channel.CreatedAt,
                    UnreadCount = cm.UnreadCount,
                    MemberIds = cm.Channel.Members.Select(m => m.UserId).ToList()
                })
                .ToListAsync();

            foreach (var channel in channels.Where(c => c.Type == "dm"))
            {
                var otherMemberId = channel.MemberIds.FirstOrDefault(m => m != userId);
                if (otherMemberId > 0)
                {
                    try
                    {
                        var user = await GetUserAsync(otherMemberId);
                        channel.Name = $"{user.FirstName} {user.LastName}";
                    }
                    catch (KeyNotFoundException)
                    {
                        channel.Name = "Utilisateur inconnu";
                        _logger.LogWarning("User {OtherMemberId} not found for DM channel {ChannelId}.", otherMemberId, channel.Id);
                    }
                }
                else
                {
                    channel.Name = "Utilisateur inconnu";
                    _logger.LogWarning("No valid other member found for DM channel {ChannelId}.", channel.Id);
                }
            }

            _logger.LogInformation("Retrieved {ChannelCount} channels for user {UserId}.", channels.Count, userId);
            return channels;
        }

        public async Task<ChannelDTO> CreateChannelAsync(CreateChannelRequest request, int creatorId)
        {
            if (string.IsNullOrEmpty(request.Name) && request.Type != "dm")
            {
                throw new ArgumentException("Channel name is required for non-DM channels.");
            }

            if (request.Type != "dm" && request.Type != "channel")
            {
                throw new ArgumentException("Invalid channel type. Must be 'dm' or 'channel'.");
            }

            if (creatorId <= 0)
            {
                throw new ArgumentException("Invalid creator ID.");
            }

            if (request.Type == "dm" && (request.MemberIds == null || request.MemberIds.Count != 1))
            {
                throw new ArgumentException("DM channels must have exactly one other member.");
            }

            _logger.LogInformation("Creating {ChannelType} channel for user {CreatorId}.", request.Type, creatorId);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var channel = new Channel
                {
                    Name = request.Type == "dm" ? "DM" : request.Name,
                    Type = request.Type,
                    CreatorId = creatorId,
                    CreatedAt = DateTime.UtcNow,
                    Members = new List<ChannelMember>()
                };

                _context.Channels.Add(channel);
                await _context.SaveChangesAsync();

                channel.Members.Add(new ChannelMember
                {
                    ChannelId = channel.Id,
                    UserId = creatorId,
                    UnreadCount = 0
                });

                var validMemberIds = new List<int>();
                foreach (var memberId in request.MemberIds?.Distinct() ?? new List<int>())
                {
                    if (memberId <= 0)
                    {
                        _logger.LogWarning("Skipping invalid member ID {MemberId} for channel {ChannelId}.", memberId, channel.Id);
                        continue;
                    }
                    if (memberId != creatorId)
                    {
                        try
                        {
                            await GetUserAsync(memberId);
                            channel.Members.Add(new ChannelMember
                            {
                                ChannelId = channel.Id,
                                UserId = memberId,
                                UnreadCount = 0
                            });
                            validMemberIds.Add(memberId);
                        }
                        catch (KeyNotFoundException)
                        {
                            _logger.LogWarning("User {MemberId} not found, skipping for channel {ChannelId}.", memberId, channel.Id);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                // Set the channel name for the DTO
                string channelName = channel.Name;
                if (channel.Type == "dm")
                {
                    var otherMemberId = channel.Members.FirstOrDefault(m => m.UserId != creatorId)?.UserId;
                    if (otherMemberId.HasValue && otherMemberId.Value > 0)
                    {
                        try
                        {
                            var user = await GetUserAsync(otherMemberId.Value);
                            channelName = $"{user.FirstName} {user.LastName}";
                        }
                        catch (KeyNotFoundException)
                        {
                            channelName = "Utilisateur inconnu";
                            _logger.LogWarning("User {OtherMemberId} not found for DM channel {ChannelId}.", otherMemberId, channel.Id);
                        }
                    }
                    else
                    {
                        channelName = "Utilisateur inconnu";
                        _logger.LogWarning("No valid other member found for DM channel {ChannelId}.", channel.Id);
                    }
                }

                var channelDTO = new ChannelDTO
                {
                    Id = channel.Id,
                    Name = channelName,
                    Type = channel.Type,
                    CreatorId = channel.CreatorId,
                    CreatedAt = channel.CreatedAt,
                    UnreadCount = 0,
                    MemberIds = channel.Members.Select(m => m.UserId).ToList()
                };

                await transaction.CommitAsync();

                foreach (var memberId in channelDTO.MemberIds)
                {
                    await _hubContext.Clients.Group($"user_{memberId}").SendAsync("ChannelCreated", channelDTO);
                }

                _logger.LogInformation("Channel {ChannelId} ({ChannelType}) created successfully by user {CreatorId}.", channel.Id, channel.Type, creatorId);
                return channelDTO;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to create channel for user {CreatorId}.", creatorId);
                throw;
            }
        }

        public async Task<MessageDTO> SendMessageAsync(SendMessageRequest request, int senderId, List<IFormFile> files)
        {
            _logger.LogInformation("Sending message to channel {ChannelId} by user {SenderId}.", request.ChannelId, senderId);

            var channel = await _context.Channels
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == request.ChannelId);

            if (channel == null)
            {
                throw new InvalidOperationException("Canal non trouvé.");
            }

            if (!channel.Members.Any(m => m.UserId == senderId))
            {
                throw new UnauthorizedAccessException("Vous n'êtes pas membre de ce canal.");
            }

            if (channel.Type == "dm" && request.RecipientId.HasValue && !channel.Members.Any(m => m.UserId == request.RecipientId))
            {
                throw new ArgumentException("Recipient is not a member of this DM channel.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var message = new Message
                {
                    ChannelId = request.ChannelId,
                    SenderId = senderId,
                    Content = request.Content,
                    Timestamp = DateTime.UtcNow,
                    ReplyToId = request.ReplyToId,
                    RecipientId = request.RecipientId,
                    Attachments = new List<MessageAttachment>()
                };

                const long maxFileSize = 10 * 1024 * 1024;
                var allowedFileTypes = new[] { "image/jpeg", "image/png", "application/pdf", "text/plain" };
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                foreach (var file in files ?? new List<IFormFile>())
                {
                    if (file.Length > maxFileSize)
                    {
                        throw new ArgumentException($"File {file.FileName} exceeds maximum size of 10 MB.");
                    }

                    if (!allowedFileTypes.Contains(file.ContentType))
                    {
                        throw new ArgumentException($"File type {file.ContentType} is not allowed.");
                    }

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(SanitizeFileName(file.FileName));
                    var filePath = Path.Combine(uploadPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var attachment = new MessageAttachment
                    {
                        FileName = file.FileName,
                        FileType = file.ContentType,
                        FilePath = $"/uploads/{fileName}",
                        FileSize = file.Length
                    };

                    message.Attachments.Add(attachment);
                }

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                foreach (var member in channel.Members.Where(m => m.UserId != senderId))
                {
                    member.UnreadCount++;
                }
                await _context.SaveChangesAsync();

                var sender = await GetUserAsync(senderId);
                var messageDTO = new MessageDTO
                {
                    Id = message.Id,
                    ChannelId = message.ChannelId,
                    SenderId = message.SenderId,
                    SenderName = $"{sender.FirstName} {sender.LastName}",
                    Content = message.Content,
                    Timestamp = message.Timestamp,
                    ReplyToId = message.ReplyToId,
                    RecipientId = message.RecipientId,
                    Attachments = message.Attachments.Select(a => new MessageAttachmentDTO
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FileType = a.FileType,
                        FileUrl = a.FilePath,
                        FileSize = a.FileSize
                    }).ToList()
                };

                await transaction.CommitAsync();

                await _hubContext.Clients.Group($"channel_{message.ChannelId}").SendAsync("ReceiveMessage", messageDTO);

                _logger.LogInformation("Message {MessageId} sent to channel {ChannelId} by user {SenderId}.", message.Id, message.ChannelId, senderId);
                return messageDTO;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to send message to channel {ChannelId} by user {SenderId}.", request.ChannelId, senderId);
                throw;
            }
        }

        public async Task<List<MessageDTO>> GetChannelMessagesAsync(int channelId, int userId)
        {
            _logger.LogInformation("Fetching messages for channel {ChannelId} for user {UserId}.", channelId, userId);

            var channel = await _context.Channels
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null)
            {
                throw new InvalidOperationException("Canal non trouvé.");
            }

            if (!channel.Members.Any(m => m.UserId == userId))
            {
                throw new UnauthorizedAccessException("Accès non autorisé à ce canal.");
            }

            var messages = await _context.Messages
                .Where(m => m.ChannelId == channelId)
                .OrderBy(m => m.Timestamp)
                .Select(m => new MessageDTO
                {
                    Id = m.Id,
                    ChannelId = m.ChannelId,
                    SenderId = m.SenderId,
                    SenderName = "",
                    Content = m.Content,
                    Timestamp = m.Timestamp,
                    ReplyToId = m.ReplyToId,
                    RecipientId = m.RecipientId,
                    Attachments = m.Attachments.Select(a => new MessageAttachmentDTO
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FileType = a.FileType,
                        FileUrl = a.FilePath,
                        FileSize = a.FileSize
                    }).ToList()
                })
                .ToListAsync();

            var senderIds = messages.Select(m => m.SenderId).Distinct().ToList();
            var senders = new Dictionary<int, UserDTO>();
            foreach (var senderId in senderIds)
            {
                try
                {
                    var sender = await GetUserAsync(senderId);
                    senders[senderId] = sender;
                }
                catch (KeyNotFoundException)
                {
                    senders[senderId] = new UserDTO { Id = senderId, FirstName = "Inconnu", LastName = "Utilisateur" };
                    _logger.LogWarning("Sender {SenderId} not found for channel {ChannelId}.", senderId, channelId);
                }
            }

            foreach (var message in messages)
            {
                var sender = senders[message.SenderId];
                message.SenderName = $"{sender.FirstName} {sender.LastName}";
            }

            var member = channel.Members.FirstOrDefault(m => m.UserId == userId);
            if (member != null)
            {
                member.UnreadCount = 0;
                await _context.SaveChangesAsync();
            }

            await _hubContext.Groups.AddToGroupAsync(_httpContextAccessor.HttpContext.Connection.Id, $"channel_{channelId}");
            _logger.LogInformation("Retrieved {MessageCount} messages for channel {ChannelId} for user {UserId}.", messages.Count, channelId, userId);
            return messages;
        }

        public async Task DeleteChannelAsync(int channelId, int userId)
        {
            _logger.LogInformation("Attempting to delete channel {ChannelId} by user {UserId}.", channelId, userId);

            var channel = await _context.Channels
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null)
            {
                throw new InvalidOperationException("Canal non trouvé.");
            }

            if (channel.CreatorId != userId)
            {
                throw new UnauthorizedAccessException("Seul le créateur du canal peut le supprimer.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var memberIds = channel.Members.Select(m => m.UserId).ToList();

                _context.Channels.Remove(channel);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                foreach (var memberId in memberIds)
                {
                    await _hubContext.Clients.Group($"user_{memberId}").SendAsync("ChannelDeleted", channelId);
                }

                _logger.LogInformation("Channel {ChannelId} deleted successfully by user {UserId}.", channelId, userId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to delete channel {ChannelId} by user {UserId}.", channelId, userId);
                throw;
            }
        }

        public async Task<ChannelDTO> UpdateChannelAsync(int channelId, UpdateChannelRequest request, int userId)
        {
            _logger.LogInformation("Attempting to update channel {ChannelId} by user {UserId}.", channelId, userId);

            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                throw new ArgumentException("Le nom du canal est requis.");
            }

            var channel = await _context.Channels
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null)
            {
                throw new InvalidOperationException("Canal non trouvé.");
            }

            if (channel.CreatorId != userId)
            {
                throw new UnauthorizedAccessException("Seul le créateur du canal peut le modifier.");
            }

            if (channel.Type == "dm")
            {
                throw new InvalidOperationException("Les canaux de messagerie directe ne peuvent pas être modifiés.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                channel.Name = request.Name;
                var existingMemberIds = channel.Members.Select(m => m.UserId).ToList();

                foreach (var memberId in request.MemberIdsToAdd?.Distinct() ?? new List<int>())
                {
                    if (memberId <= 0)
                    {
                        _logger.LogWarning("Skipping invalid member ID {MemberId} for channel {ChannelId}.", memberId, channel.Id);
                        continue;
                    }
                    if (!existingMemberIds.Contains(memberId))
                    {
                        try
                        {
                            await GetUserAsync(memberId);
                            channel.Members.Add(new ChannelMember
                            {
                                ChannelId = channel.Id,
                                UserId = memberId,
                                UnreadCount = 0
                            });
                        }
                        catch (KeyNotFoundException)
                        {
                            _logger.LogWarning("User {MemberId} not found, skipping for channel {ChannelId}.", memberId, channel.Id);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var channelDTO = new ChannelDTO
                {
                    Id = channel.Id,
                    Name = channel.Name,
                    Type = channel.Type,
                    CreatorId = channel.CreatorId,
                    CreatedAt = channel.CreatedAt,
                    UnreadCount = channel.Members.FirstOrDefault(m => m.UserId == userId)?.UnreadCount ?? 0,
                    MemberIds = channel.Members.Select(m => m.UserId).ToList()
                };

                await transaction.CommitAsync();

                foreach (var memberId in channelDTO.MemberIds)
                {
                    await _hubContext.Clients.Group($"user_{memberId}").SendAsync("ChannelUpdated", channelDTO);
                }

                _logger.LogInformation("Channel {ChannelId} updated successfully by user {UserId}.", channel.Id, userId);
                return channelDTO;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to update channel {ChannelId} by user {UserId}.", channelId, userId);
                throw;
            }
        }

        private string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());
            return sanitized.Length > 100 ? sanitized.Substring(0, 100) : sanitized;
        }
    }
}