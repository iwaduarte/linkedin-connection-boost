import { extractEmailsAndNames, getEmail } from "../controllers/email.js";
import { delay, hashData } from "../utils.js";
import { cachedData } from "../cachedData.js";

//query
//?q=site%3Alinkedin.com+%22software+engineer%22+%40gmail.com+United+States

const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";

// const GOOGLE_URL = "http://localhost:3000/search";

const professions = [
  '"software engineer"',
  '"developer"',
  '"full stack"',
  '"recruiter"',
  '"CTO"',
  '"CEO"',
];
const emails = ['"@gmail.com"'];
const countries = [
  "United States",
  "Canada",
  "Brasil",
  "United Kingdom",
  "Australia",
  "Germany",
];
const site = ["site:linkedin.com"];

const buildQueries = () => {
  //cache build
  return professions
    .map((profession) => {
      return countries.map((country) => {
        return emails.map((email) => {
          return site.map((site) =>
            encodeURIComponent(
              `${site} ${profession} ${email} ${country}`
            ).replace(/\%20/g, "+")
          );
        });
      });
    }, [])
    .flat(Infinity);
};

//10 20 40 50 100
const RESULTS_PER_PAGES = 100;
// const QUERY = encodeURIComponent(
('site:linkedin.com "software engineer" "@gmail.com" United States');

const NO_FILTERS = 0;
const GOOGLE_URL = `https://www.google.com/search?q=${QUERY}&filter=${NO_FILTERS}&num=${RESULTS_PER_PAGES}`;

const { hashedEmails } = cachedData;

const email = async (
  page,
  goTo,
  globalTimeout = 2000,
  MAX_DATA = 500,
  randomTimeout = true
) => {
  await page.goto(goTo);
  await page.waitForNavigation({ timeout: globalTimeout }).catch((err) => err);
  const _timeout = () =>
    randomTimeout
      ? (Math.floor(Math.random() * 5) + 1) * globalTimeout
      : globalTimeout;

  const locateEmails = async (emails, timeout = _timeout()) => {
    await delay(timeout);
    await page.waitForSelector(PAGE_RESULT_CLASS);
    const _emailsFromPage = await page.evaluate(
      extractEmailsAndNames,
      PAGE_RESULT_CLASS
    );
    const emailsFromPage = await _emailsFromPage.reduce(
      async (acc, emailObject) => {
        const { email } = emailObject || {};
        const _acc = await acc;
        const emailHashed = hashData(email);
        const duplicateEmail =
          hashedEmails[emailHashed] ||
          (await getEmail({ where: { emailHashed }, attributes: ["id"] }));

        !duplicateEmail && _acc.push(emailObject);
        hashedEmails[emailHashed] = true;

        return _acc;
      },
      []
    );

    emails.push(...emailsFromPage);
    await page.click(NEXT_PAGE_ID);
    cachedData.PAGE += 1;
    await page
      .waitForNavigation({ timeout: globalTimeout })
      .catch((err) => err);

    console.log("PAGE:", cachedData.PAGE);
    console.log("EMAILS FOUND IN THAT PAGE:", _emailsFromPage.length);
    console.log(
      "EMAILS FOUND IN THAT PAGE NOT DUPLICATED:",
      emailsFromPage.length
    );
    console.log("TOTAL EMAILS SCRAPPED SO FAR:", emails.length);

    cachedData.newEmails += emailsFromPage.length;
    const stale = cachedData.newEmails / cachedData.PAGE;
    console.log("Stale", stale);

    if (stale < 0.52 && cachedData.PAGE > 20) return emails;
    const _timeout =
      emails.length % 100 === 0 && emails.length !== 0 ? 10000 : void 0;
    if (emails.length < MAX_DATA) return locateEmails(emails);
    return emails;
  };

  const startScrapper = () => {
    const emails = [];
    return locateEmails(emails).catch((e) => {
      console.log("Error", e);
      return emails;
    });
  };
  return startScrapper();
};

const startQuery = async ({ browser, iterator, oldPage, data = [] }) => {
  const queriesIterator = iterator || buildQueries()[Symbol.iterator]();
  const { value: goTo, done } = queriesIterator.next();
  const newPage = browser.newPage();

  if (!done) return;

  await delay(10000);
  oldPage?.close();
  data.concat(await email(newPage, goTo));

  return startQuery({ oldPage: newPage, browser, iterator: queriesIterator });
};

export { email, startQuery };
