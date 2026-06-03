using System;
using Npgsql;

class Program
{
    static void Main()
    {
        var connString = "Host=localhost;Database=emailagent_v2;Username=postgres;Password=postgres;Include Error Detail=true";
        try
        {
            using var conn = new NpgsqlConnection(connString);
            conn.Open();
            var groupId = Guid.NewGuid();
            var sql = @"UPDATE ""TrackedCategories"" SET ""ComparisonGroupId"" = @groupId WHERE ""CategoryName"" LIKE '%iPhone 13 Pro%'";
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("groupId", groupId);
            var affected = cmd.ExecuteNonQuery();
            Console.WriteLine($"Updated {affected} categories with Group ID {groupId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }
}
