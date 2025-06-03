using Microsoft.AspNetCore.SignalR;

namespace NotificationService.Hubs
{
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var parsedUserId))
            {
                throw new HubException("User ID not provided or invalid.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{parsedUserId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var parsedUserId))
            {
                throw new HubException("User ID not provided or invalid.");
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{parsedUserId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}