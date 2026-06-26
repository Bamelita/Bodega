const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Fill login
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Go to settings
    await page.goto('http://localhost:3000/admin/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT AFTER LOGIN:', bodyText.substring(0, 800));
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  await browser.close();
})();

