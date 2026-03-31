import { Router } from "express";

const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default api;