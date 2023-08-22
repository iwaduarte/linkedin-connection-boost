const hashData = (data) => {
  let hash = 0,
    i,
    chr;
  if (data.length === 0) return hash;
  for (i = 0; i < data.length; i++) {
    chr = data.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const emailRegex = (emailDomain) =>
  new RegExp(String.raw`([a-z0-9._-]+${emailDomain})`, "gi");

const stripNameFromText = (text) => {
  const [firstName = "Unnamed", secondName = ""] = text
    ?.split(/[-(]/)[0]
    ?.trim()
    .split(/\s/);
  return `${firstName} ${secondName}`;
};

const utils = { hashData, delay, emailRegex, stripNameFromText };

export default utils;
export { hashData, delay, emailRegex, stripNameFromText };
