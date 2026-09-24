const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const sizes = [
    { w: 320, h: 568, name: '320' },
    { w: 375, h: 812, name: '375' },
    { w: 390, h: 844, name: '390' },
    { w: 414, h: 896, name: '414' },
  ];
  const url = 'http://localhost:3456/templates/index.html';
  const outDir = path.join(__dirname, '_mobile_audit');
  fs.mkdirSync(outDir, { recursive: true });

  for (const s of sizes) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const report = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const overflowing = [];
      const all = document.querySelectorAll('body *');
      all.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
            sw: el.scrollWidth,
            cw: el.clientWidth,
            overflowX: Math.round(el.scrollWidth - el.clientWidth),
          });
        }
        if (r.right > docW + 2 || r.left < -2) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
            left: Math.round(r.left),
            right: Math.round(r.right),
            docW,
            type: 'viewport-overflow',
          });
        }
      });
      const bodyOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const header = document.querySelector('header .wrap');
      const hero = document.querySelector('.hero');
      const radar = document.querySelector('.radar-panel');
      const testiControls = document.querySelector('.testi-controls');
      const footer = document.querySelector('footer');
      const brand = document.querySelector('.brand');
      const toggle = document.querySelector('.mobile-nav-toggle');
      const h1 = document.querySelector('.hero-copy h1');
      const faqActive = document.querySelector('.faq-item.active .faq-a');
      const box = (el) => el ? {
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
        top: Math.round(el.getBoundingClientRect().top),
        cs: getComputedStyle(el),
        minH: getComputedStyle(el).minHeight,
        pad: getComputedStyle(el).padding,
        display: getComputedStyle(el).display,
      } : null;
      const compact = (b) => b ? { w: b.w, h: b.h, minH: b.minH, pad: b.pad, display: b.display } : null;
      return {
        bodyOverflow,
        header: compact(box(header)),
        brand: compact(box(brand)),
        toggle: compact(box(toggle)),
        hero: compact(box(hero)),
        radar: compact(box(radar)),
        h1: compact(box(h1)),
        testiControls: compact(box(testiControls)),
        faqA: faqActive ? { scrollH: faqActive.scrollHeight, clientH: faqActive.clientHeight, maxH: getComputedStyle(faqActive).maxHeight } : null,
        footer: compact(box(footer)),
        overflowing: overflowing.slice(0, 40),
      };
    });

    await page.screenshot({ path: path.join(outDir, `top-${s.name}.png`), fullPage: false });
    await page.screenshot({ path: path.join(outDir, `full-${s.name}.png`), fullPage: true });

    // scroll to sections
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.testi-frame').offsetTop - 20));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `testi-${s.name}.png`) });

    await page.evaluate(() => window.scrollTo(0, document.querySelector('.faq-section').offsetTop - 20));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `faq-${s.name}.png`) });

    await page.evaluate(() => window.scrollTo(0, document.querySelector('footer').offsetTop - 20));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `foot-${s.name}.png`) });

    fs.writeFileSync(path.join(outDir, `report-${s.name}.json`), JSON.stringify(report, null, 2));
    console.log('===', s.name, 'bodyOverflow', report.bodyOverflow, 'radarH', report.radar && report.radar.h, 'overflowCount', report.overflowing.length);
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
