import { logger } from "../logger"
import { PrivatePackage, Urgency } from "../types/package"
const tsj = require("ts-json-schema-generator");
const fs = require("fs");
const path = require("path");

export function generatePackageSchema() {
    /** @type {import('ts-json-schema-generator/dist/src/Config').Config} */
    const projectRoot = process.cwd();
    const config = {
        path: path.join(projectRoot, "src", "types", "package.ts"),
        tsconfig: path.join(projectRoot, "tsconfig.json"),
        type: "PrivatePackage", // Or <type-name> if you want to generate schema for that one type only
    };

    // We want the generated schemas to live in projectRoot/schemas (not under src) so they can be distributed / inspected.
    const packageSchemaPath = path.join(projectRoot, "schemas", "package.json");
    const sizeSchemaPath = path.resolve(__dirname, "../schemas/size.json");
    const locationSchemaPath = path.resolve(__dirname, "../schemas/location.json");
    const urgencySchemaPath = path.resolve(__dirname, "../schemas/urgency.json");

    const packageSchema = tsj.createGenerator(config).createSchema(config.type);
    const sizeSchema = tsj.createGenerator({ ...config, type: "Size" }).createSchema("Size");
    const locationSchema = tsj.createGenerator({ ...config, type: "Location" }).createSchema("Location");
    const urgencySchema = tsj.createGenerator({ ...config, type: "Urgency" }).createSchema("Urgency");
    try {
        // Ensure the directory exists
        const dir = path.dirname(packageSchemaPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Ensure file is created if it doesn't exist
        if (!fs.existsSync(packageSchemaPath)) {
            fs.writeFileSync(packageSchemaPath, '');
            fs.writeFileSync(sizeSchemaPath, '');
            fs.writeFileSync(locationSchemaPath, '');
            fs.writeFileSync(urgencySchemaPath, '');
        }
        fs.writeFileSync(packageSchemaPath, JSON.stringify(packageSchema, null, 2));
        fs.writeFileSync(sizeSchemaPath, JSON.stringify(sizeSchema, null, 2));
        fs.writeFileSync(locationSchemaPath, JSON.stringify(locationSchema, null, 2));
        fs.writeFileSync(urgencySchemaPath, JSON.stringify(urgencySchema, null, 2));
        logger.info(`Schema for type ${config.type} has been saved to ${packageSchemaPath}`);
    } catch (err) {
        logger.error({ err }, "Error writing schema to file");
    }

    // Return the file as a json object
    try {
        if (require.cache[packageSchemaPath]) delete require.cache[packageSchemaPath];
        const json = require(packageSchemaPath);
        return json;
    } catch (err) {
        logger.error({ err, attemptedPath: packageSchemaPath }, "Failed to load generated schema JSON");
        throw err;
    }
} 