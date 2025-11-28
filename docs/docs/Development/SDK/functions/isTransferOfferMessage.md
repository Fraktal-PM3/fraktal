[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isTransferOfferMessage

# Function: isTransferOfferMessage()

> **isTransferOfferMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

Defined in: [src/lib/services/package/types.common.ts:381](https://github.com/Fraktal-PM3/fraktal-lib/blob/daeada21355d102e10396752f2a80e945abf514e/src/lib/services/package/types.common.ts#L381)

Type guard to check if a message is a TransferOffer datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

true if the message contains TransferOffer data.
