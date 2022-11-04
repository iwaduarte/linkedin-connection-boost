import express from 'express';

const router = express.Router();

router.get('/', (req, res) =>  res.json({ title: `[Sire] Hello`}));

export default router;
