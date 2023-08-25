
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

export { hashData, delay, emailRegex, stripNameFromText };
