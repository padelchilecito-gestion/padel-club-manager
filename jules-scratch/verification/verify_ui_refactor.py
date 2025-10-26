
from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Add a short delay to ensure the server is ready
    time.sleep(15)

    # Navigate to the login page and take a screenshot
    print("Navigating to login page...")
    page.goto("http://localhost:5173/login", timeout=60000)
    print("Capturing login page screenshot...")
    page.screenshot(path="jules-scratch/verification/login-page.png")
    print("Login page screenshot captured.")

    # Navigate to the main booking page and take a screenshot
    print("Navigating to booking page...")
    page.goto("http://localhost:5173/", timeout=60000)
    print("Capturing booking page screenshot...")
    page.screenshot(path="jules-scratch/verification/booking-page.png")
    print("Booking page screenshot captured.")

    # Log in to the admin section
    print("Navigating to login page...")
    page.goto("http://localhost:5173/login", timeout=60000)
    page.get_by_placeholder("Tu usuario").fill("admin")
    page.get_by_placeholder("Tu contraseña").fill("admin123")
    page.get_by_role("button", name="Iniciar Sesión").click()

    # Navigate to the admin dashboard and take a screenshot
    print("Navigating to admin dashboard...")
    page.goto("http://localhost:5173/admin/dashboard", timeout=60000)
    page.wait_for_selector("text=Dashboard", timeout=60000)
    print("Capturing admin dashboard screenshot...")
    page.screenshot(path="jules-scratch/verification/admin-dashboard-page.png")
    print("Admin dashboard screenshot captured.")

    context.close()
    browser.close()
    print("Script finished successfully.")

with sync_playwright() as playwright:
    run(playwright)
