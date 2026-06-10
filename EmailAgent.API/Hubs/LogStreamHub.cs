using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace EmailAgent.API.Hubs;

public class LogStreamHub : Hub
{
    // Clients will connect to this hub to receive live log events.
    // No specific server-side methods are needed for now as we just push logs to all connected clients.
}
