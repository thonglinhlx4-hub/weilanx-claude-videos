// usage: COMP=ep57-monty GL=swangle node scripts/ep58-stills.mjs <bundleDir> <outDir> f1 f2 ...   (one browser, many stills; jpeg)
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
const [,, serveUrl, out, ...fr] = process.argv;
const gl = process.env.GL || 'swangle';
const browser = await openBrowser('chrome', {chromiumOptions: {gl}});
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'ep58-rice', puppeteerInstance: browser, chromiumOptions: {gl}});
for (const f of fr.map(Number)) {
  const t = Date.now();
  await renderStill({serveUrl, composition, frame: f, output: `${out}/f${String(f).padStart(5, '0')}.${process.env.FMT === 'png' ? 'png' : 'jpg'}`, imageFormat: process.env.FMT === 'png' ? 'png' : 'jpeg', ...(process.env.FMT === 'png' ? {} : {jpegQuality: 88}), puppeteerInstance: browser, chromiumOptions: {gl}, onBrowserLog: (l) => { if (l.text.startsWith('prof') || l.type === 'error') console.log('  ', l.text.slice(0, 300)); }});
  console.log(f, Date.now() - t, 'ms');
}
await browser.close({silent: true});
