import _fs from "fs";
import _puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { startQuery } from "./scrapeEmails.js";
import { cachedData } from "../cachedData.js";
import { hashData } from "../utils.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());
// puppeteer.use(RecaptchaPlugin());

const { executablePath } = _puppeteer;
const fs = _fs.promises;

const browser = await puppeteer.launch({
  headless: false,
  ignoreHTTPSErrors: true,
  executablePath: executablePath(),
});

const savedEmails = JSON.parse(
  await fs.readFile("emails.list", "utf8").catch(() => "[]")
);

savedEmails?.forEach(
  ({ email }) => (cachedData.hashedEmails[hashData(email)] = true)
);

// create proxy request
// 1-

const allEmails = await startQuery({ browser });
await fs.writeFile("emails.list", JSON.stringify(allEmails, null, 2));
await browser.close();
