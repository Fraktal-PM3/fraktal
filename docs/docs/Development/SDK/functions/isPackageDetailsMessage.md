[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isPackageDetailsMessage

# Function: isPackageDetailsMessage()

> **isPackageDetailsMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

Defined in: [src/lib/services/package/types.common.ts:338](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L338)

Type guard to check if a message is a PackageDetails datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

true if the message contains PackageDetails data.
