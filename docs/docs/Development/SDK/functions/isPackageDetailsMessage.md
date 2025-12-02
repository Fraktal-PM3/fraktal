[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isPackageDetailsMessage

# Function: isPackageDetailsMessage()

> **isPackageDetailsMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

Defined in: [src/lib/services/package/types.common.ts:348](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L348)

Type guard to check if a message is a PackageDetails datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

true if the message contains PackageDetails data.
