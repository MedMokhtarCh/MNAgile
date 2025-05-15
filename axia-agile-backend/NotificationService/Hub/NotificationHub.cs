using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace NotificationService.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinUserGroup(string userEmail)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userEmail);
        }

        public async Task LeaveUserGroup(string userEmail)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userEmail);
        }
    }
}