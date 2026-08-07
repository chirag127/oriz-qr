from playwright.sync_api import sync_playwright
args = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=args)
    d = b.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    d.goto("https://qr.oriz.in", wait_until="domcontentloaded", timeout=60000)
    d.wait_for_timeout(3000)
    d.screenshot(path="public/screenshots/desktop.png")
    d.close()
    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1, is_mobile=True)
    m.goto("https://qr.oriz.in", wait_until="domcontentloaded", timeout=60000)
    m.wait_for_timeout(3000)
    m.screenshot(path="public/screenshots/mobile.png")
    m.close()
    b.close()
print("shots done")
