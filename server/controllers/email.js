import SequelizeObject from "../database/connect.js";
import { cachedData } from "../cachedData.js";

const { models } = SequelizeObject;
const { EmailList } = models;

const getAllEmails = (options) => EmailList.findAll(options);
const getEmail = (opts) => EmailList.findOne(opts);
const findOrCreateEmail = ({ where, defaults }) =>
  EmailList.findOrCreate({ where, defaults }).catch((err) => {
    console.log(`${err.message}: ${defaults.email}`);
    return [null, false];
  });
const updateEmail = (id, body) => EmailList.update(body, { where: { id } });
const deleteEmail = (id) => EmailList.destroy({ where: { id } });
const createEmails = (data) =>
  EmailList.bulkCreate(data, { individualHooks: true, validate: true });

const { existentEmails } = cachedData;
const saveNewEmails = (emails = []) =>
  emails.reduce(async (acc, emailObject) => {
    const { email } = emailObject || {};
    const [, created] = existentEmails[email]
      ? [null, false]
      : await findOrCreateEmail({
          where: { email },
          defaults: emailObject,
        });

    if (created) {
      existentEmails[email] = true;
      acc.then((_acc) => _acc.push([email, created]));
    }
    return acc;
  }, Promise.resolve([]));

export {
  getEmail,
  getAllEmails,
  findOrCreateEmail,
  createEmails,
  updateEmail,
  deleteEmail,
  saveNewEmails,
};
