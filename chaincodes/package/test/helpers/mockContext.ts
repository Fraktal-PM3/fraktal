type Bytes = Buffer | Uint8Array

export class MockStub {
    private state = new Map<string, Buffer>()
    private pdc = new Map<string, Map<string, Buffer>>() // collection -> (key -> value)
    private transient = new Map<string, Uint8Array>()
    public events: Array<{ name: string; payload?: Buffer }> = []

    //  world state
    getState = (key: string): Promise<Buffer> =>
        new Promise((resolve, reject) => {
            try {
                resolve(this.state.get(key) ?? Buffer.from(""))
            } catch (error) {
                reject(error as Error)
            }
        })

    putState = (key: string, value: Bytes): Promise<void> =>
        new Promise((resolve, reject) => {
            try {
                this.state.set(
                    key,
                    Buffer.isBuffer(value) ? value : Buffer.from(value)
                )
                resolve()
            } catch (error) {
                reject(error as Error)
            }
        })

    deleteState = (key: string): Promise<void> =>
        new Promise((resolve, reject) => {
            try {
                this.state.delete(key)
                resolve()
            } catch (error) {
                reject(error as Error)
            }
        })

    //private data
    putPrivateData = (
        collection: string,
        key: string,
        value: Bytes
    ): Promise<void> =>
        new Promise((resolve, reject) => {
            if (!this.pdc.has(collection)) this.pdc.set(collection, new Map())
            try {
                const collectionMap = this.pdc.get(collection)
                if (!collectionMap) throw new Error("Collection map not found")
                collectionMap.set(
                    key,
                    Buffer.isBuffer(value) ? value : Buffer.from(value)
                )
                resolve()
            } catch (error) {
                reject(error as Error)
            }
        })

    getPrivateData = (collection: string, key: string): Promise<Buffer> =>
        new Promise((resolve, reject) => {
            try {
                const col = this.pdc.get(collection)
                resolve(col?.get(key) ?? Buffer.from(""))
            } catch (error) {
                reject(error as Error)
            }
        })

    getTransient = (): Map<string, Uint8Array> => {
        return this.transient
    }

    // Convenience for tests: set transient from JS values/strings/Buffers
    setTransient = (obj: Record<string, any>): Promise<void> =>
        new Promise((resolve, reject) => {
            try {
                this.transient = new Map(
                    Object.entries(obj).map(([k, v]) => [
                        k,
                        Buffer.isBuffer(v)
                            ? v
                            : Buffer.from(
                                  typeof v === "string" ? v : JSON.stringify(v)
                              ),
                    ])
                )
                resolve()
            } catch (error) {
                reject(error as Error)
            }
        })

    // events / tx
    setEvent = (name: string, payload?: Bytes): Promise<void> =>
        new Promise((resolve, reject) => {
            try {
                this.events.push({
                    name,
                    payload: payload
                        ? Buffer.isBuffer(payload)
                            ? payload
                            : Buffer.from(payload)
                        : undefined,
                })
                resolve()
            } catch (error) {
                reject(error as Error)
            }
        })
}

export class MockClientIdentity {
    constructor(private mspId = "Org1MSP") {}
    getMSPID(): string {
        return this.mspId
    }
    // helpers for tests:
    setMSP(id: string) {
        this.mspId = id
    }
}

export class MockContext {
    public stub: MockStub
    public clientIdentity: MockClientIdentity

    constructor(opts?: {
        mspId?: string
        attrs?: Record<string, string>
        transient?: Record<string, any>
    }) {
        this.stub = new MockStub()
        this.clientIdentity = new MockClientIdentity(opts?.mspId || "Org1MSP")
        if (opts?.transient) {
            this.stub.setTransient(opts.transient)
        }
    }
}
