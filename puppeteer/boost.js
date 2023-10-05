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
const { USER_LOGIN, PASSWORD, IS_LOCAL_DEVELOPMENT, LOCAL_PATH, KEYWORDS } =
  process.env;

const keywords = KEYWORDS
  ? encodeURIComponent(KEYWORDS.join(" "))
  : "hiring node";
const SEARCH_URL = `https://www.linkedin.com/search/results/people/?keywords=${keywords}`;
const ADD_REQUEST =
  "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashMemberRelationships";
const MAX_CONNECTIONS = 102;

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
    ...(IS_LOCAL_DEVELOPMENT === "true" ? { userDataDir: "./user-data" } : {}),
    ...opts,
  });

  const [page] = await browser.pages();

  let postRequestCount = 0;
  page.on("request", async (request) => {
    if (request.method() === "POST" && request.url().includes(ADD_REQUEST)) {
      postRequestCount++;
      console.log("One more connection!", `Count: ${postRequestCount}`);
      if (postRequestCount >= MAX_CONNECTIONS) {
        console.log(
          `Reached ${MAX_CONNECTIONS} requests. Closing the browser...`
        );
        await page.evaluate(() => {
          window.stopOperation();
          window.stopPromise(true);
        });
      }
    }
  });

  await page.goto(SEARCH_URL, { waitUntil: "networkidle2" });

  if (await page.$(".join-form__form-body-submit-button")) {
    await page.goto(LINKEDIN_URL);
    await page
      .waitForSelector("#session_key", { timeout: 2000 })
      .catch((err) => err);
    await page.type("#session_key", USER_LOGIN, { delay: 100 });
    await page.type("#session_password", PASSWORD, { delay: 100 });
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 2000));
    await page.goto(SEARCH_URL);
    await page.waitForNavigation({ timeout: 1000 }).catch((err) => err);
  }
  await page.evaluate(evaluate);

  await browser.close();
};

if (IS_LOCAL_DEVELOPMENT) await addContacts();

export { addContacts };
