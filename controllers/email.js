import SequelizeObject from "../database/connect.js";

const { models } = SequelizeObject;
const { EmailList } = models;

const getAllEmails = () => EmailList.findAll();
const getEmail = (opts) => EmailList.findOne(opts);
const createEmail = (body) => EmailList.create(body);
const updateEmail = (id, body) => EmailList.update(body, { where: { id } });
const deleteEmail = (id) => EmailList.destroy({ where: { id } });
const createEmails = (data) =>
  EmailList.bulkCreate(data, { individualHooks: true, validate: true });

const extractEmailsAndNames = (
  pageResultsClass,
  emailDomain = "@gmail.com",
  nameSelector = "h3",
  emailSelector = "div.Z26q7c span"
) => {
  const HTMLElements = Array.from(
    document.querySelector(pageResultsClass).children
  );
  return HTMLElements.reduce((acc, element) => {
    const innerText = element?.querySelector(nameSelector)?.innerText;

    const [firstName = "Unnamed", secondName = ""] = innerText
      ?.split(/[-(]/)[0]
      ?.trim()
      .split(/\s/);
    const name = `${firstName} ${secondName}`;

    const searchEmailRegex = new RegExp(
      String.raw`([a-z0-9._-]+${emailDomain})`,
      "gi"
    );
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
  createEmail,
  createEmails,
  updateEmail,
  deleteEmail,
  extractEmailsAndNames,
};
