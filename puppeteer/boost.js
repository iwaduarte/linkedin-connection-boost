import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
import chromium from "@sparticuz/chromium";
import { evaluate } from "./evaluate.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUA());

const LINKEDIN_URL = "https://linkedin.com";
const { USER_LOGIN, PASSWORD, IS_LOCAL_DEVELOPMENT, LOCAL_PATH, KEYWORDS } = process.env;

const keywords = KEYWORDS ? encodeURIComponent(KEYWORDS.join(" ")) : "hiring";

const addContacts = async () => {
  const opts =
    IS_LOCAL_DEVELOPMENT === "true"
      ? {
          headless: false,
          executablePath: LOCAL_PATH,
          args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
          ],
        }
      : {
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            // `--disable-extensions-except=${pathToExtension}`,
            // `--load-extension=${pathToExtension}`,
            ...chromium.args,
          ],
        };

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    ...opts,
  });

  const [page] = await browser.pages();

  await page.goto(LINKEDIN_URL);
  await page.waitForNavigation({ timeout: 1000 }).catch((err) => err)
  await page.type('#session_key', USER_LOGIN, { delay: 100 })
  await page.type('#session_password', PASSWORD, { delay: 100 })
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2000));
  await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${keywords}&origin=SWITCH_SEARCH_VERTICAL`)
  await page.waitForNavigation({ timeout: 1000 }).catch((err) => err)
  await page.evaluate(evaluate);

};

await addContacts();