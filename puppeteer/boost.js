import { extractEmailsAndNames } from "../controllers/email.js";

const LINKEDIN_URL = "https://linkedin.com";
const SEARCH_INPUT_CLASS = "";
const SEARCH_INPUT = "";
const SEARCH_BUTTON = "";
const { USERNAME, PASSWORD } = process.env;

const connect = () => {
  let i = 0;
  let count = 0;
  const getAllConnections = () =>
    Array.from(
      document.querySelectorAll('[id*="ember"] > span.artdeco-button__text')
    ).filter((e) => e.innerText === "Connect");

  let allConnections = getAllConnections();

  const interval = setInterval(async () => {
    scroll(0, document.body.clientHeight);
    if (i + 1 > allConnections.length) {
      document.querySelector('[aria-label="Next"]')?.click();
      await new Promise((r) => setTimeout(r, 500));
      allConnections = getAllConnections();
      i = 0;
      return;
    }

    console.log("allConnections", allConnections[i]);
    const titleModal = document.getElementById("send-invite-modal")?.innerText;
    if (titleModal?.includes("How do you know")) {
      document.querySelector('[aria-label="Other"]')?.click();
      document.querySelector('[aria-label="Connect"]')?.click();
    }
    allConnections[i].click();
    await new Promise((r) => setTimeout(r, 300));
    const sendInvite = document.querySelector('[aria-label="Send now"]');
    if (sendInvite.disabled)
      document.querySelector('[aria-label="Dismiss"]').click();
    else sendInvite?.click();

    i++;
    count++;
    console.log("Connect: ", count);
  }, 1400);

  const stopOperation = () => clearInterval(interval);
};

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
