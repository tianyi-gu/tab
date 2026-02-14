import Fastify from "fastify"
import { registerPlugins } from "./plugins/register-plugins.js"
import { registerRoutes } from "./routes/index.js"

export async function buildServer() {
  const app = Fastify({ logger: true })

  await registerPlugins(app)
  await registerRoutes(app)

  return app
}
