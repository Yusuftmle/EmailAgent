using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using EmailAgent.API.Hubs;

namespace EmailAgent.API.Logging;

public class LogStreamerService : BackgroundService
{
    private readonly IHubContext<LogStreamHub> _hubContext;

    public LogStreamerService(IHubContext<LogStreamHub> hubContext)
    {
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var logJson in LogEventBroker.LogChannel.Reader.ReadAllAsync(stoppingToken))
        {
            await _hubContext.Clients.All.SendAsync("ReceiveLog", logJson, cancellationToken: stoppingToken);
        }
    }
}
