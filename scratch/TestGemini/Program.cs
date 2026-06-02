using System;
using System.Net.Http;
using System.Threading.Tasks;
using Npgsql;
using System.Text.Json;

var connString = "Host=localhost;Database=emailagent_v2;Username=postgres;Password=postgres;Include Error Detail=true";
try
{
    using var conn = new NpgsqlConnection(connString);
    conn.Open();
    using var cmd = new NpgsqlCommand("SELECT \"ApiKey\" FROM \"UserPreferences\" WHERE \"AiProvider\" = 'Gemini' LIMIT 1", conn);
    var key = cmd.ExecuteScalar() as string;
    
    if (string.IsNullOrEmpty(key))
    {
        Console.WriteLine("No valid Gemini API key found in DB.");
        return;
    }

    using var client = new HttpClient();
    var response = await client.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models?key={key}");
    var content = await response.Content.ReadAsStringAsync();
    
    if (response.IsSuccessStatusCode)
    {
        using var doc = JsonDocument.Parse(content);
        var models = doc.RootElement.GetProperty("models");
        Console.WriteLine("Available Models:");
        foreach (var model in models.EnumerateArray())
        {
            Console.WriteLine(model.GetProperty("name").GetString());
        }
    }
    else
    {
        Console.WriteLine($"Error fetching models: {response.StatusCode} - {content}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Exception: {ex.Message}");
}
