# isotropic-state

[![npm version](https://img.shields.io/npm/v/isotropic-state.svg)](https://www.npmjs.com/package/isotropic-state)
[![License](https://img.shields.io/npm/l/isotropic-state.svg)](https://github.com/ibi-group/isotropic-state/blob/main/LICENSE)
![](https://img.shields.io/badge/tests-passing-brightgreen.svg)
![](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

A reactive state management module built on the isotropic ecosystem, providing observable properties with validation, transformation, computed properties, and batched change notifications.

## Why Use This?

- **Reactive Properties**: Automatically publishes events when state changes
- **Computed Properties**: Automatically recalculate values when dependencies change
- **Validation & Transformation**: Built-in support for validating and transforming values
- **Batched Updates**: Optionally batch multiple changes in the same turn of the event loop
- **Flexible Configuration**: Extensive options for customizing property behavior
- **Event-Based Architecture**: Leverages isotropic-pubsub for powerful event handling
- **Read-Only Support**: Properties can be read-only or set-once
- **Force Updates**: Manually trigger change events for object mutations
- **Efficient Caching**: Computed properties are cached and only recalculate when needed

## Installation

```bash
npm install isotropic-state
```

## Basic Usage

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

// Create a component with state
const _Counter = _make(_State, {
    increment () {
        this.count += 1;

        return this;
    }
}, {
    _state: {
        count: {
            initFunction: () => 0
        }
    }
});

{
    // Create instance and listen for changes
    const counter = _Counter();

    counter.on('countChange', event => {
        console.log(`Count changed from ${event.data.oldValue} to ${event.data.newValue}`);
    });

    counter.increment(); // Count changed from 0 to 1
}
```

## State Configuration

State properties are defined in the static `_state` object. Each property can have the following configuration options:

### Basic Options

- **`changeEventName`** (String): Custom event name (default: `${propertyName}Change`)
- **`initFunction`** (Function or String): Default value function or method name
- **`internalPropertyName`** (String): Internal storage name (default: `_state_${propertyName}`)

### Validation & Transformation

- **`getFunction`** (Function or String): Transforms values when retrieving
- **`setFunction`** (Function or String): Transforms values before storing
- **`validateFunction`** (Function or String): Validates values before setting. Return `true` to allow

### Access Control

- **`readOnly`** (Boolean or 'setOnce'): Makes property read-only or settable only once
- **`readOnlySetBehavior`** ('ignore', 'throw', 'event'): How to handle writes to read-only properties (default: 'ignore')
- **`readOnlySetEventName`** (String): Event name for read-only write attempts (default: `${propertyName}ReadOnlySet`)

### Event Configuration

- **`allowPublicSubscription`** (Boolean): Allow public subscription to property events
- **`allowPublicUnsubscription`** (Boolean): Allow public unsubscription from property events

## Computed Properties

Computed properties automatically recalculate when their dependencies change. They are defined in the static `_computed` object.

### Simple Syntax

For computed properties that only need a compute function, you can use the shorthand syntax:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _Person = _make(_State, {}, {
    _computed: {
        fullName () {
            return `${this.firstName} ${this.lastName}`.trim();
        }
    },
    _state: {
        firstName: {
            initFunction: () => ''
        },
        lastName: {
            initFunction: () => ''
        }
    }
});

{
    const person = _Person({
        firstName: 'Jane',
        lastName: 'Smith'
    });

    console.log(person.fullName); // 'Jane Smith'

    person.firstName = 'John';

    console.log(person.fullName); // 'John Smith' (automatically updated)
}
```

### Computed Property Features

- **Automatic Dependency Tracking**: Dependencies are detected automatically when the getter runs
- **Efficient Caching**: Values are cached and only recomputed when dependencies change
- **Chained Dependencies**: Computed properties can depend on other computed properties
- **Change Events**: Computed properties publish change events just like state properties
- **Circular Dependency Detection**: Throws an error if circular dependencies are detected

### Computed Property Configuration

When you need more control, use the full configuration object:

- **`allowPublicSubscription`** (Boolean): Allow public subscription to change events
- **`allowPublicUnsubscription`** (Boolean): Allow public unsubscription from change events
- **`changeEventName`** (String): Custom event name (default: `${propertyName}Change`)
- **`computeFunction`** (Function or String): Function that computes the value (required)
- **`internalPropertyName`** (String): Internal storage name (default: `_computed_${propertyName}`)
- **`lazy`** (Boolean): If true, only computes on access and doesn't publish change events (default: false)

## Examples

### Validation and Transformation

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _User = _make(_State, {
    _normalizeEmail (value) {
        return value ?
            value.toLowerCase().trim() :
            '';
    },
    _validateEmail (value) {
        return !value || value.includes('@');
    }
}, {
    _state: {
        age: {
            initFunction: () => 0,
            validateFunction: value => value >= 0 && value <= 150
        },
        email: {
            initFunction: () => '',
            setFunction: '_normalizeEmail',
            validateFunction: '_validateEmail'
        }
    }
});

{
    const user = _User();

    user.email = '  JOHN@EXAMPLE.COM  '; // Stored as 'john@example.com'
    user.email = 'invalid'; // Validation fails, no change
}
```

### Read-Only Properties

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _Config = _make(_State, {}, {
    _state: {
        apiKey: {
            readOnly: 'setOnce',
            readOnlySetBehavior: 'throw'
        },
        version: {
            initFunction: () => '1.0.0',
            readOnly: true,
            readOnlySetBehavior: 'event'
        }
    }
});

{
    const config = _Config();

    config.on('versionReadOnlySet', event => {
        console.log('Attempted to set version to:', event.data.attemptedValue);
    });

    config.version = '2.0.0'; // Triggers event

    config.apiKey = 'secret-key'; // Works
    config.apiKey = 'new-key'; // Throws error
}
```

### Complex Computed Properties

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _ShoppingCart = _make(_State, {}, {
    _computed: {
        subtotal () {
            return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
        tax () {
            return this.subtotal * this.taxRate;
        },
        total () {
            return this.subtotal + this.tax;
        }
    },
    _state: {
        items: {
            initFunction: () => []
        },
        taxRate: {
            initFunction: () => 0.08
        }
    }
});

{
    const cart = _ShoppingCart();

    cart.items = [{
        price: 10,
        quantity: 2
    }, {
        price: 5,
        quantity: 3
    }];

    console.log(cart.subtotal); // 35
    console.log(cart.tax);      // 2.8
    console.log(cart.total);    // 37.8

    // Update tax rate - all dependent computed properties update
    cart.taxRate = 0.10;

    console.log(cart.tax);   // 3.5
    console.log(cart.total); // 38.5
}
```

### Lazy Computed Properties

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _ExpensiveComputation = _make(_State, {}, {
    _computed: {
        // This won't compute until accessed and won't publish change events
        analysis: {
            computeFunction () {
                // Expensive computation here
                return this.data.reduce((accumulator, item) => {
                    // Complex analysis
                    return accumulator;
                }, {});
            },
            lazy: true
        }
    },
    _state: {
        data: {
            initFunction: () => []
        }
    }
});

{
    const instance = _ExpensiveComputation();

    instance.data = getLotsOfGoodData();

    // instance.analysis hasn't been computed yet. It will compute when accessed

    // The computation will happen now
    console.log(instance.analysis);
}
```

### Batched Changes

By default, autoBatchChanges is false. Enable it to batch multiple changes:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _MyDataObject = _make(_State, {}, {
    _state: {
        x: {},
        y: {},
        z: {}
    }
});

{
    const instance = _MyDataObject({
        autoBatchChanges: true,
        x: 0,
        y: 0,
        z: 0
    });

    component.on('change', event => {
        console.log('Properties changed:', Array.from(event.data.propertyNameSet));
        console.log('Old values:', event.data.oldValue);
        console.log('New values:', event.data.newValue);
    });

    // These changes are batched
    component.x = 10;
    component.y = 20;
    component.z = 30;
    // One 'change' event for all three properties
}
```

### Force Updates

When the value of a state property is an array or an object, changes to the array items or object's properties do not trigger a change event. Change events are only published when the value of the state property itself gets changed. A change event can be forced by assigning the `forceChangeEvent` symbol to the state property. The value of the state property won't actually change, but a change event will be published.

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _MyState = _make(_State, {}, {
    _state: {
        data: {}
    }
});

{
    const state = _MyState();

    state.data = {
        items: []
    };

    // Mutate the object, this doesn't trigger a change event
    state.data.items.push('item1');

    // Force a change event
    state.data = _State.forceChangeEvent;
}
```

### Recomputing Computed Properties

Force a computed property to recalculate:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _RandomValue = _make(_State, {}, {
    _computed: {
        random () {
            return Math.random() * this.multiplier;
        }
    },
    _state: {
        multiplier: {
            initFunction: () => 1
        }
    }
});

{
    const instance = _RandomValue(), // instance.random is computed
        values = [];

    values.push(instance.random);
    values.push(instance.random); // Same as the first value because the computed property is cached

    instance.random = _State.recompute; // instance.random is computed again

    values.push(instance.random); // Different value
}
```

### Manual Batch Control

Manually control batching when autoBatchChanges is false:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _MyComponent = _make(_State, {}, {
    _state: {
        x: {},
        y: {},
        z: {}
    }
});

{
    const component = _MyComponent(); // autoBatchChanges defaults to false

    component.batchChanges(); // Manually begin a batch
    component.x = 1;
    component.y = 2;
    component.z = 3;
    // Single 'change' event for all three after the current turn of the event loop
}
```

## Event Lifecycle

Each property change goes through the standard isotropic-pubsub event lifecycle:

1. **before**: Validate or prevent the change
2. **on**: Main change handling
3. **complete**: Actually set the value (handled internally)
4. **after**: Post-change reactions

```javascript
component.before('valueChange', event => {
    if (event.data.newValue < 0) {
        event.prevent(); // Prevent negative values
    }
});

component.after('valueChange', event => {
    console.log('Value updated, saving to database...');
});
```

## Best Practices

### 1. Keep Computed Properties Pure

Computed properties should be pure functions without side effects:

```javascript
// Good
_computed: {
    displayName () {
        return `${this.firstName} ${this.lastName}`;
    }
}

// Bad - has side effects
_computed: {
    displayName () {
        console.log('Computing display name'); // Side effect!
        this.computeCount++; // Modifying state!
        return `${this.firstName} ${this.lastName}`;
    }
}
```

### 2. Use Lazy Computation for Expensive Operations

If a computed property is expensive and not always needed, make it lazy:

```javascript
_computed: {
    expensiveAnalysis: {
        computeFunction () {
            // Complex calculations here
            return performExpensiveAnalysis(this.data);
        },
        lazy: true
    }
}
```

## Debugging Guide

### Understanding Why Properties Aren't Updating

1. **Check validation**: If a validateFunction returns false, the change is silently ignored
2. **Check read-only status**: Read-only properties won't update after initialization
3. **Check if value actually changed**: Change events only get published when `newValue !== oldValue`
4. **Check event prevention**: A subscriber might be preventing the change

### Debugging Circular Dependencies

If you get a circular dependency error, trace the dependency chain:

```javascript
// This will cause a circular dependency
_computed: {
    a () {
        return this.b + 1;
    },
    b () {
        return this.a - 1; // Circular!
    }
}

// Fix by breaking the cycle
_computed: {
    a () {
        return this.baseValue + 1;
    },
    b () {
        return this.baseValue - 1;
    }
},
_state: {
    baseValue: {}
}
```

### Performance Profiling

To identify performance issues:

1. **Monitor compute frequency**: Add temporary logging to computed properties
2. **Check dependency chains**: Deep chains can cause cascading updates
3. **Use lazy computation**: For expensive computed properties that aren't always needed

### Using Browser DevTools

```javascript
// Add debug logging
const _DebugState = _make(_State, {
    _event_state_change (event) {
        console.log('State change:', event.data);

        return Reflect.apply(_State.prototype._event_state_change, this, [
            event
        ]);
    }
});
```

## Handling Validation Errors

By default, `isotropic-state` silently ignores values that fail validation. If you prefer different behavior, you can implement it in your validateFunction:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _StrictState = _make(_State, {
    _validateEmail (value) {
        const isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (!isValid) {
            // Option 1: Publish a validation failure event
            this._publish('emailValidationFailed', {
                attemptedValue: value,
                reason: 'Invalid email format'
            });

            // Option 2: Throw an error
            throw _Error({
                details: {
                    value
                },
                message: 'Invalid email value'
            });
        }

        return isValid;
    }
}, {
    _state: {
        email: {
            validateFunction: '_validateEmail'
        }
    }
});

{
    const instance = _StrictState();

    instance.on('emailValidationFailed', event => {
        console.error('Email validation failed:', event.data.reason);
    });

    instance.email = 'invalid-email'; // Triggers validation failure event
}
```

## Advanced Patterns

### State Inheritance

Child classes inherit and can extend parent state and computed properties:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _Animal = _make(_State, {}, {
        _computed: {
            description () {
                return `${this.name} the ${this.species}`;
            }
        },
        _state: {
            name: {
                initFunction: () => ''
            },
            species: {
                initFunction: () => ''
            }
        }
    }),
    _Dog = _make(_Animal, {}, {
        _computed: {
            detailedDescription () {
                return `${this.description} (${this.breed})`;
            }
        },
        _state: {
            breed: {
                initFunction: () => ''
            },
            goodBoy: {
                initFunction: () => true,
                readOnly: true
            },
            species: { // Override parent
                initFunction: () => 'Dog'
            }
        }
    });

{
    const dog = _Dog({
        breed: 'Golden Retriever',
        name: 'Buddy'
    });

    console.log(dog.description); // 'Buddy the Dog'
    console.log(dog.detailedDescription); // 'Buddy the Dog (Golden Retriever)'
}
```

### Overriding Change Event Handlers

Child classes can override the change event complete methods to add custom behavior:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _TrackedState = _make(_State, {
    // Override the computed property change handler
    _event_computed_change (event) {
        console.log(`Computed property changed: ${event.data.propertyName}`);

        // Call parent implementation
        return Reflect.apply(_State.prototype._event_computed_change, this, [
            event
        ]);
    },
    // Override a specific state property change handler
    _event_state_userIdChange (event) {
        console.log(`User ID changed from ${event.data.oldValue} to ${event.data.newValue}`);

        // Custom logic for userId changes
        if (event.data.newValue) {
            this.loadUserData(event.data.newValue);
        }

        // Call the generic state change handler
        return Reflect.apply(_State.prototype._event_state_change, this, [
            event
        ]);
    },
    loadUserData (userId) {
        // Implementation
    }
}, {
    _state: {
        userId: {}
    }
});
```

### Type Safety Enhancement

While `isotropic-state` doesn't include built-in type checking, you can easily add it as a child class:

```javascript
import _make from 'isotropic-make';
import _State from 'isotropic-state';

const _TypedState = _make(_State, {
        _validateType (value, type) {
            switch (type) {
                case 'array':
                    return Array.isArray(value);
                case 'boolean':
                    return typeof value === 'boolean';
                case 'function':
                    return typeof value === 'function';
                case 'number':
                    return typeof value === 'number' && !isNaN(value);
                case 'object':
                    return value !== null && typeof value === 'object' && !Array.isArray(value);
                case 'string':
                    return typeof value === 'string';
                default:
                    if (typeof type === 'function') {
                        return value instanceof type;
                    }

                    return true;
            }
        }
    }, {
        _init (...args) {
            if (Object.hasOwn(this, '_state')) {
                Reflect.ownKeys(this._state).forEach(propertyName => {
                    const config = this._state[propertyName];

                    if (config.type) {
                        const validateFunction = config.validateFunction;

                        config.validateFunction = function (value) {
                            // First check type
                            if (!this._validateType(value, config.type)) {
                                return false;
                            }

                            // Then run original validation if exists
                            if (validateFunction) {
                                return typeof validateFunction === 'function' ?
                                    validateFunction.call(this, value) :
                                    this[validateFunction](value);
                            }

                            return true;
                        };
                    }
                });
            }

            return Reflect.apply(_State._init, this, args);
        }
    }),
    _User = _make(_TypedState, {}, {
        _state: {
            age: {
                type: 'number',
                validateFunction: value => value >= 0 && value <= 150
            },
            email: {
                type: 'string',
                validateFunction: value => !value || value.includes('@')
            },
            isActive: {
                type: 'boolean',
                initFunction: () => true
            },
            metadata: {
                type: 'object',
                initFunction: () => ({})
            },
            tags: {
                type: 'array',
                initFunction: () => []
            }
        }
    });

{
    const user = _User();

    user.age = "30"; // Type error: age must be number
    user.age = 30; // Works

    user.tags = {}; // Type error: tags must be array
    user.tags = [
        'admin',
        'user'
    ]; // Works
}
```

## API Reference

### Constructor Options

- **`autoBatchChanges`** (Boolean): Enable automatic change batching (default: false)
- **State property values**: Initial values for state properties

### Instance Methods

- **`batchChanges()`**: Start a new batch of changes

### Static Properties

- **`forceChangeEvent`** (Symbol): Force a change event for the current value
- **`recompute`** (Symbol): Force recomputation of a computed property

### State Configuration Reference

```javascript
{
    _state: {
        propertyName: {
            allowPublicSubscription: Boolean,      // Event subscription control
            allowPublicUnsubscription: Boolean,    // Event unsubscription control
            changeEventCompleteMethodName: String, // Custom method name
            changeEventName: String,               // Custom event name
            getFunction: Function | String,        // Transform on get
            initFunction: Function | String,       // Default value
            internalPropertyName: String,          // Internal property name
            readOnly: Boolean | 'setOnce',         // Access control
            readOnlySetBehavior: String,           // 'ignore' | 'throw' | 'event'
            readOnlySetEventName: String,          // Event name for violations
            setFunction: Function | String,        // Transform on set
            validateFunction: Function | String    // Validation function
        }
    }
}
```

### Computed Configuration Reference

```javascript
{
    _computed: {
        // Shorthand syntax
        propertyName () {
            return computedValue;
        },

        // Full configuration syntax
        propertyName: {
            allowPublicSubscription: Boolean,      // Event subscription control
            allowPublicUnsubscription: Boolean,    // Event unsubscription control
            changeEventCleanupMethodName: String,  // Custom method name
            changeEventCompleteMethodName: String, // Custom method name
            changeEventName: String,               // Custom event name
            computeFunction: Function | String,    // Compute function (required)
            internalPropertyName: String,          // Internal property name
            lazy: Boolean                          // Lazy evaluation (default: false)
        }
    }
}
```

## Integration with Other Isotropic Modules

`isotropic-state` integrates seamlessly with:

- **isotropic-initializable**: Provides initialization lifecycle
- **isotropic-later**: Handles asynchronous batching
- **isotropic-make**: Creates the constructor functions
- **isotropic-property-chainer**: Enables state and computed property inheritance
- **isotropic-pubsub**: Powers the event system
