import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the login page
        await page.goto("http://localhost:5173/login")

        # Wait for the main heading to be visible to ensure the page is loaded
        heading = page.get_by_role("heading", name="Panel de Administración")
        await expect(heading).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/login-page-updated.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
