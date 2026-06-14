using System;
using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Hangfire;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Infrastructure.Jobs;
using EmailAgent.Core.Entities;

namespace EmailAgent.API.Plugins;

public class ReminderPlugin
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly Guid _userId;

    public ReminderPlugin(EmailAgentDbContext dbContext, IBackgroundJobClient backgroundJobClient, Guid userId)
    {
        _dbContext = dbContext;
        _backgroundJobClient = backgroundJobClient;
        _userId = userId;
    }

    [KernelFunction("SetReminder")]
    [Description("Sets a reminder for the user. Use this when the user says 'bana X saat/dakika sonra hatırlat' or 'remind me in X minutes/hours'. Always confirm the reminder time in Turkish.")]
    public async Task<string> SetReminderAsync(
        [Description("The reminder message to send to the user.")] string message,
        [Description("Number of minutes from now when to send the reminder.")] int minutesFromNow)
    {
        var remindAt = DateTime.UtcNow.AddMinutes(minutesFromNow);

        var reminder = new Reminder
        {
            UserId = _userId,
            Message = message,
            RemindAt = remindAt,
            IsSent = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Reminders.Add(reminder);
        await _dbContext.SaveChangesAsync();

        _backgroundJobClient.Schedule<MorningBriefingJob>(
            job => job.SendSingleReminderAsync(reminder.Id),
            remindAt);

        var localTime = remindAt.AddHours(3); // UTC+3 for Turkey
        return $"✅ Hatırlatıcı ayarlandı! Sana {localTime:HH:mm} ({minutesFromNow} dakika sonra) şu mesajı göndereceğim: \"{message}\"";
    }
}
