import express from "express";
import {
  getEmail,
  getAllEmails,
  updateEmail,
  deleteEmail,
} from "../controllers/email.js";

const router = express.Router();

router.get("/", async (req, res) => {
  return res.json(await getAllEmails());
});

router.get("/:id", async (req, res) => {
  const { params } = req;
  const { id } = params;
  return res.json(await getEmail(id));
});

router.post("/", async (req, res) => {
  //mockedEmail - you should remove after testing
  const user = {
    email: "express-sire@express-sire.com",
    name: "Bob",
  };
  const { body } = req;
  return res.json(body);
});

router.put("/:id", async (req, res) => {
  const { params, body } = req;
  const { id } = params;
  return res.json(await updateEmail(id, body));
});

router.delete("/:id", async (req, res) => {
  const { params } = req;
  const { id } = params;
  return res.json(await deleteEmail(id));
});

export default router;
