// usage: node stills.mjs <bundleDir> <outDir> f1 f2 ...   (one browser, many stills; jpeg)
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
const [,, serveUrl, out, ...fr] = process.argv;
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'ep54-hamso', puppeteerInstance: browser});
for (const f of fr.map(Number)) {
  const t = Date.now();
  await renderStill({serveUrl, composition, frame: f, output: `${out}/f${String(f).padStart(5, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  console.log(f, Date.now() - t, 'ms');
}
await browser.close({silent: true});
