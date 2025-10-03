import FireFly from "@hyperledger/firefly-sdk"
import { logger } from "../logger"

const ff = new FireFly({
    host: process.env["FIREFLY_URL"] || "http://localhost:5000",
    namespace: process.env["FIREFLY_NAMESPACE"] || "default",
})

export async function broadcastMessage(msg: string) {
    try {
        const res = await ff.sendBroadcast({
            data: [{ value: { msg } }],
        })
        logger.info({ res }, "Broadcast sent")
        return res
    } catch (err) {
        logger.error({ err }, "Broadcast failed")
        throw err
    }
}
