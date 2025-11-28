[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isTransferOfferMessage

# Function: isTransferOfferMessage()

> **isTransferOfferMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

Defined in: [src/lib/services/package/types.common.ts:381](https://github.com/Fraktal-PM3/fraktal-lib/blob/8e64bffca5679abbec34098ceb926c8787473b8b/src/lib/services/package/types.common.ts#L381)

Type guard to check if a message is a TransferOffer datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: TransferOfferData }`

true if the message contains TransferOffer data.
