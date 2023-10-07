import dotenv from "dotenv";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

dotenv.config();

const { IS_LOCAL_DEVELOPMENT, LOCAL_PATH } = process.env;

puppeteer.use(StealthPlugin());

const opts =
  IS_LOCAL_DEVELOPMENT === "true"
    ? {
        // headless: false,
        headless: true, //old headless
        // headless: new, //new headless
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
  });

  !IS_LOCAL_DEVELOPMENT && console.log("screenshot", screenshot);
};

const botDetection = async (page) => {
  await page.goto("https://bot.sannysoft.com/", { waitUntil: "networkidle2" });
  return takeScreenshot(page, true);
};

const initBrowser = () =>
  puppeteer.launch({
    ignoreHTTPSErrors: true,
    ...(IS_LOCAL_DEVELOPMENT === "true" ? { userDataDir: "./user-data" } : {}),
    ...opts,
    // Fix protocol timed out see: https://github.com/puppeteer/puppeteer/issues/9927
    protocolTimeout: 0,
  });

export { initBrowser, botDetection, takeScreenshot };
