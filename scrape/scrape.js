import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
// import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import { queryEmails } from "./google.js";

const { LOCAL_DEVELOPMENT } = process.env;

puppeteer.use(StealthPlugin());
// puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());

// CAPTCHA_API_TOKEN
//const { CAPTCHA_API_TOKEN } = process.env;
// const pathToExtension = join(process.cwd(), `plugins`, `2captcha-solver`);

export const handler = async (event) => {
  const { queryStringParameters } = event;
  const url = queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "URL parameter is missing." }),
    };
  }

  const opts = LOCAL_DEVELOPMENT
    ? {
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
      }
    : {
        headless: false,
        args: [
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      };

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    ...opts,
  });

  const response = await queryEmails({ browser, url }).catch(async (e) => {
    console.log("[Error]", e.message);
    console.log("[Printing]");
    const [page] = await browser.pages();
    const screenshot = await page.screenshot({ encoding: "base64" });
    console.log(" screenshot", screenshot);
    return screenshot;
  });

  await browser.close();
  console.log("response", response);

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
