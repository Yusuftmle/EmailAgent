using System;
using System.Text.Json;
using System.Threading.Channels;

namespace EmailAgent.API.Logging;

// A static broker that allows Serilog Sink to push messages to a central queue
// which can then be consumed by a hosted service to send via SignalR Hub.
public static class LogEventBroker
{
    public static readonly Channel<string> LogChannel = Channel.CreateBounded<string>(
        new BoundedChannelOptions(5000) // Buffer up to 5000 logs
        {
            FullMode = BoundedChannelFullMode.DropOldest
        });

    public static void EnqueueLog(string level, string source, string message)
    {
        var logObj = new
        {
            Timestamp = DateTimeOffset.UtcNow.ToString("O"),
            Level = level,
            Source = source,
            Message = message
        };
        var json = JsonSerializer.Serialize(logObj);
        LogChannel.Writer.TryWrite(json);
    }
}
