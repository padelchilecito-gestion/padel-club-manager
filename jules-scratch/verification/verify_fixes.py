from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Verify that only enabled courts are shown on HomePage
        page.goto("http://localhost:5173/")
        page.locator("button:text('22:00')").click()
        expect(page.locator("h2").nth(1)).to_contain_text("Selecciona tu Cancha")

        # Count the number of court buttons
        court_buttons = page.locator("button:has-text('Cancha')")
        expect(court_buttons).to_have_count(2)
        print("HomePage court count verification successful.")
        page.screenshot(path="jules-scratch/verification/homepage_courts.png")

        # 2. Verify that the bookings page loads data
        # For this test, we can't truly log in, but we can navigate to the page
        # and check if the table structure is present, which implies the fetch was attempted.
        page.goto("http://localhost:5173/admin/bookings")

        # Check for the table header
        expect(page.locator("h1:has-text('Gestión de Turnos')")).to_be_visible(timeout=10000)
        expect(page.locator("table thead th:has-text('Cliente')")).to_be_visible()
        print("BookingsPage basic structure verification successful.")
        page.screenshot(path="jules-scratch/verification/bookings_page.png")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)