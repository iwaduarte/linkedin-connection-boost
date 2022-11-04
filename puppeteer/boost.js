import { extractEmailsAndNames } from "../controllers/email.js";

const LINKEDIN_URL = "https://linkedin.com";
const SEARCH_INPUT_CLASS = "";
const SEARCH_INPUT = "";
const SEARCH_BUTTON = "";
const { USERNAME, PASSWORD } = process.env;

const naiveBoost = async (page) => {
  await page.goto(LINKEDIN_URL);
  //login USERNAME | PASSWORD
  await page.type(SEARCH_INPUT_CLASS, SEARCH_INPUT, { delay: 25 });
  await page.waitForSelector(SEARCH_BUTTON_CLASS);
  await page.click(SEARCH_BUTTON_CLASS);
  await page.waitForNavigation({ timeout: 1000 }).catch((err) => err);
  const _emailsFromPage = await page.evaluate(
    extractEmailsAndNames,
    PAGE_RESULT_CLASS
  );

  const emails = await startScrapper();

  console.log(emails);
};
const contactBoost = () => {};

export { naiveBoost, contactBoost };
