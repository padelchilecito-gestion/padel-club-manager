from playwright.sync_api import sync_playwright, expect
import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Go to the home page
        page.goto("http://localhost:5173/")

        # 2. Verify the date picker is present and select a future date to ensure slots are available
        date_label = page.get_by_label("1. Elige una fecha")
        expect(date_label).to_be_visible()

        # Select a date 3 days from now to increase likelihood of available slots
        future_date = datetime.date.today() + datetime.timedelta(days=3)
        future_date_str = future_date.strftime("%Y-%m-%d")
        page.locator("#date-select").fill(future_date_str)

        # 3. Wait for loading to finish and verify time slots appear
        loading_message = page.get_by_text("Buscando turnos...")
        expect(loading_message).to_be_hidden(timeout=15000)

        # 4. Click the first available time slot
        first_slot = page.locator(".grid button").first
        expect(first_slot).to_be_enabled()
        first_slot.click()

        # 5. Verify court selection appears and click the first one
        cancha_label = page.get_by_text("3. Elige una cancha para las", exact=False)
        expect(cancha_label).to_be_visible()

        first_court = page.locator("div.flex.flex-wrap.gap-2 button").first
        expect(first_court).to_be_enabled()
        first_court.click()

        # 6. Verify the user form appears and fill it out
        datos_label = page.get_by_text("4. Completa tus datos")
        expect(datos_label).to_be_visible()

        page.get_by_placeholder("Tu Nombre").fill("Jules Verne")
        page.get_by_placeholder("Tu Teléfono (sin 0 y sin 15)").fill("1122334455")

        # 7. Take a screenshot of the completed form for visual confirmation
        page.screenshot(path="jules-scratch/verification/new_booking_flow.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)