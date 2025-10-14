import { logger } from "./logger"
import {
    broadcastPackage,
    createDatatype,
    getDatatype,
    getLocalPackage,
    uploadPackage,
} from "./services/firefly"
import { generatePackageSchema } from "./services/schemaGeneration"
import { startServer } from "./server"
import { PrivatePackage, Urgency } from "./types/package"
import { v4 as uuidv4 } from "uuid"

async function main() {
    logger.info("App starting...")

    // Start the schema server
    startServer()

    // Generate schema if it doesn't exist
    const schema = await generatePackageSchema()

    await createContractAPI()
    // await getContractAPI()
    // await invokeContractAPI()
    // await getAssets()
    // await broadcastMessage("Hello from PM3!")

    await createDatatype("PrivatePackage", schema, {
        version: "1.0.2",
    })
    logger.info("Datatype created")

    const res = await getDatatype("PrivatePackage", "1.0.2")

    logger.info({ res }, "Datatype fetched")

    const uuid = uuidv4()

    const samplePrivatePackage: PrivatePackage = {
        id: uuid,
        pickupLocation: {
            name: "Luleå University of Technology",
            address: "971 87 Luleå, Sweden",
            lat: 65.618,
            lng: 22.138,
        },
        dropLocation: {
            name: "Stockholm Central Station",
            address: "Central Plan 15, 111 20 Stockholm, Sweden",
            lat: 59.33,
            lng: 18.058,
        },
        address: "Recipient Address: Kungsgatan 10, 111 43 Stockholm",
        size: {
            width: 30,
            height: 20,
            depth: 15,
        },
        weightKg: 2.5,
        urgency: Urgency.MEDIUM,
    }

    const uploadPackageRes = await uploadPackage(samplePrivatePackage, "1.0.2")
    logger.info({ uploadPackageRes }, "Package uploaded")

    const packageGotten: PrivatePackage = await getLocalPackage(
        uploadPackageRes.id,
    )

    const msgRes = await broadcastPackage(
        packageGotten,
        { name: "PrivatePackage", version: "1.0.2" },
        [`package_${uuid}`],
    )
    logger.info({ msgRes }, "Message sent")
}

main().catch((err) => {
    logger.error({ err }, "Fatal error")
    process.exit(1)
})
