import express from "express"
import path from "path"
import fs from "fs"
import { logger } from "./logger"

/*
 * Create Express server to serve JSON schemas for datatypes.
 * Schemas are served from the /schemas endpoint.
 * Example: GET /schemas/private-package.schema.json
 */
export function createServer() {
    const app = express()
    const port = process.env.PORT || 3000

    // Serve schemas from /schemas endpoint
    app.get("/schemas/:schemaName", (req, res) => {
        const schemaName = req.params.schemaName
        const schemaPath = path.join(process.cwd(), "schemas", schemaName)

        logger.info({ schemaName, schemaPath }, "Schema requested")

        if (!fs.existsSync(schemaPath)) {
            logger.warn({ schemaName }, "Schema not found")
            return res.status(404).json({ error: "Schema not found" })
        }

        try {
            const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"))
            res.setHeader("Content-Type", "application/json")
            res.json(schema)
        } catch (err) {
            logger.error({ err, schemaName }, "Error reading schema")
            res.status(500).json({ error: "Error reading schema" })
        }
    })

    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() })
    })

    return { app, port }
}

/*
 * Start the Express server
 */
export function startServer() {
    const { app, port } = createServer()

    app.listen(port, () => {
        logger.info(
            { port },
            `Schema server running on http://localhost:${port}`,
        )
        logger.info("Available endpoints:")
        logger.info(`  - GET /schemas/package.json - Private Package schema`)
        logger.info(`  - GET /health - Health check`)
    })

    return app
}
