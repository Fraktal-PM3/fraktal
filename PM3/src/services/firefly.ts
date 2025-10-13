import FireFly from "@hyperledger/firefly-sdk"
import { logger } from "../logger"

const ff = new FireFly({
    host: process.env["FIREFLY_URL"] || "http://localhost:8000",
    namespace: process.env["FIREFLY_NAMESPACE"] || "default",
})

export const createContractAPI = async () => {
    const res = await ff.createContractAPI({
        interface: { id: "ec09ab27-c7b8-42c2-989a-24191b9ab956" },
        location: {channel: "pm3", chaincode: "pm3package"},
        name: "pm3package",
    }, { publish: true })
    logger.info({ res }, "Fetched contract APIs")
    return res
}

export const getContractAPI = async () => {
    const res = await ff.getContractAPI("pm3package")
    
    logger.info({ res }, "Fetched contract APIs")

    return res
}

export const invokeContractAPI = async () => {
    const res = await ff.invokeContractAPI("asset_transfer", "CreateAsset", {
        input: {
          color: "black",
          id: "asset1",
          owner: "Tom",
          size: "10",
          value: "1000"
        },
    })

    logger.info({ res }, "Invoked contract API")
    return res
}

export const getAssets = async () => {
    const res = await ff.queryContractAPI("asset_transfer", "GetAllAssets", {
        input: {},
    })

    logger.info({ res }, "Fetched all assets")
    return res
}

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
