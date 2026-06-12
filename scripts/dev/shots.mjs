import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("shots", { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.screenshot({ path: "shots/landing.png", fullPage: true });
console.log("landing.png");

await p.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.screenshot({ path: "shots/app.png", fullPage: true });
console.log("app.png");

const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
await m.waitForTimeout(1500);
await m.screenshot({ path: "shots/app-mobile.png", fullPage: true });
console.log("app-mobile.png");

await b.close();
