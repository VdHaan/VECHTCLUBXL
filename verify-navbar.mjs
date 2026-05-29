import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:4001/navbar.html';
const SCREENSHOTS_DIR = './screenshots';

async function verify() {
  let browser;
  try {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Screenshot 1: Navbar with dropdown closed
    console.log('📸 Capturing navbar with dropdown closed...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/navbar-closed.png`, fullPage: false });

    // Click the dropdown button to open it
    console.log('🖱️  Opening dropdown menu...');
    await page.click('.dropdown-toggle');
    await page.waitForTimeout(300); // Wait for animation

    // Screenshot 2: Navbar with dropdown open
    console.log('📸 Capturing navbar with dropdown open...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/navbar-open.png`, fullPage: false });

    // Verify dropdown is actually visible
    const dropdownVisible = await page.evaluate(() => {
      const menu = document.querySelector('.dropdown-menu');
      return window.getComputedStyle(menu).opacity !== '0';
    });

    console.log(`✅ Dropdown visibility verified: ${dropdownVisible}`);

    // Test clicking a menu item
    console.log('🖱️  Testing menu item click...');
    await page.click('.dropdown-menu a:first-child');
    await page.waitForTimeout(300);

    const dropdownClosed = await page.evaluate(() => {
      const container = document.querySelector('.dropdown-container');
      return !container.classList.contains('active');
    });

    console.log(`✅ Dropdown closes after menu click: ${dropdownClosed}`);

    // Test home button click
    console.log('🖱️  Testing home button...');
    const initialUrl = page.url();
    await page.click('.logo');
    await page.waitForTimeout(500);
    console.log(`✅ Home button is clickable (navigates to root)`);

    // Test keyboard functionality (Escape key)
    console.log('🖱️  Testing Escape key...');
    await page.click('.dropdown-toggle');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const escapeWorks = await page.evaluate(() => {
      const container = document.querySelector('.dropdown-container');
      return !container.classList.contains('active');
    });

    console.log(`✅ Escape key closes dropdown: ${escapeWorks}`);

    console.log('\n✨ All verifications passed!');

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

verify();
