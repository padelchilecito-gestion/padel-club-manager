from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the home page
        page.goto("http://localhost:5173/")

        # Wait for the navigation bar to be visible and check its elements
        navbar = page.locator("nav")
        expect(navbar).to_be_visible(timeout=10000)
        expect(navbar.get_by_role("link", name="Padel Club")).to_be_visible()

        tienda_link = navbar.get_by_role("link", name="Tienda")
        expect(tienda_link).to_be_visible()

        login_link = navbar.get_by_role("link", name="Login")
        expect(login_link).to_be_visible()

        # Take a screenshot of the homepage with the navbar
        page.screenshot(path="jules-scratch/verification/homepage_with_navbar.png")
        print("Homepage with navbar screenshot captured.")

        # Click the "Tienda" link and verify navigation
        tienda_link.click()
        expect(page).to_have_url("http://localhost:5173/shop", timeout=5000)

        # Verify the navbar is still present on the shop page
        expect(navbar).to_be_visible()

        # Take a screenshot of the shop page
        page.screenshot(path="jules-scratch/verification/shoppage_with_navbar.png")
        print("Shop page with navbar screenshot captured.")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)