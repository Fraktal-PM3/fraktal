[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isTransferOfferMessage

# Function: isTransferOfferMessage()

> **isTransferOfferMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

Defined in: [src/lib/services/package/types.common.ts:394](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L394)

Type guard to check if a message is a TransferOffer datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

true if the message contains TransferOffer data.
