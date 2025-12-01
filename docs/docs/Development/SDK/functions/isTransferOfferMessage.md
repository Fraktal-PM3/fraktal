[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isTransferOfferMessage

# Function: isTransferOfferMessage()

> **isTransferOfferMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

Defined in: [src/lib/services/package/types.common.ts:388](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L388)

Type guard to check if a message is a TransferOffer datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

true if the message contains TransferOffer data.
