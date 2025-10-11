
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/login")
        page.wait_for_load_state('networkidle')
        page.fill('input[id="username"]', "admin")
        page.fill('input[id="password"]', "admin")
        page.click('button[type="submit"]')
        page.wait_for_url("http://localhost:5173/admin/dashboard", timeout=60000)

        page.goto("http://localhost:5173/admin/cashbox")
        page.wait_for_selector("h1:has-text('Gestión de Caja')")

        page.screenshot(path="jules-scratch/verification/cashbox_page.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
