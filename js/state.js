import _Dispatcher from 'isotropic-pubsub/lib/dispatcher.js';
import _Error from 'isotropic-error';
import _forIn from 'isotropic-for-in';
import _Initializable from 'isotropic-initializable';
import _later from 'isotropic-later';
import _make from 'isotropic-make';

const _callCallbackFunction = _Dispatcher.prototype._callCallbackFunction;

export default _make(_Initializable, {
    batchChanges () {
        if (!this._currentBatch) {
            this._batchChanges();
        }
    },
    _batchChanges () {
        this._currentBatch = {
            newValue: {},
            oldValue: {},
            propertyNameSet: new Set()
        };

        _later.asap(() => {
            if (this._currentBatch?.propertyNameSet.size && !this._destroyed) {
                const currentBatch = this._currentBatch;

                this._currentBatch = null;
                this._publish('change', currentBatch);
            }
        });
    },
    _event_computed_change ({
        data: {
            newValue,
            oldValue,
            propertyName
        }
    }) {
        this[this.constructor._internalPropertyNameByPropertyName[propertyName]] = newValue;
        this._computingPropertyNameSet.delete(propertyName);
        this._currentComputedPropertyName = null;
        this._recomputePropertyNameSet.delete(propertyName);
        this._registerChange({
            newValue,
            oldValue,
            propertyName
        });
    },
    _event_computed_changeCleanup (event) {
        if (!event.completed) {
            this._computingPropertyNameSet.delete(event.data.propertyName);
            this._currentComputedPropertyName = null;
        }
    },
    _event_state_change ({
        data: {
            newValue,
            oldValue,
            propertyName
        }
    }) {
        this[this.constructor._internalPropertyNameByPropertyName[propertyName]] = newValue;
        this._registerChange({
            newValue,
            oldValue,
            propertyName
        });
    },
    _initialize (config = {}) {
        this._autoBatchChanges = config.autoBatchChanges;
        this._computedDependencySetByPropertyName = {};
        this._computedDependentSetByPropertyName = {};
        this._computingPropertyNameSet = new Set();
        this._currentBatch = {
            newValue: {},
            oldValue: {},
            propertyNameSet: new Set()
        };
        this._currentComputedPropertyName = null;
        this._recomputePropertyNameSet = new Set();

        let initializePromise = null;

        for (const propertyName of this.constructor._statePropertyNameSet) {
            const propertyConfig = this.constructor._state[propertyName];

            let value;

            if (Object.hasOwn(config, propertyName)) {
                value = config[propertyName];
            } else if (propertyConfig.initFunction) {
                value = _callCallbackFunction(propertyConfig.initFunction, this);
            }

            if (typeof value?.then === 'function') {
                this[propertyConfig.internalPropertyName] = void null;

                value = value.then(value => {
                    this[propertyConfig.internalPropertyName] = value;
                });

                if (initializePromise) {
                    initializePromise = initializePromise.then(() => value);
                } else {
                    initializePromise = value;
                }
            } else {
                this[propertyConfig.internalPropertyName] = value;
            }

            if (propertyConfig.readOnly === 'setOnce') {
                this._onceAfter(propertyConfig.changeEventName, () => {
                    this.constructor._defineStateProperty({
                        config: {
                            ...propertyConfig,
                            readOnly: true
                        },
                        host: this,
                        propertyName
                    });
                });
            }
        }

        if (initializePromise) {
            return initializePromise.then(() => {
                this._initializeComputedProperties();
                this._currentBatch = null;
            });
        }

        this._initializeComputedProperties();
        this._currentBatch = null;
    },
    _initializeComputedProperties () {
        for (const propertyName of this.constructor._computedPropertyNameSet) {
            const {
                allowPublicSubscription,
                allowPublicUnsubscription,
                changeEventCleanupMethodName,
                changeEventCompleteMethodName,
                changeEventName,
                computeFunction,
                internalPropertyName
            } = this.constructor._computed[propertyName];

            this[internalPropertyName] = void null;
            this._recomputePropertyNameSet.add(propertyName);

            if (this.constructor._eagerComputedPropertyNameSet.has(propertyName)) {
                Object.defineProperty(this, propertyName, {
                    configurable: true,
                    enumerable: true,
                    get () {
                        if (this._computingPropertyNameSet.has(propertyName)) {
                            throw _Error({
                                details: {
                                    computingPropertyNames: Array.from(this._computingPropertyNameSet),
                                    propertyName
                                },
                                message: 'Circular dependency in computed property'
                            });
                        }

                        this._trackPropertyAccess({
                            propertyName
                        });

                        if (this._recomputePropertyNameSet.has(propertyName)) {
                            this._computingPropertyNameSet.add(propertyName);

                            const computedDependencySet = this._computedDependencySetByPropertyName[propertyName];

                            if (computedDependencySet) {
                                for (const dependencyPropertyName of computedDependencySet) {
                                    const computedDependentSet = this._computedDependentSetByPropertyName[dependencyPropertyName];

                                    if (computedDependentSet) {
                                        computedDependentSet.delete(propertyName);
                                    }
                                }
                            }

                            this._computedDependencySetByPropertyName[propertyName] = new Set();
                            this._currentComputedPropertyName = propertyName;

                            try {
                                const newValue = _callCallbackFunction(computeFunction, this),
                                    oldValue = this[internalPropertyName];

                                if (newValue === this.constructor.forceChangeEvent) {
                                    this._publish(changeEventName, {
                                        newValue: oldValue,
                                        oldValue,
                                        propertyName
                                    });
                                } else if (newValue === oldValue) {
                                    this._computingPropertyNameSet.delete(propertyName);
                                    this._currentComputedPropertyName = null;
                                    this._recomputePropertyNameSet.delete(propertyName);
                                } else {
                                    this._publish(changeEventName, {
                                        newValue,
                                        oldValue,
                                        propertyName
                                    });
                                }
                            } catch (error) {
                                this._computingPropertyNameSet.delete(propertyName);
                                this._currentComputedPropertyName = null;

                                throw _Error({
                                    details: {
                                        propertyName
                                    },
                                    error,
                                    message: 'Error computing property'
                                });
                            }
                        }

                        return this[internalPropertyName];
                    },
                    set (value) {
                        if (value === this.constructor.recompute) {
                            this._recomputeProperty({
                                propertyName
                            });
                        } else {
                            throw _Error({
                                details: {
                                    attemptedValue: value,
                                    propertyName
                                },
                                message: 'Attempting to set computed property'
                            });
                        }
                    }
                });

                this._defineDispatcher({
                    config: {
                        allowPublicSubscription,
                        allowPublicUnsubscription,
                        completeFunction: changeEventCompleteMethodName,
                        preventFunction: changeEventCleanupMethodName,
                        stopDispatchFunction: changeEventCleanupMethodName,
                        stopEventFunction: changeEventCleanupMethodName
                    },
                    eventName: changeEventName
                });
            } else {
                Object.defineProperty(this, propertyName, {
                    configurable: true,
                    enumerable: true,
                    get () {
                        if (this._computingPropertyNameSet.has(propertyName)) {
                            throw _Error({
                                details: {
                                    computingPropertyNames: Array.from(this._computingPropertyNameSet),
                                    propertyName
                                },
                                message: 'Circular dependency in computed property'
                            });
                        }

                        this._trackPropertyAccess({
                            propertyName
                        });

                        if (this._recomputePropertyNameSet.has(propertyName)) {
                            this._computingPropertyNameSet.add(propertyName);

                            const computedDependencySet = this._computedDependencySetByPropertyName[propertyName];

                            if (computedDependencySet) {
                                for (const dependencyPropertyName of computedDependencySet) {
                                    const computedDependentSet = this._computedDependentSetByPropertyName[dependencyPropertyName];

                                    if (computedDependentSet) {
                                        computedDependentSet.delete(propertyName);
                                    }
                                }
                            }

                            this._computedDependencySetByPropertyName[propertyName] = new Set();
                            this._currentComputedPropertyName = propertyName;

                            try {
                                const newValue = _callCallbackFunction(computeFunction, this),
                                    oldValue = this[internalPropertyName];

                                this._recomputePropertyNameSet.delete(propertyName);

                                if (newValue !== this.constructor.forceChangeEvent && newValue !== oldValue) {
                                    this[internalPropertyName] = newValue;
                                }

                                this._recomputeDependentProperties({
                                    propertyName
                                });
                            } finally {
                                this._computingPropertyNameSet.delete(propertyName);
                                this._currentComputedPropertyName = null;
                            }
                        }

                        return this[internalPropertyName];
                    },
                    set (value) {
                        if (value === this.constructor.recompute) {
                            this._recomputeProperty({
                                propertyName
                            });
                        } else {
                            throw _Error({
                                details: {
                                    attemptedValue: value,
                                    propertyName
                                },
                                message: 'Attempting to set computed property'
                            });
                        }
                    }
                });
            }
        }

        for (const propertyName of this.constructor._eagerComputedPropertyNameSet) {
            this[propertyName];
        }
    },
    _recomputeDependentProperties ({
        propertyName
    }) {
        const computedDependentSet = this._computedDependentSetByPropertyName[propertyName];

        if (computedDependentSet) {
            // Copy the set here. It gets mutated during iteration. Iterating the set directly leads to infinite loops.
            for (const dependentPropertyName of Array.from(computedDependentSet)) {
                this._recomputeProperty({
                    propertyName: dependentPropertyName
                });
            }
        }
    },
    _recomputeProperty ({
        propertyName
    }) {
        if (!this._recomputePropertyNameSet.has(propertyName)) {
            this._recomputePropertyNameSet.add(propertyName);

            if (this.constructor._eagerComputedPropertyNameSet.has(propertyName)) {
                this[propertyName];
            } else {
                this._recomputeDependentProperties({
                    propertyName
                });
            }
        }
    },
    _registerChange ({
        newValue,
        oldValue,
        propertyName
    }) {
        if (!this._currentBatch) {
            if (this._autoBatchChanges) {
                this._batchChanges();
            } else {
                this._recomputeDependentProperties({
                    propertyName
                });

                return;
            }
        }

        this._currentBatch.newValue[propertyName] = newValue;

        if (!this._currentBatch.propertyNameSet.has(propertyName)) {
            this._currentBatch.oldValue[propertyName] = oldValue;
            this._currentBatch.propertyNameSet.add(propertyName);
        }

        this._recomputeDependentProperties({
            propertyName
        });
    },
    _trackPropertyAccess ({
        propertyName
    }) {
        if (this._currentComputedPropertyName) {
            this._computedDependencySetByPropertyName[this._currentComputedPropertyName].add(propertyName);

            let computedDependentSet = this._computedDependentSetByPropertyName[propertyName];

            if (!computedDependentSet) {
                computedDependentSet = new Set();
                this._computedDependentSetByPropertyName[propertyName] = computedDependentSet;
            }

            computedDependentSet.add(this._currentComputedPropertyName);
        }
    }
}, {
    forceChangeEvent: Symbol('forceChangeEvent'),
    recompute: Symbol('recompute'),
    _computed: Object.create(null),
    _defineStateProperty ({
        config: {
            allowPublicSubscription,
            allowPublicUnsubscription,
            changeEventCompleteMethodName,
            changeEventName,
            getFunction,
            internalPropertyName,
            readOnly,
            readOnlySetBehavior,
            readOnlySetEventName,
            setFunction,
            validateFunction
        },
        host,
        propertyName
    }) {
        let set;

        if (readOnly === true) {
            switch (readOnlySetBehavior) {
                case 'event':
                    set = function (value) {
                        this._publish(readOnlySetEventName, {
                            attemptedValue: value,
                            oldValue: this[internalPropertyName],
                            propertyName
                        });
                    };

                    break;
                case 'ignore':
                    set = () => {
                        // do nothing
                    };

                    break;
                case 'throw':
                    set = value => {
                        throw _Error({
                            details: {
                                attemptedValue: value,
                                propertyName
                            },
                            message: 'Attempting to set readOnly property'
                        });
                    };

                    break;
                default:
                    throw _Error({
                        details: {
                            propertyName,
                            readOnlySetBehavior
                        },
                        message: 'Invalid readOnlySetBehavior'
                    });
            }
        } else {
            if (!host[changeEventCompleteMethodName]) {
                host[changeEventCompleteMethodName] = host._event_state_change;
            }

            this._defineDispatcher({
                config: {
                    allowPublicSubscription,
                    allowPublicUnsubscription,
                    completeFunction: changeEventCompleteMethodName,
                    completeOnce: readOnly === 'setOnce'
                },
                eventName: changeEventName
            });

            if (validateFunction) {
                if (setFunction) {
                    set = function (newValue) {
                        const oldValue = this[internalPropertyName];

                        if (newValue === this.constructor.forceChangeEvent) {
                            this._publish(changeEventName, {
                                newValue: oldValue,
                                oldValue,
                                propertyName
                            });
                        } else if (_callCallbackFunction(validateFunction, this, newValue)) {
                            newValue = _callCallbackFunction(setFunction, this, newValue);

                            if (newValue === this.constructor.forceChangeEvent) {
                                this._publish(changeEventName, {
                                    newValue: oldValue,
                                    oldValue,
                                    propertyName
                                });
                            } else if (newValue !== oldValue) {
                                this._publish(changeEventName, {
                                    newValue,
                                    oldValue,
                                    propertyName
                                });
                            }
                        }
                    };
                } else {
                    set = function (newValue) {
                        const oldValue = this[internalPropertyName];

                        if (newValue === this.constructor.forceChangeEvent) {
                            this._publish(changeEventName, {
                                newValue: oldValue,
                                oldValue,
                                propertyName
                            });
                        } else if (newValue !== oldValue && _callCallbackFunction(validateFunction, this, newValue)) {
                            this._publish(changeEventName, {
                                newValue,
                                oldValue,
                                propertyName
                            });
                        }
                    };
                }
            } else if (setFunction) {
                set = function (newValue) {
                    const oldValue = this[internalPropertyName];

                    if (newValue === this.constructor.forceChangeEvent) {
                        this._publish(changeEventName, {
                            newValue: oldValue,
                            oldValue,
                            propertyName
                        });
                    } else {
                        newValue = _callCallbackFunction(setFunction, this, newValue);

                        if (newValue === this.constructor.forceChangeEvent) {
                            this._publish(changeEventName, {
                                newValue: oldValue,
                                oldValue,
                                propertyName
                            });
                        } else if (newValue !== oldValue) {
                            this._publish(changeEventName, {
                                newValue,
                                oldValue,
                                propertyName
                            });
                        }
                    }
                };
            } else {
                set = function (newValue) {
                    const oldValue = this[internalPropertyName];

                    if (newValue === this.constructor.forceChangeEvent) {
                        this._publish(changeEventName, {
                            newValue: oldValue,
                            oldValue,
                            propertyName
                        });
                    } else if (newValue !== oldValue) {
                        this._publish(changeEventName, {
                            newValue,
                            oldValue,
                            propertyName
                        });
                    }
                };
            }
        }

        Object.defineProperty(host, propertyName, {
            configurable: true,
            enumerable: true,
            get: getFunction ?
                function () {
                    this._trackPropertyAccess({
                        propertyName
                    });

                    return _callCallbackFunction(getFunction, this, this[internalPropertyName]);
                } :
                function () {
                    this._trackPropertyAccess({
                        propertyName
                    });

                    return this[internalPropertyName];
                },
            set
        });
    },
    _eventMethodNamePrefix: '_event',
    _init (...args) {
        Reflect.apply(_Initializable._init, this, args);

        this._computedPropertyNameSet = new Set();
        this._eagerComputedPropertyNameSet = new Set();
        this._internalPropertyNameByPropertyName = {};
        this._statePropertyNameSet = new Set();

        if (Object.hasOwn(this, '_computed')) {
            Reflect.ownKeys(this._computed).forEach(propertyName => {
                let config = this._computed[propertyName];

                switch (typeof config) {
                    case 'function':
                    case 'string':
                    case 'symbol':
                        config = {
                            computeFunction: config
                        };
                        this._computed[propertyName] = config;

                        break;
                }

                if (!Object.hasOwn(config, 'changeEventName')) {
                    config.changeEventName = `${propertyName}Change`;
                }

                if (!Object.hasOwn(config, 'changeEventCompleteMethodName')) {
                    config.changeEventCompleteMethodName = `${this._eventMethodNamePrefix}${this._internalComputedPropertyNamePrefix}${config.changeEventName}`;
                }

                if (!Object.hasOwn(config, 'changeEventCleanupMethodName')) {
                    config.changeEventCleanupMethodName = `${config.changeEventCompleteMethodName}Cleanup`;
                }

                if (!Object.hasOwn(config, 'internalPropertyName')) {
                    config.internalPropertyName = `${this._internalComputedPropertyNamePrefix}${propertyName}`;
                }

                if (!this.prototype[config.changeEventCleanupMethodName]) {
                    this.prototype[config.changeEventCleanupMethodName] = this.prototype._event_computed_changeCleanup;
                }

                if (!this.prototype[config.changeEventCompleteMethodName]) {
                    this.prototype[config.changeEventCompleteMethodName] = this.prototype._event_computed_change;
                }
            });
        }

        if (Object.hasOwn(this, '_state')) {
            Reflect.ownKeys(this._state).forEach(propertyName => {
                const config = this._state[propertyName];

                if (!Object.hasOwn(config, 'changeEventName')) {
                    config.changeEventName = `${propertyName}Change`;
                }

                if (!Object.hasOwn(config, 'changeEventCompleteMethodName')) {
                    config.changeEventCompleteMethodName = `${this._eventMethodNamePrefix}${this._internalStatePropertyNamePrefix}${config.changeEventName}`;
                }

                if (!Object.hasOwn(config, 'internalPropertyName')) {
                    config.internalPropertyName = `${this._internalStatePropertyNamePrefix}${propertyName}`;
                }

                if (config.readOnly) {
                    if (!Object.hasOwn(config, 'readOnlySetBehavior')) {
                        config.readOnlySetBehavior = 'ignore';
                    }

                    if (config.readOnlySetBehavior === 'event' && !Object.hasOwn(config, 'readOnlySetEventName')) {
                        config.readOnlySetEventName = `${propertyName}ReadOnlySet`;
                    }
                }

                this._defineStateProperty({
                    config,
                    host: this.prototype,
                    propertyName
                });
            });
        }

        _forIn(this._computed, (config, propertyName) => {
            this._computedPropertyNameSet.add(propertyName);
            this._internalPropertyNameByPropertyName[propertyName] = config.internalPropertyName;

            if (!config.lazy) {
                this._eagerComputedPropertyNameSet.add(propertyName);
            }
        });

        _forIn(this._state, (config, propertyName) => {
            this._statePropertyNameSet.add(propertyName);
            this._internalPropertyNameByPropertyName[propertyName] = config.internalPropertyName;
        });

        return this;
    },
    _internalComputedPropertyNamePrefix: '_computed_',
    _internalStatePropertyNamePrefix: '_state_',
    _propertyChains: [
        '_computed',
        '_state'
    ],
    _pubsub: {
        change: {}
    },
    _state: Object.create(null)
});
