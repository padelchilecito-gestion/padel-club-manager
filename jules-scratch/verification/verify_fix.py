
from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")
    # Wait for the 09:00 time slot to be visible
    page.wait_for_selector('h3:has-text("09:00")')
    page.screenshot(path="jules-scratch/verification/final_fix.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
