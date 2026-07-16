import _CallbackFunctionHost from 'isotropic-pubsub/lib/callback-function-host.js';
import _Error from 'isotropic-error';
import _forIn from 'isotropic-for-in';
import _Initializable from 'isotropic-initializable';
import _later from 'isotropic-later';
import _make from 'isotropic-make';

export default _make('State', _Initializable, [
    _CallbackFunctionHost
], {
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
    _clearComputedDependencies ({
        propertyName
    }) {
        const dependencyStateMap = this._computedDependencyStateMapByPropertyName[propertyName];

        if (dependencyStateMap) {
            for (const [
                dependencyState,
                dependencyPropertyNameSet
            ] of dependencyStateMap) {
                for (const dependencyPropertyName of dependencyPropertyNameSet) {
                    const dependentPropertyNameSet = dependencyState._dependentStateMapByPropertyName[dependencyPropertyName].get(this);

                    dependentPropertyNameSet.delete(propertyName);

                    if (!dependentPropertyNameSet.size) {
                        dependencyState._dependentStateMapByPropertyName[dependencyPropertyName].delete(this);
                    }
                }
            }
        }

        this._computedDependencyStateMapByPropertyName[propertyName] = new Map();
    },
    _destroy (...args) {
        for (const propertyName of this.constructor._computedPropertyNameSet) {
            this._clearComputedDependencies({
                propertyName
            });
        }

        for (const propertyName of Reflect.ownKeys(this._dependentStateMapByPropertyName)) {
            for (const entry of this._dependentStateMapByPropertyName[propertyName]) {
                const dependentPropertyNameSet = entry[1],
                    dependentState = entry[0];

                for (const dependentPropertyName of dependentPropertyNameSet) {
                    dependentState._computedDependencyStateMapByPropertyName[dependentPropertyName].delete(this);
                }
            }
        }

        Reflect.apply(_Initializable.prototype._destroy, this, args);
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
        this._computedDependencyStateMapByPropertyName = {};
        this._computingPropertyNameSet = new Set();
        this._currentBatch = {
            newValue: {},
            oldValue: {},
            propertyNameSet: new Set()
        };
        this._dependentStateMapByPropertyName = {};
        this._recomputePropertyNameSet = new Set();

        let initializePromise = null;

        for (const propertyName of this.constructor._statePropertyNameSet) {
            const propertyConfig = this.constructor._state[propertyName];

            let value;

            if (Object.hasOwn(config, propertyName)) {
                value = config[propertyName];
            } else if (propertyConfig.initFunction) {
                value = this._callCallbackFunction(propertyConfig.initFunction, this);
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
                            this._clearComputedDependencies({
                                propertyName
                            });
                            this.constructor._pushComputation({
                                propertyName,
                                state: this
                            });

                            let newValue,
                                oldValue;

                            try {
                                newValue = this._callCallbackFunction(computeFunction, this);
                                oldValue = this[internalPropertyName];
                            } catch (error) {
                                this._computingPropertyNameSet.delete(propertyName);

                                throw _Error({
                                    details: {
                                        propertyName
                                    },
                                    error,
                                    message: 'Error computing property'
                                });
                            } finally {
                                this.constructor._popComputation();
                            }

                            if (newValue === this.constructor.forceChangeEvent) {
                                this._publish(changeEventName, {
                                    newValue: oldValue,
                                    oldValue,
                                    propertyName
                                });
                            } else if (newValue === oldValue) {
                                this._computingPropertyNameSet.delete(propertyName);
                                this._recomputePropertyNameSet.delete(propertyName);
                            } else {
                                this._publish(changeEventName, {
                                    newValue,
                                    oldValue,
                                    propertyName
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
                            this._clearComputedDependencies({
                                propertyName
                            });
                            this.constructor._pushComputation({
                                propertyName,
                                state: this
                            });

                            try {
                                const newValue = this._callCallbackFunction(computeFunction, this),
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
                                this.constructor._popComputation();
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
        const dependentStateMap = this._dependentStateMapByPropertyName[propertyName];

        if (dependentStateMap) {
            // Snapshot the dependents here. The dependency maps get mutated during recomputation. Iterating them directly leads to infinite loops.
            const dependentList = [];

            for (const entry of dependentStateMap) {
                const dependentPropertyNameSet = entry[1],
                    dependentState = entry[0];

                for (const dependentPropertyName of dependentPropertyNameSet) {
                    dependentList.push({
                        propertyName: dependentPropertyName,
                        state: dependentState
                    });
                }
            }

            for (const dependent of dependentList) {
                dependent.state._recomputeProperty({
                    propertyName: dependent.propertyName
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
        const currentComputation = this.constructor._currentComputation;

        if (currentComputation) {
            const dependentPropertyName = currentComputation.propertyName,
                dependentState = currentComputation.state;

            {
                const dependencyStateMap = dependentState._computedDependencyStateMapByPropertyName[dependentPropertyName];

                {
                    let dependencyPropertyNameSet = dependencyStateMap.get(this);

                    if (!dependencyPropertyNameSet) {
                        dependencyPropertyNameSet = new Set();
                        dependencyStateMap.set(this, dependencyPropertyNameSet);
                    }

                    dependencyPropertyNameSet.add(propertyName);
                }
            }

            {
                let dependentStateMap = this._dependentStateMapByPropertyName[propertyName];

                if (!dependentStateMap) {
                    dependentStateMap = new Map();
                    this._dependentStateMapByPropertyName[propertyName] = dependentStateMap;
                }

                {
                    let dependentPropertyNameSet = dependentStateMap.get(dependentState);

                    if (!dependentPropertyNameSet) {
                        dependentPropertyNameSet = new Set();
                        dependentStateMap.set(dependentState, dependentPropertyNameSet);
                    }

                    dependentPropertyNameSet.add(dependentPropertyName);
                }
            }
        }
    }
}, {
    forceChangeEvent: Symbol('forceChangeEvent'),
    recompute: Symbol('recompute'),
    _computationStack: [],
    _computed: Object.create(null),
    get _currentComputation () {
        return this._computationStack[this._computationStack.length - 1];
    },
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
                        } else if (this._callCallbackFunction(validateFunction, this, newValue)) {
                            newValue = this._callCallbackFunction(setFunction, this, newValue);

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
                        } else if (newValue !== oldValue && this._callCallbackFunction(validateFunction, this, newValue)) {
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
                        newValue = this._callCallbackFunction(setFunction, this, newValue);

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

                    return this._callCallbackFunction(getFunction, this, this[internalPropertyName]);
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
    _popComputation () {
        return this._computationStack.pop();
    },
    _propertyChains: [
        '_computed',
        '_state'
    ],
    _pubsub: {
        change: {}
    },
    _pushComputation ({
        propertyName,
        state
    }) {
        this._computationStack.push({
            propertyName,
            state
        });
    },
    _state: Object.create(null)
});
