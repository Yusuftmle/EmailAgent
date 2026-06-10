using Serilog.Core;
using Serilog.Events;
using System;

namespace EmailAgent.API.Logging;

public class SignalRSink : ILogEventSink
{
    public void Emit(LogEvent logEvent)
    {
        var level = logEvent.Level switch
        {
            LogEventLevel.Verbose => "Verbose",
            LogEventLevel.Debug => "Debug",
            LogEventLevel.Information => "Information",
            LogEventLevel.Warning => "Warning",
            LogEventLevel.Error => "Error",
            LogEventLevel.Fatal => "Fatal",
            _ => "Unknown"
        };

        var message = logEvent.RenderMessage();
        
        string source = "System";
        if (logEvent.Properties.TryGetValue("SourceContext", out var sourceContextVal))
        {
            source = sourceContextVal.ToString().Trim('"');
        }

        LogEventBroker.EnqueueLog(level, source, message);
    }
}
