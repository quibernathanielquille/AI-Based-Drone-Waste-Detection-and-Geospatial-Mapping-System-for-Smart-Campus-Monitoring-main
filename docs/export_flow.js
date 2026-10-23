const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = path.resolve(__dirname, 'campus_eye_system_flow.html');
  const jpgPath = path.resolve(__dirname, 'campus_eye_system_flow.jpg');
  const archPath = path.resolve(__dirname, 'campus_eye_system_architecture.jpg');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1380, height: 640, deviceScaleFactor: 2 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  const el = await page.$('#flow');
  await el.screenshot({ path: jpgPath, type: 'jpeg', quality: 96 });
  fs.copyFileSync(jpgPath, archPath);
  await browser.close();
  console.log('Saved:', jpgPath);
})();
