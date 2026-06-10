using Microsoft.AspNetCore.Mvc;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("logs")]
public class LogsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetLogViewer()
    {
        var html = @"
<!DOCTYPE html>
<html lang='tr'>
<head>
    <meta charset='UTF-8'>
    <title>Matrix Komuta Merkezi</title>
    <!-- Include SignalR client -->
    <script src='https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/7.0.5/signalr.min.js'></script>
    <style>
        body { background-color: #0b0c10; color: #45a29e; font-family: 'Courier New', Courier, monospace; padding: 20px; }
        .log-line { margin-bottom: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
        .level-Information { color: #66b2ff; } /* Blue */
        .level-Warning { color: #ffcc00; }     /* Yellow */
        .level-Error { color: #ff3333; font-weight: bold; } /* Red */
        .level-Fatal { color: #ff0000; font-weight: bold; background: #550000; }
        .ai-logic { color: #cc66ff; text-shadow: 0 0 5px #cc66ff; } /* Purple neon */
        
        .source-tag { color: #888; font-size: 12px; margin-right: 10px; }
        
        .controls { background: #1f2833; padding: 15px; border-radius: 5px; margin-bottom: 20px; display: flex; gap: 15px; }
        label { cursor: pointer; color: #c5c6c7; font-weight: bold;}
        input[type=checkbox] { accent-color: #45a29e; }
        h1 { color: #66fcf1; border-bottom: 2px solid #45a29e; padding-bottom: 10px; text-shadow: 0 0 10px #66fcf1; }
    </style>
</head>
<body>
    <h1>[AEGIS] Matrix Komuta Merkezi</h1>
    <div class='controls'>
        <label><input type='checkbox' id='chkAI' checked> Sadece AI (Aegis/ScraperAgent)</label>
        <label><input type='checkbox' id='chkScraper' checked> Scraper Servisleri</label>
        <label><input type='checkbox' id='chkSystem' checked> Sistem (Diğer)</label>
        <button onclick=""document.getElementById('logs').innerHTML=''"" style='background:#45a29e; color:#0b0c10; border:none; padding:5px 10px; font-weight:bold; cursor:pointer;'>Ekranı Temizle</button>
    </div>
    <div id='logs'>Canlı akış bekleniyor...<br/><br/></div>
    <script>
        const logsDiv = document.getElementById('logs');
        const chkAI = document.getElementById('chkAI');
        const chkScraper = document.getElementById('chkScraper');
        const chkSystem = document.getElementById('chkSystem');

        const connection = new signalR.HubConnectionBuilder()
            .withUrl('/loghub')
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveLog', (logJson) => {
            const log = JSON.parse(logJson);
            
            // Log İzolasyonu (Filtreleme)
            const isAI = log.Source.includes('AegisAgentOrchestrator') || log.Source.includes('UniversalScraperAgent');
            const isScraper = log.Source.includes('PlaywrightScraperService') || log.Source.includes('CategoryScraperService') || log.Source.includes('ProductScraperService');
            const isSystem = !isAI && !isScraper;

            if (isAI && !chkAI.checked) return;
            if (isScraper && !chkScraper.checked) return;
            if (isSystem && !chkSystem.checked) return;

            // Renklendirme
            let cssClass = 'level-' + log.Level;
            if (isAI) cssClass += ' ai-logic';

            const div = document.createElement('div');
            div.className = 'log-line ' + cssClass;
            
            const time = new Date(log.Timestamp).toLocaleTimeString();
            div.innerHTML = `<span class='source-tag'>[${time}] [${log.Level}] [${log.Source.split('.').pop()}]</span> ${log.Message}`;
            
            logsDiv.appendChild(div);
            window.scrollTo(0, document.body.scrollHeight);
        });

        connection.start().then(() => {
            logsDiv.innerHTML += 'SignalR bağlandı. Matrix akışı başlıyor...<br/>';
        }).catch(err => {
            logsDiv.innerHTML += `<span class='level-Error'>Bağlantı hatası: ${err}</span><br/>`;
        });
    </script>
</body>
</html>";
        return Content(html, "text/html");
    }
}
