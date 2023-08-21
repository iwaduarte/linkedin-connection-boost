import SequelizeObject from "../database/connect.js";

const { models } = SequelizeObject;
const { EmailList } = models;

const getAllEmails = (options) => EmailList.findAll(options);
const getEmail = (opts) => EmailList.findOne(opts);
const findOrCreateEmail = (where, defaults) =>
  EmailList.findOrCreate({ where, defaults }).catch((err) => {
    console.log(`${err.message}: ${defaults.email}`);
    return [null, false];
  });
const updateEmail = (id, body) => EmailList.update(body, { where: { id } });
const deleteEmail = (id) => EmailList.destroy({ where: { id } });
const createEmails = (data) =>
  EmailList.bulkCreate(data, { individualHooks: true, validate: true });

const extractEmailsAndNames = (
  pageResultsClass,
  emailDomain = "@gmail.com",
  nameSelector = "h3",
  emailSelector = "div.Z26q7c span",
  extraUtils
) => {
  const HTMLElements = Array.from(
    document.querySelector(pageResultsClass)?.children || []
  );
  return HTMLElements.reduce((acc, element) => {
    const innerText = element?.querySelector(nameSelector)?.innerText;
    const name = extraUtils.stripNameFromText(innerText);
    const searchEmailRegex = extraUtils.emailRegex(emailDomain);
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

export {
  getEmail,
  getAllEmails,
  findOrCreateEmail,
  createEmails,
  updateEmail,
  deleteEmail,
  extractEmailsAndNames,
};
