import FireFly from "@hyperledger/firefly-sdk"
import { logger } from "../logger"

type JsonSchema = {
    $schema?: string
    $id?: string
    title?: string
    [key: string]: unknown
}

type CreateDatatypeOptions = {
    version?: string
    publish?: boolean
}

const ff = new FireFly({
    host: process.env["FIREFLY_URL"] || "http://localhost:8000",
    namespace: process.env["FIREFLY_NAMESPACE"] || "default",
})

export const createContractAPI = async () => {
    const res = await ff.createContractAPI(
        {
            interface: { id: "e4469a90-2936-4372-b6d6-379aa2d95c0b" },
            location: { channel: "pm3", chaincode: "asset_transfer" },
            name: "asset_transfer",
        },
        { publish: true },
    )
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
            value: "1000",
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

export async function createDatatype(
    name: string,
    schema: JsonSchema,
    options: CreateDatatypeOptions = {},
) {
    const namespace = process.env["FIREFLY_NAMESPACE"] || "default"
    const version = options.version ?? "1.0.0"
    const publish = options.publish ?? true

    const value: JsonSchema = { ...schema }

    if (!value.$schema) {
        value.$schema = "https://json-schema.org/draft/2020-12/schema"
    }

    if (!value.$id) {
        value.$id = `ff://${namespace}/${name}/${version}`
    }

    if (!value.title) {
        value.title = name
    }

    const res = await ff.createDatatype(
        {
            name,
            validator: "json",
            value,
            version,
        },
        { publish },
    )
    logger.info({ res }, "Created datatype")
    return res
}

export async function getDatatype(name: string, version: string) {
    return await ff.getDatatype(name, version)
}