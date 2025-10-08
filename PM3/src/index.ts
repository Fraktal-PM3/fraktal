import { logger } from "./logger"
import { broadcastMessage, createContractAPI, createDatatype, getAssets, getContractAPI, getDatatype, invokeContractAPI } from "./services/firefly"
import { generatePackageSchema } from "./services/schemaGeneration"


async function main() {
    logger.info("App starting...")

    await createContractAPI()
    // await getContractAPI()
    // await invokeContractAPI()
    // await getAssets()
    // await broadcastMessage("Hello from PM3!")

    const schema = generatePackageSchema()

    await createDatatype("PrivatePackage", schema as any)
    logger.info("Datatype created")

    const res = await getDatatype("PrivatePackage", "1.0.0")
    logger.info({ res }, "Datatype fetched")
}

main().catch((err) => {
    logger.error({ err }, "Fatal error")
    process.exit(1)
})
