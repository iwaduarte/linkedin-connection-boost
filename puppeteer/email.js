import { extractEmailsAndNames, getEmail } from "../controllers/email.js";
import { hashData } from "../utils.js";
import { cachedData } from "../cachedData.js";

//query
//?q=site%3Alinkedin.com+%22software+engineer%22+%40gmail.com+United+States

const SEARCH_INPUT_CLASS = ".gLFyf";
const SEARCH_BUTTON_CLASS = ".FPdoLc.lJ9FBc  input.gNO89b";
const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";

// const GOOGLE_URL = "https://www.google.com/search";
const GOOGLE_URL = "http://localhost:3000/search";
const SEARCH_INPUT = `site:linkedin.com "software engineer" @gmail.com United States`;

const { hashedEmails } = cachedData;

const email = async (page) => {
  await page.goto(GOOGLE_URL);
  await page.type(SEARCH_INPUT_CLASS, SEARCH_INPUT, { delay: 25 });
  await page.waitForSelector(SEARCH_BUTTON_CLASS);
  await page.click(SEARCH_BUTTON_CLASS);
  await page.waitForNavigation({ timeout: 1000 }).catch((err) => err);

  const locateEmails = async (resolve, emails, timeout = 1000) => {
    setTimeout(async () => {
      await page.waitForSelector(PAGE_RESULT_CLASS);

      const _emailsFromPage = await page.evaluate(
        extractEmailsAndNames,
        PAGE_RESULT_CLASS
      );

      //finish ASYNC AWAIT
      const [emailsFromPage] = await Promise.all(
        _emailsFromPage.reduce(async ({ email }) => {
          const duplicateEmail =
            hashedEmails[hashData(email)] || (await getEmail(email));
          return !duplicateEmail;
        }, Promise.resolve([]))
      );

      emails.push(...emailsFromPage);
      await page.click(NEXT_PAGE_ID);
      await page.waitForNavigation({ timeout: 1000 }).catch((err) => err);
      console.log(emails.length);

      const _timeout = !(emails.length % 100) ? 10000 : timeout;
      if (emails.length < 12) return locateEmails(resolve, emails, _timeout);
      return resolve(emails);
    }, timeout);
  };

  const startScrapper = () => {
    const emails = [];
    return new Promise((resolve, rej) => {
      return locateEmails(resolve, emails);
    });
  };

  const emails = await startScrapper();

  console.log(emails);
};

export { email };
