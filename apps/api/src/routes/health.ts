import type { FastifyInstance } from "fastify"

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "garbo-api",
      timestamp: new Date().toISOString()
    }
  })
}
