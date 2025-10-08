import { logger } from "../logger"
import { createGenerator } from "ts-json-schema-generator"
import fs from "fs"
import path from "path"
import { Config } from "ts-json-schema-generator/dist/src/Config"

export function generatePackageSchema() {
    const projectRoot = process.cwd()

    const config: Config = {
        path: path.join(projectRoot, "src", "types", "package.ts"),
        tsconfig: path.join(projectRoot, "tsconfig.json"),
        type: "PrivatePackage",
    }

    const packageSchemaPath = path.join(
        projectRoot,
        "schemas",
        "private-package.schema.json",
    )

    const packageSchema = createGenerator(config).createSchema(config.type)

    // Add proper $id for FireFly compatibility at the beginning
    const baseUrl =
        process.env.SCHEMA_BASE_URL || "http://localhost:3000/schemas"
    const schemaWithId = {
        $id: `${baseUrl}/private-package.schema.json`,
        ...packageSchema,
    }
    try {
        const dir = path.dirname(packageSchemaPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(
            packageSchemaPath,
            JSON.stringify(schemaWithId, null, 2),
        )
        logger.info(
            `Schema for type ${config.type} has been saved to ${packageSchemaPath}`,
        )
    } catch (err) {
        logger.error({ err }, "Error writing schema to file")
    }

    try {
        if (require.cache[packageSchemaPath])
            delete require.cache[packageSchemaPath]
        const json = JSON.parse(fs.readFileSync(packageSchemaPath, "utf8"))
        return json
    } catch (err) {
        logger.error(
            { err, attemptedPath: packageSchemaPath },
            "Failed to load generated schema JSON",
        )
        throw err
    }
}
