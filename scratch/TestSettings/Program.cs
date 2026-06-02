using System;
using Npgsql;

var connString = "Host=localhost;Database=emailagent_v2;Username=postgres;Password=postgres;Include Error Detail=true";
try
{
    using var conn = new NpgsqlConnection(connString);
    conn.Open();
    using var cmd = new NpgsqlCommand("SELECT \"WhatsAppSid\", \"TelegramChatId\", \"WhatsAppTo\" FROM \"UserPreferences\" LIMIT 1", conn);
    using var reader = cmd.ExecuteReader();
    if (reader.Read())
    {
        var sid = reader.IsDBNull(0) ? "" : reader.GetString(0);
        var tgChat = reader.IsDBNull(1) ? "" : reader.GetString(1);
        var waTo = reader.IsDBNull(2) ? "" : reader.GetString(2);
        
        Console.WriteLine($"Twilio SID set: {!string.IsNullOrEmpty(sid)}");
        Console.WriteLine($"Telegram Chat ID set: {!string.IsNullOrEmpty(tgChat)}");
        Console.WriteLine($"WhatsApp To set: {!string.IsNullOrEmpty(waTo)}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
