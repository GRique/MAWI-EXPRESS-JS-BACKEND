const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      protocolTimeout: 120000, // Increase protocolTimeout to 120 seconds
      timeout: 120000 // Increase timeout to 120 seconds
    });

    console.log('Puppeteer launched, opening a new page...');
    const page = await browser.newPage();
    console.log('New page opened, navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'example.png' });

    console.log('Closing browser...');
    await browser.close();

    console.log('Puppeteer test script completed successfully.');
  } catch (error) {
    console.error('Error during Puppeteer execution:', error);
  }
})();
