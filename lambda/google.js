import { delay, emailRegex, stripNameFromText } from "../utils.js";
import { log } from "debug";

const PAGE_RESULT_CLASS = ".v7W49e";
const NEXT_PAGE_ID = "#pnnext";
const GLOBAL_TIMEOUT = 4000;

const extractEmailsAndNames = (
  pageResultsClass,
  emailDomain = "@gmail.com",
  nameSelector = "h3",
  emailSelector = "div.Z26q7c span"
) => {
  const HTMLElements = Array.from(
    document.querySelector(pageResultsClass)?.children || []
  );

  return HTMLElements.reduce((acc, element) => {
    const innerText = element?.querySelector(nameSelector)?.innerText;
    const name = stripNameFromText(innerText);
    const searchEmailRegex = emailRegex(emailDomain);
    const [emailOnTitle] = innerText?.match(searchEmailRegex) || [];
    const [email] = emailOnTitle
      ? [emailOnTitle]
      : Array.from(element?.querySelectorAll(emailSelector) || [])
          .find((span) => span.innerText.includes(emailDomain))
          ?.innerText?.match(searchEmailRegex) || [];
    if (email) acc.push({ name, email });
    return acc;
  }, []);
};

const getEmailsOnPage = async ({
  emails,
  globalTimeout,
  page,
  pageNumber,
  maxData,
  stale = 0,
}) => {
  const content = `window.stripNameFromText = ${stripNameFromText}; \
     window.emailRegex=${emailRegex};`;
  await page.addScriptTag({
    content,
  });

  await page.waitForSelector(PAGE_RESULT_CLASS, {
    timeout: globalTimeout * 3,
  });
  const allEmailsFromPage = await page
    .evaluate(extractEmailsAndNames, PAGE_RESULT_CLASS)
    .catch((err) => {
      console.log(`[Evaluate]`, err.message);
      return [];
    });

  const newEmails = emails.concat(allEmailsFromPage);
  const newPageNumber = pageNumber + 1;

  console.log(
    "Page n.:",
    pageNumber,
    "Emails found:",
    allEmailsFromPage.length,
    "No results for:",
    stale
  );

  const newStale = allEmailsFromPage.length === 0 ? stale + 1 : 0;

  await delay(globalTimeout);

  const [endOfPage] = await page
    .click(NEXT_PAGE_ID)
    .then(() => [])
    .catch((e) => {
      console.log("Page click", e.message);
      return [true];
    });

  await page
    .waitForNavigation({ timeout: globalTimeout })
    .catch((err) => console.log("[waitForNavigation]", err));

  if (endOfPage) return emails;

  if (newStale > 10) {
    console.log(`No results for ${stale} pages. Exiting...`);
    return emails;
  }

  if (emails?.length < maxData)
    return getEmailsOnPage({
      globalTimeout,
      page,
      maxData,
      emails: newEmails,
      pageNumber: newPageNumber,
      stale: newStale,
    });

  return emails;
};

const queryEmails = async ({ browser, url }) => {
  console.log("[queryEmails]", url);
  const [page] = await browser.pages();
  page.setBypassCSP(true);
  page.on(
    "console",
    (msg) =>
      !(
        msg.text().includes("MIME type") ||
        msg.text().includes("Failed to load resource")
      ) && console.log("PAGE LOG:", msg.text())
  );

  await page.goto(url);
  await page.waitForNavigation({ timeout: GLOBAL_TIMEOUT });

  return getEmailsOnPage({
    page,
    emails: [],
    pageNumber: 0,
    globalTimeout: GLOBAL_TIMEOUT,
    maxData: 5000,
  });
};

export { queryEmails };
