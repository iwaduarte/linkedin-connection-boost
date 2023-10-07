import { evaluate } from "./evaluate.js";
import { botDetection, initBrowser, takeScreenshot } from "./utils.js";

const { USER_LOGIN, PASSWORD, IS_LOCAL_DEVELOPMENT, KEYWORDS } = process.env;

const MAX_CONNECTIONS = 190;
const ADD_REQUEST =
  "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashMemberRelationships";
const LINKEDIN_URL = "https://linkedin.com";
const keywords = KEYWORDS
  ? encodeURIComponent(KEYWORDS.join(" "))
  : "cto hiring";
const RESULTS_URL = "https://www.linkedin.com/search/results/people/";
const SEARCH_URL = `https://www.linkedin.com/search/results/people/?keywords=${keywords}`;
const login = async (page) => {
  await page.goto(LINKEDIN_URL);
  const [error] = await page
    .waitForSelector("#session_key", { timeout: 1500 })
    .then((nodeElement) => [false, nodeElement])
    .catch((err) => [err, false]);

  if (error) {
    console.log("Skipping login, already connected");
    return;
  }
  await page.type("#session_key", USER_LOGIN, { delay: 100 });
  await page.type("#session_password", PASSWORD, { delay: 100 });
  await page.click('button[type="submit"]');
  await takeScreenshot(page);
  await new Promise((r) => setTimeout(r, 2000));
};
const addContacts = async () => {
  const browser = await initBrowser();
  // browser.pages() doesn't work for avoid bot detection
  // See: https://github.com/puppeteer/puppeteer/issues/2669
  // Full reference: https://github.com/berstend/puppeteer-extra/blob/39248f1f5deeb21b1e7eb6ae07b8ef73f1231ab9/packages/puppeteer-extra/src/index.ts#L234
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await botDetection(page);

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

  await login(page);
  await page.goto(SEARCH_URL, { waitUntil: "networkidle2" });
  await page.waitForNavigation({ timeout: 1000 }).catch((err) => err);

  if (!page.url().includes(RESULTS_URL)) {
    await takeScreenshot(page);
    return browser.close();
  }

  await page.evaluate(evaluate);
  await browser.close();
};

if (IS_LOCAL_DEVELOPMENT) await addContacts();

export { addContacts };
