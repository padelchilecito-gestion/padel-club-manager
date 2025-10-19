from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to HomePage
        page.goto("http://localhost:5173/")

        # 2. Wait for the loading message to disappear
        loading_message = page.locator("text=Cargando disponibilidad...")
        expect(loading_message).to_be_hidden(timeout=15000)
        print("Loading message disappeared successfully.")

        # 3. Check for an error message (expected in this test env)
        error_message = page.locator("text=No se pudieron cargar los horarios. Por favor, intenta de nuevo más tarde.")
        expect(error_message).to_be_visible()
        print("Error message is displayed correctly.")

        # 4. Take a screenshot of the final state
        page.screenshot(path="jules-scratch/verification/final_error_state.png")
        print("Final error state screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)