import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import sensible from "@fastify/sensible"
import type { FastifyInstance } from "fastify"

export async function registerPlugins(app: FastifyInstance) {
  await app.register(helmet)
  await app.register(cors, { origin: true })
  await app.register(sensible)
}
