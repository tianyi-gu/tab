import Fastify from "fastify"
import { registerPlugins } from "./plugins/register-plugins"
import { registerRoutes } from "./routes"

export async function buildServer() {
  const app = Fastify({ logger: true })

  await registerPlugins(app)
  await registerRoutes(app)

  return app
}
