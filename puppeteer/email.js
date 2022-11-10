import { extractEmailsAndNames, getEmail } from "../controllers/email.js";
import { delay, hashData } from "../utils.js";
import { cachedData } from "../cachedData.js";

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

// NUM could be: 10 20 40 50 100
// const GOOGLE_URL = "https://www.google.com/search"
const GOOGLE_URL = "http://localhost:3000/search";
const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";

const googleUrl = ({
  url = GOOGLE_URL,
  query,
  noFilters = 0,
  resultsPerPage = 100,
}) => `${url}?q=${query}&filter=${noFilters}&num=${resultsPerPage}`;

const { hashedEmails } = cachedData;

const email = async ({
  page,
  pageNumber = 0,
  newEmails = 0,
  goTo,
  globalTimeout = 2000,
  maxData = 500,
  randomTimeout = true,
}) => {
  console.log("URL", goTo);
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
    pageNumber += 1;
    await page
      .waitForNavigation({ timeout: globalTimeout })
      .catch((err) => err);

    console.log("PAGE:", pageNumber);
    console.log("EMAILS FOUND IN THAT PAGE:", _emailsFromPage.length);
    console.log(
      "EMAILS FOUND IN THAT PAGE NOT DUPLICATED:",
      emailsFromPage.length
    );
    console.log("TOTAL EMAILS SCRAPPED SO FAR:", emails.length);

    newEmails += emailsFromPage.length;
    const stale = newEmails / pageNumber;
    console.log("Stale", stale);
    //return to 20
    if (stale < 0.52 && pageNumber > 5) return emails;
    const _timeout =
      emails.length % 100 === 0 && emails.length !== 0 ? 10000 : void 0;
    if (emails.length < maxData) return locateEmails(emails);
    return emails;
  };

  const startScrapper = () => {
    const emails = [];
    return locateEmails(emails).catch((e) => {
      console.log("Error", e.message);
      return emails;
    });
  };
  return startScrapper();
};

const startQuery = async ({ browser, iterator, oldPage, data = [] }) => {
  const queriesIterator = iterator || buildQueries()[Symbol.iterator]();
  const { value: query, done } = queriesIterator.next();
  const newPage = await browser.newPage();

  if (done) return data;

  await delay(10000);
  oldPage?.close();
  data.concat(await email({ page: newPage, goTo: googleUrl({ query }) }));

  return startQuery({
    oldPage: newPage,
    browser,
    iterator: queriesIterator,
    data,
  });
};

export { email, startQuery };
