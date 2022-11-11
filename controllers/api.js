import { getCustomSearch } from "../vendors/googlecloud/customsearch.js";
import { buildQueries } from "../queries.js";
import { emailRegex, hashData, stripNameFromText } from "../utils.js";
import { findOrCreateEmail } from "./email.js";

import { cachedData } from "../cachedData.js";

const API_DAILY_LIMIT = 3;
// `"software engineer" "@gmail.com" United States`;
const queries = buildQueries([""], false).slice(0, API_DAILY_LIMIT);

const emailDomain = "@gmail.com";
const _emailRegex = emailRegex(emailDomain);
const { hashedEmails } = cachedData;

// Note: when sending query parameters with encodeURIComponent, the customsearch API disregarded the start property and number property for some reason.
// Maybe that is hackable.
// Investigate with postman afterwards

const getNext = async (query, start = 0, itemsArray) => {
  const { items, queries } = await getCustomSearch((query = 0));
  const { nextPage } = queries || {};
  const [{ startIndex }] = nextPage || [{}];
  if (!startIndex) return itemsArray;

  return getNext(query, startIndex, itemsArray.concat(items)).catch((err) => {
    console.log(err);
    return itemsArray;
  });
};

const scrapeEmailsAPI = (_queries = queries) => {
  return Promise.all(
    _queries.map(async (query) => {
      // needs to iterate again until hits the last page or breaks
      const items = await getNext(query);
      items.map(async (item) => {
        const { title, snippet } = item;
        const name = stripNameFromText(title);
        const [email] = title.match(_emailRegex) || snippet.match(_emailRegex);

        if (!email) return null;

        const emailHashed = hashData(email);
        const [, created] = hashedEmails[emailHashed]
          ? [null, false]
          : await findOrCreateEmail(emailHashed, { name, email });

        if (created) {
          hashedEmails[emailHashed] = true;
        }
        return { name, email, created };
      });
    })
  ).catch((err) => {
    // err.message.includes("Quota exceeded");
    // start scrapping from stopped
    console.log(err);
  });
};

export { scrapeEmailsAPI };
