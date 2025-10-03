import { broadcastMessage } from "./services/firefly"
import { logger } from "./logger"

async function main() {
    logger.info("App starting...")

    await broadcastMessage("hello King Mikolaj")
}

main().catch((err) => {
    logger.error({ err }, "Fatal error")
    process.exit(1)
})
