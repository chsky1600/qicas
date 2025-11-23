import { Router } from "express";

const api = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Checks if the service is running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
api.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default api;
