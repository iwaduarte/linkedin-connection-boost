import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import AnonymizeUA from "puppeteer-extra-plugin-anonymize-ua";
import { queryEmails } from "./google.js";
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());

// CAPTCHA_API_TOKEN
//const { CAPTCHA_API_TOKEN } = process.env;
// const pathToExtension = join(process.cwd(), `plugins`, `2captcha-solver`);

exports.handler = async (event) => {
  const { queryStringParameters } = event;
  const url = queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "URL parameter is missing." }),
    };
  }

  const browser = await puppeteer.launch({
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      // `--disable-extensions-except=${pathToExtension}`,
      // `--load-extension=${pathToExtension}`,
      ...chromium.args,
    ],
  });

  const emails = await queryEmails({ browser, url }).catch((err) =>
    console.log(err.message)
  );
  await browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify(emails),
  };
};
