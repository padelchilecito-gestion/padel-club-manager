from playwright.sync_api import sync_playwright, expect
import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Go to the home page
        page.goto("http://localhost:5173/")

        # 2. Verify the date picker is present and select today's date
        date_label = page.get_by_label("1. Elige una fecha")
        expect(date_label).to_be_visible()

        today_str = datetime.date.today().strftime("%Y-%m-%d")
        page.locator("#date-select").fill(today_str)

        # 3. Wait for the loading message to disappear
        loading_message = page.get_by_text("Buscando turnos...")
        expect(loading_message).to_be_hidden(timeout=15000)

        # DEBUG: Take a screenshot after loading is complete
        page.screenshot(path="jules-scratch/verification/debug_screenshot.png")

        # 4. Check if the "no slots" message is present or if slots are available
        no_slots_message = page.get_by_text("No hay turnos disponibles para esta fecha.")

        if (no_slots_message.is_visible()):
            print("No available slots found for today. This might be expected.")
            page.screenshot(path="jules-scratch/verification/booking_flow_no_slots.png")
        else:
            # Proceed with booking flow if slots are found
            first_slot = page.locator(".grid button").first
            expect(first_slot).to_be_enabled()
            first_slot.click()

            cancha_label = page.get_by_text("3. Elige una cancha para las", exact=False)
            expect(cancha_label).to_be_visible()

            first_court = page.locator("div.flex.flex-wrap.gap-2 button").first
            expect(first_court).to_be_enabled()
            first_court.click()

            datos_label = page.get_by_text("4. Completa tus datos")
            expect(datos_label).to_be_visible()

            page.get_by_placeholder("Tu Nombre").fill("Jules Verne")
            page.get_by_placeholder("Tu Teléfono (sin 0 y sin 15)").fill("1122334455")

            page.screenshot(path="jules-scratch/verification/booking_flow_verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)