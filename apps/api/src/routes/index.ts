import type { FastifyInstance } from "fastify"
import { healthRoutes } from "./health.js"

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes)

  // Placeholder route groups for next implementation steps.
  app.get("/v1/tabs", async () => ({ items: [] }))
  app.get("/v1/collections", async () => ({ items: [] }))
  app.get("/v1/reminders", async () => ({ items: [] }))
  app.get("/v1/rules", async () => ({ items: [] }))
}
