using System;
using System.ComponentModel;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using UglyToad.PdfPig;

namespace EmailAgent.API.Plugins;

public class DocumentPlugin
{
    [KernelFunction("ReadPdfDocumentAsync")]
    [Description("Reads the text content of a local PDF document or a text file. Use this when the user asks to analyze, read, or summarize a local document, invoice, or contract.")]
    public async Task<string> ReadPdfDocumentAsync(
        [Description("The absolute file path to the PDF or TXT file on the local file system (e.g. C:\\docs\\invoice.pdf)")] string filePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            {
                return $"Error: The file could not be found at path: {filePath}";
            }

            var extension = Path.GetExtension(filePath).ToLowerInvariant();

            if (extension == ".txt" || extension == ".md" || extension == ".json")
            {
                var text = await File.ReadAllTextAsync(filePath);
                return Truncate(text);
            }

            if (extension == ".pdf")
            {
                var stringBuilder = new StringBuilder();
                using (var document = PdfDocument.Open(filePath))
                {
                    foreach (var page in document.GetPages())
                    {
                        stringBuilder.AppendLine(page.Text);
                    }
                }
                return Truncate(stringBuilder.ToString());
            }

            return "Error: Unsupported file format. Only PDF, TXT, MD, and JSON files are supported.";
        }
        catch (Exception ex)
        {
            return $"Error reading document: {ex.Message}";
        }
    }

    private string Truncate(string text, int maxLength = 15000)
    {
        if (text.Length > maxLength)
        {
            return text.Substring(0, maxLength) + "\n... [Document Truncated] ...";
        }
        return text;
    }
}
