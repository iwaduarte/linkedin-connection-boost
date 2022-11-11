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
  "Canada",
  "Brasil",
  "United Kingdom",
  "Australia",
  "Germany",
  "United States",
];
const defaultSites = ["site:linkedin.com"];

const buildQueries = (sites = defaultSites, encodeQuery = true) => {
  //cache build
  return professions
    ?.map((profession) => {
      return countries.map((country) => {
        return emails.map((email) => {
          return sites.map((site) => {
            const _query = `${site} ${profession} ${email} ${country}`;
            const query = encodeQuery
              ? encodeURIComponent(_query).replace(/%20/g, "+")
              : _query;

            return query.trim();
          });
        });
      });
    }, [])
    .flat(Infinity);
};

export { buildQueries };
