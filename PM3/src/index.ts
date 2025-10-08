import { broadcastMessage, createContractAPI, getAssets, getContractAPI, invokeContractAPI } from "./services/firefly"
import { logger } from "./logger"

async function main() {
    logger.info("App starting...")

    await createContractAPI()
    await getContractAPI()
    // await invokeContractAPI()
    // await getAssets()
}

main().catch((err) => {
    logger.error({ err }, "Fatal error")
    process.exit(1)
})
