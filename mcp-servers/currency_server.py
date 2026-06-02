import asyncio
import httpx
from mcp.server.fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("EmailAgent Currency Server")

@mcp.tool()
async def get_exchange_rate(base: str = "USD", target: str = "TRY") -> str:
    """
    Get the current exchange rate between two currencies using the Frankfurter API.
    
    Args:
        base: The base currency code (e.g., USD, EUR, GBP)
        target: The target currency code (e.g., TRY, EUR, JPY)
    """
    url = f"https://api.frankfurter.app/latest?from={base}&to={target}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            rate = data["rates"][target]
            return f"Current exchange rate: 1 {base} = {rate} {target}"
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return f"Error: One or both of the currencies '{base}' or '{target}' are not supported by the European Central Bank (Frankfurter API)."
            return f"Error fetching exchange rate: {str(e)}"
        except Exception as e:
            return f"An error occurred: {str(e)}"

if __name__ == "__main__":
    # Run the FastMCP server over standard input/output (stdio)
    mcp.run()
