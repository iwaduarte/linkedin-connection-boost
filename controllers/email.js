import SequelizeObject from "../database/connect.js";

const { models } = SequelizeObject;
const { Email } = models;

const getAllEmails = () => Email.findAll();
const getEmail = (id) => Email.findByPK(id);
const createEmail = (body) => Email.create(body);
const updateEmail = (id, body) => Email.update(body, { where: { id } });
const deleteEmail = (id) => Email.destroy({ where: { id } });

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

    const name = innerText?.split(/[-(]/)[0]?.trim();

    const searchEmailRegex = new RegExp(
      String.raw`([a-z0-9._-]*${emailDomain})`,
      "gi"
    );
    const [emailOnTitle] = innerText?.match(searchEmailRegex) || [];
    const [email] = emailOnTitle
      ? [emailOnTitle]
      : Array.from(element?.querySelectorAll(emailSelector))
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
  updateEmail,
  deleteEmail,
  extractEmailsAndNames,
};
