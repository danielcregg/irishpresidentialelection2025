import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        current_dir = os.getcwd()
        file_path = os.path.join(current_dir, 'index.html')

        # Navigate to the local file
        page.goto(f'file://{file_path}')

        # Verify the title of the page to confirm the HTML has loaded correctly.
        # The React app may not load from the file system, but we can check the static parts.
        expect(page).to_have_title("Irish Presidential Election 2025 — STV Demo")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()