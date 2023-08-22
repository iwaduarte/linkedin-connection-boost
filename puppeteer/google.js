import {
  extractEmailsAndNames,
  findOrCreateEmail,
} from "../controllers/email.js";
import utils from "../utils.js";
import { cachedData } from "../cachedData.js";
import { buildQueries } from "../queries.js";

// NUM could be: 10 20 40 50 100
const GOOGLE_URL = "https://www.google.com/search";
// const GOOGLE_URL = "http://localhost:3000/search";
const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";
const { delay, hashData, ...extraUtils } = utils;

const googleUrl = ({
  url = GOOGLE_URL,
  query,
  noFilters = 0,
  resultsPerPage = 100,
}) => `${url}?q=${query}&filter=${noFilters}&num=${resultsPerPage}`;

const { existentEmails } = cachedData;

const saveNewEmails = (emails = []) =>
  emails.reduce(async (acc, emailObject) => {
    const { email, emailHashed } = emailObject || {};
    const [, created] = existentEmails[email]
      ? [null, false]
      : await findOrCreateEmail({
          where: { emailHashed },
          defaults: emailObject,
        });

    if (created) {
      existentEmails[email] = true;
      acc.then((_acc) => _acc.push([email, created]));
    }
    return acc;
  }, Promise.resolve([]));

const locateAndCreateEmails = async ({
  emails,
  globalTimeout,
  page,
  pageNumber,
  allNewEmails,
  maxData,
}) => {
  await page.waitForSelector(PAGE_RESULT_CLASS, { timeout: 0 });
  const allEmailsFromPage = await page
    .evaluate(extractEmailsAndNames, PAGE_RESULT_CLASS, extraUtils)
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

  await delay(globalTimeout);
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
      globalTimeout,
      page,
      pageNumber: newPageNumber,
      allNewEmails: _allNewEmails,
      maxData,
    });

  return emails;
};

const google = async ({
  page,
  pageNumber = 0,
  allNewEmails = 0,
  goTo,
  globalTimeout = 4000,
  maxData = 500,
}) => {
  console.log("URL", goTo);
  await page.goto(goTo);
  await page.waitForNavigation({ timeout: globalTimeout }).catch((err) => err);

  const emails = [];
  return locateAndCreateEmails({
    emails,
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

const queryEmails = async ({ browser, iterator, oldPage }) => {
  if (!cachedData?.queries?.length) {
    cachedData.queries = buildQueries();
  }
  const queries = cachedData?.queries?.slice(0, 5);
  const queriesIterator = iterator || queries[Symbol.iterator]();
  const { value: query, done } = queriesIterator.next();

  if (done) return true;

  // every new query should be behind a different incognito proxy
  await oldPage?.close();
  const newPage = await browser.newPage();
  await google({ goTo: googleUrl({ query }), page: newPage });
  await delay(120000);

  return queryEmails({
    oldPage: newPage,
    browser,
    iterator: queriesIterator,
  });
};

export { google, queryEmails };
