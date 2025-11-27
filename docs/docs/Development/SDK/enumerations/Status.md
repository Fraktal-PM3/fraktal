[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / Status

# Enumeration: Status

Defined in: [src/lib/services/package/types.common.ts:42](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L42)

Current lifecycle status of a package.

## Enumeration Members

### DELIVERED

> **DELIVERED**: `"delivered"`

Defined in: [src/lib/services/package/types.common.ts:54](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L54)

Reached the drop location.

***

### FAILED

> **FAILED**: `"failed"`

Defined in: [src/lib/services/package/types.common.ts:58](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L58)

Business process failed (irrecoverable).

***

### IN\_TRANSIT

> **IN\_TRANSIT**: `"in_transit"`

Defined in: [src/lib/services/package/types.common.ts:52](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L52)

In transit between locations.

***

### PENDING

> **PENDING**: `"pending"`

Defined in: [src/lib/services/package/types.common.ts:44](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L44)

Created but not yet ready for pickup.

***

### PICKED\_UP

> **PICKED\_UP**: `"picked_up"`

Defined in: [src/lib/services/package/types.common.ts:50](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L50)

Courier has picked up the package.

***

### PROPOSED

> **PROPOSED**: `"proposed"`

Defined in: [src/lib/services/package/types.common.ts:46](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L46)

Transfer has been proposed to another organization.

***

### READY\_FOR\_PICKUP

> **READY\_FOR\_PICKUP**: `"ready_for_pickup"`

Defined in: [src/lib/services/package/types.common.ts:48](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L48)

Ready for pickup by the courier.

***

### SUCCEEDED

> **SUCCEEDED**: `"succeeded"`

Defined in: [src/lib/services/package/types.common.ts:56](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L56)

Business process completed successfully.
