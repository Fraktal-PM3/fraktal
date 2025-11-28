[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / isPackageDetailsMessage

# Function: isPackageDetailsMessage()

> **isPackageDetailsMessage**(`msg`): `msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

Defined in: [src/lib/services/package/types.common.ts:338](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L338)

Type guard to check if a message is a PackageDetails datatype message.

## Parameters

### msg

[`FireFlyDatatypeMessage`](../type-aliases/FireFlyDatatypeMessage.md)

The message to check.

## Returns

`msg is FireFlyDatatypeMessage & { value: PackageDetailsWithId }`

true if the message contains PackageDetails data.
