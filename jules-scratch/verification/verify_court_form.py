from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Wait for the server to start
    time.sleep(5)

    try:
        # Navigate to the login page
        page.goto("http://localhost:5173/login")

        # Fill in the login form with the new credentials
        page.fill('input[id="username"]', "Admin")
        page.fill('input[id="password"]', "Admin")
        page.click('button[type="submit"]')

        # Wait for navigation to the admin page
        page.wait_for_url("http://localhost:5173/admin/dashboard", timeout=10000) # Reduced timeout

        # Go to the courts page
        page.goto("http://localhost:5173/admin/courts")

        # Click the "New Court" button
        page.click('button:has-text("Nueva Cancha")')

        # Wait for the modal to appear
        page.wait_for_selector('h3:has-text("Nueva Cancha")')

        # Take a screenshot of the modal
        page.screenshot(path="jules-scratch/verification/court_form_modal.png")

    except Exception as e:
        # Take a screenshot on failure for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
        print(f"An error occurred: {e}") # Print error for better debugging
        raise e

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
