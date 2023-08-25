import { cachedData } from "../cachedData.js";
import { buildQueries } from "../queries.js";

const GOOGLE_URL = "https://www.google.com/search";

const LAMBDA_URL = "scrape.iwaduarte.dev/scrape";

// Google became sensitive to search with query parameters (especially num)
// &filter=${noFilters}&num=${resultsPerPage}
// https://2captcha.com/blog/google-sepr-recaptcha-june-2022
// I am using anyway since I am using the power of proxies
const googleUrl = ({
  url = GOOGLE_URL,
  query,
  noFilters = 0,
  // results could be: 10 20 40 50 100
  resultsPerPage = 100,
}) => `${url}?q=${query}&filter=${noFilters}&num=${resultsPerPage}`;

const scrape = async () => {
  if (!cachedData?.queries?.length) {
    cachedData.queries = buildQueries();
  }

  const queries = cachedData.queries.slice(0, 10);

  const emails = await Promise.all(
    queries.map((query) => {
      console.log(query);
      return fetch(`${LAMBDA_URL}?url=${googleUrl({ query })}`)
        .then((response) => response.json())
        .catch((err) => err.message);
    })
  );
  console.log(emails);
  return emails;
};

await scrape();
