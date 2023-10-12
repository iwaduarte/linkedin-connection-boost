import dotenv from "dotenv";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { newInjectedPage } from "fingerprint-injector";
import chromium from "@sparticuz/chromium";
import readlinePromises from "node:readline/promises";

dotenv.config();

const { IS_LOCAL_DEVELOPMENT, LOCAL_PATH, CAPTCHA_API_TOKEN } = process.env;

puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: CAPTCHA_API_TOKEN,
    },
    visualFeedback: true,
  })
);

const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const opts =
  IS_LOCAL_DEVELOPMENT === "true"
    ? {
        // headless: false,
        // headless: true, //old headless
        headless: "new", //new headless
        executablePath: LOCAL_PATH,
        args: [
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--user-agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'",
        ],
      }
    : {
        headless: "new",
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        args: [
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          // `--disable-extensions-except=${pathToExtension}`,
          // `--load-extension=${pathToExtension}`,
          ...chromium.args.filter((arg) => !arg.includes("headless")),
          "--headless=new",
          "--user-agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'",
        ],
      };

await fetch("https://checkip.amazonaws.com/")
  .then((response) => response.text())
  .then((data) => {
    console.log(`Your public IP address is: ${data.trim()}`);
  })
  .catch((error) => {
    console.log("An error occurred:", error);
  });

const takeScreenshot = async (page, fullPage = false) => {
  const fileName = `screenshot_${Date.now()}.png`;
  const encoding = IS_LOCAL_DEVELOPMENT ? "binary" : "base64";
  const path = IS_LOCAL_DEVELOPMENT ? fileName : "";

  console.log("page Url", page.url());

  //fullPage property changes the viewPort
  const screenshot = await page.screenshot({
    path,
    encoding,
    fullPage,
  });

  !IS_LOCAL_DEVELOPMENT && console.log("screenshot", screenshot);
};

const readConsole = (question = "") => {
  return rl.question(question);
};

const botDetection = async (browser, urls = []) => {
  const newUrls = urls.length
    ? urls
    : [
        "https://bot.sannysoft.com/",
        "https://antoinevastel.com/bots",
        "https://abrahamjuliot.github.io/creepjs/",
      ];

  await Promise.all(
    newUrls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: "networkidle2",
      });
      return takeScreenshot(page, true);
    })
  );
};

const resolveCaptcha = async (page) => {
  console.log("Captcha Required");
  await page.solveRecaptchas();
};

const initBrowser = async () => {
  const stealthBrowser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    // ...(IS_LOCAL_DEVELOPMENT === "true" ? { userDataDir: "./user-data" } : {}),
    ...opts,
    // Fix protocol timed out see: https://github.com/puppeteer/puppeteer/issues/9927
    protocolTimeout: 0,
  });

  return new Proxy(stealthBrowser, {
    get: (target, key) => {
      if (key === "newPage") {
        return () => newInjectedPage(stealthBrowser);
      }

      return target[key];
    },
  });
};

export {
  initBrowser,
  botDetection,
  takeScreenshot,
  readConsole,
  resolveCaptcha,
};
