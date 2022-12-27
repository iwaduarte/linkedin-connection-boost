import {
  extractEmailsAndNames,
  findOrCreateEmail,
} from "../controllers/email.js";
import { delay, hashData } from "../utils.js";
import { cachedData } from "../cachedData.js";
import { buildQueries } from "../queries.js";

// NUM could be: 10 20 40 50 100
const GOOGLE_URL = "https://www.google.com/search";
// const GOOGLE_URL = "http://localhost:3000/search";
const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";

const googleUrl = ({
  url = GOOGLE_URL,
  query,
  noFilters = 0,
  resultsPerPage = 100,
}) => `${url}?q=${query}&filter=${noFilters}&num=${resultsPerPage}`;

const { hashedEmails } = cachedData;

const _timeout = (randomTimeout = true, globalTimeout) =>
  randomTimeout
    ? (Math.floor(Math.random() * 5) + 1) * globalTimeout
    : globalTimeout;

const saveNewEmails = (emails = []) =>
  emails.reduce(async (acc, emailObject) => {
    const { email } = emailObject || {};
    const emailHashed = hashData(email);
    const [, created] = hashedEmails[emailHashed]
      ? [null, false]
      : await findOrCreateEmail({
          where: { emailHashed },
          defaults: emailObject,
        });

    if (created) {
      hashedEmails[emailHashed] = true;
      acc.then((_acc) => _acc.push([email, created]));
    }
    return acc;
  }, Promise.resolve([]));

const locateAndCreateEmails = async ({
  emails,
  timeout,
  globalTimeout,
  page,
  pageNumber,
  allNewEmails,
  maxData,
}) => {
  await delay(timeout);
  await page.waitForSelector(PAGE_RESULT_CLASS, { timeout: 0 });
  const allEmailsFromPage = await page
    .evaluate(extractEmailsAndNames, PAGE_RESULT_CLASS)
    .catch((err) => {
      console.log(`[Evaluate]`, err.message);
      return [];
    });

  const newEmailsFromPage = await saveNewEmails(allEmailsFromPage);
  emails.push(...newEmailsFromPage);
  const newPageNumber = pageNumber + 1;

  console.log(
    "Page n.:",
    pageNumber,
    "Emails found:",
    allEmailsFromPage.length,
    "Emails (not duplicated):",
    newEmailsFromPage.length,
    "Total scraped so far:",
    emails.length
  );

  const _allNewEmails = allNewEmails + newEmailsFromPage.length;
  const stale = _allNewEmails / pageNumber;

  const [endOfPage] = await page
    .click(NEXT_PAGE_ID)
    .then(() => [])
    .catch((e) => {
      console.log("Page click", e.message);
      return [true];
    });

  await page.waitForNavigation({ timeout: globalTimeout }).catch((err) => err);

  if (endOfPage) return emails;

  if (stale < 0.52 && pageNumber > 20) {
    console.log(`Staled Results`);
    return emails;
  }

  if (emails.length < maxData)
    return locateAndCreateEmails({
      emails,
      timeout,
      globalTimeout,
      page,
      pageNumber: newPageNumber,
      allNewEmails: _allNewEmails,
      maxData,
    });
  return emails;
};

const scrapeEmails = async ({
  page,
  pageNumber = 0,
  allNewEmails = 0,
  goTo,
  globalTimeout = 2000,
  maxData = 500,
  randomTimeout = true,
}) => {
  console.log("URL", goTo);
  await page.goto(goTo);
  await page.waitForNavigation({ timeout: globalTimeout }).catch((err) => err);

  const emails = [];
  return locateAndCreateEmails({
    emails,
    timeout: _timeout(randomTimeout, globalTimeout),
    pageNumber,
    allNewEmails,
    globalTimeout,
    page,
    maxData,
  }).catch((e) => {
    console.log("[locateEmails] Error", e.message);
    return emails;
  });
};

const startQuery = async ({ browser, iterator, oldPage, data = [] }) => {
  if (!cachedData?.queries?.length) {
    cachedData.queries = buildQueries();
  }
  const queries = cachedData?.queries?.slice(0, 5);
  const queriesIterator = iterator || queries[Symbol.iterator]();

  const { value: query, done } = queriesIterator.next();
  const newPage = await browser.newPage();

  if (done) return data;
  oldPage?.close();
  data.concat(
    await scrapeEmails({ page: newPage, goTo: googleUrl({ query }) })
  );
  await delay(30000);

  return startQuery({
    oldPage: newPage,
    browser,
    iterator: queriesIterator,
    data,
  });
};

export { scrapeEmails, startQuery };
