import _puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import { createEmail, extractEmailsAndNames } from "../controllers/email.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { email } from "./email.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());
// puppeteer.use(RecaptchaPlugin());

const { executablePath } = _puppeteer;

//
const browser = await puppeteer.launch({
  headless: false,
  ignoreHTTPSErrors: true,
  executablePath: executablePath(),
});
const page = await browser.newPage();
await email(page);

// await Promise.all(emails.map(createEmail));

// await browser.close();
