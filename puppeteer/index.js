import _fs from "fs";
import _puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { queryEmails } from "./google.js";
import { cachedData } from "../cachedData.js";
import { getAllEmails } from "../controllers/email.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());
// puppeteer.use(RecaptchaPlugin());

const { executablePath } = _puppeteer;

const browser = await puppeteer.launch({
  headless: false,
  ignoreHTTPSErrors: true,
  executablePath: executablePath(),
});

(await getAllEmails().catch(() => [])).forEach(
  ({ email }) => (cachedData.existentEmails[email] = true)
);

// create proxy request
// 1-

await queryEmails({ browser });
await browser.close();
