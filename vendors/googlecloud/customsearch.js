import dotenv from "dotenv";
dotenv.config();

import googleapis from "googleapis";
const { google } = googleapis;

const customSearch = google.customsearch("v1");
const { GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID } = process.env;

const getCustomSearch = (query, start = 0) =>
  customSearch.cse
    .list({
      auth: GOOGLE_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: query,
      start,
      num: 10,
    })
    .then(({ data }) => data);

export { getCustomSearch };
