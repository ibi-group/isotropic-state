import _chai from 'isotropic-dev-dependencies/lib/chai.js';
import _Error from 'isotropic-error';
import _later from 'isotropic-later';
import _make from 'isotropic-make';
import _process from 'node:process';
import _State from '../lib/state.js';
import _test from 'node:test';

_test.describe('State', () => {
    _test.it('should construct state objects', () => {
        _chai.expect(_State).to.be.a('function');
        _chai.expect(_State).to.have.property('name').that.equals('State');

        const state = new _State();

        _chai.expect(state).to.be.a('State');
        _chai.expect(state).to.be.an.instanceOf(_State);
        _chai.expect(state).to.have.property('batchChanges').that.is.a('function');
    });

    _test.it('should be a state object factory', () => {
        const state = _State();

        _chai.expect(state).to.be.an.instanceOf(_State);
        _chai.expect(state).to.have.property('batchChanges').that.is.a('function');
    });

    _test.it('should initialize state properties from initFunction config function', () => {
        const customState = _make(_State, {}, {
            _state: {
                a: {
                    initFunction () {
                        return 1;
                    }
                },
                b: {
                    initFunction () {
                        return 2;
                    }
                },
                c: {
                    initFunction () {
                        return 3;
                    }
                }
            }
        })();

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);
    });

    _test.it('should initialize state properties from async initFunction config function', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
            _state: {
                a: {
                    initFunction () {
                        return Promise.resolve(1);
                    }
                },
                b: {
                    initFunction () {
                        return Promise.resolve(2);
                    }
                },
                c: {
                    initFunction () {
                        return Promise.resolve(3);
                    }
                }
            }
        })();

        _chai.expect(customState).to.have.property('a').that.is.undefined;
        _chai.expect(customState).to.have.property('b').that.is.undefined;
        _chai.expect(customState).to.have.property('c').that.is.undefined;

        customState.after('initializeComplete', () => {
            _chai.expect(customState).to.have.property('a', 1);
            _chai.expect(customState).to.have.property('b', 2);
            _chai.expect(customState).to.have.property('c', 3);
            callbackFunction();
        });
    });

    _test.it('should initialize state properties from initFunction config method', () => {
        const customState = _make(_State, {
            initA () {
                return 1;
            },
            initB () {
                return 2;
            },
            initC () {
                return 3;
            }
        }, {
            _state: {
                a: {
                    initFunction: 'initA'
                },
                b: {
                    initFunction: 'initB'
                },
                c: {
                    initFunction: 'initC'
                }
            }
        })();

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);
    });

    _test.it('should initialize state properties from async initFunction config function', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {
            initA () {
                return Promise.resolve(1);
            },
            initB () {
                return Promise.resolve(2);
            },
            initC () {
                return Promise.resolve(3);
            }
        }, {
            _state: {
                a: {
                    initFunction: 'initA'
                },
                b: {
                    initFunction: 'initB'
                },
                c: {
                    initFunction: 'initC'
                }
            }
        })();

        _chai.expect(customState).to.have.property('a').that.is.undefined;
        _chai.expect(customState).to.have.property('b').that.is.undefined;
        _chai.expect(customState).to.have.property('c').that.is.undefined;

        customState.after('initializeComplete', () => {
            _chai.expect(customState).to.have.property('a', 1);
            _chai.expect(customState).to.have.property('b', 2);
            _chai.expect(customState).to.have.property('c', 3);
            callbackFunction();
        });
    });

    _test.it('should initialize state properties from constructor arguments', () => {
        const customState = _make(_State, {}, {
            _state: {
                a: {
                    initFunction () {
                        return 1;
                    }
                },
                b: {
                    initFunction () {
                        return 2;
                    }
                },
                c: {
                    initFunction () {
                        return 3;
                    }
                }
            }
        })({
            a: 5,
            b: 6,
            c: 7
        });

        _chai.expect(customState).to.have.property('a', 5);
        _chai.expect(customState).to.have.property('b', 6);
        _chai.expect(customState).to.have.property('c', 7);
    });

    _test.it('should initialize state properties from async constructor arguments', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
            _state: {
                a: {
                    initFunction () {
                        return 1;
                    }
                },
                b: {
                    initFunction () {
                        return 2;
                    }
                },
                c: {
                    initFunction () {
                        return 3;
                    }
                }
            }
        })({
            a: Promise.resolve(5),
            b: Promise.resolve(6),
            c: Promise.resolve(7)
        });

        _chai.expect(customState).to.have.property('a').that.is.undefined;
        _chai.expect(customState).to.have.property('b').that.is.undefined;
        _chai.expect(customState).to.have.property('c').that.is.undefined;

        customState.after('initializeComplete', () => {
            _chai.expect(customState).to.have.property('a', 5);
            _chai.expect(customState).to.have.property('b', 6);
            _chai.expect(customState).to.have.property('c', 7);
            callbackFunction();
        });
    });

    _test.it('should publish state property change events', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value += 1;

        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should publish state property change events with configurable event name', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    changeEventName: 'someCustomEventName'
                }
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.after('someCustomEventName', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value += 1;

        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should not publish a state property change event if the value has not changed', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.after('valueChange', () => {
            subscriptionExecuted = true;
        });

        customState.value = 0;

        _chai.expect(subscriptionExecuted).to.be.false;
    });

    _test.it('should get transformed state property values', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    getFunction: value => value + 1
                }
            }
        })();

        customState.value = 9;

        _chai.expect(customState).to.have.property('value', 10);
    });

    _test.it('should set transformed state property values', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction: value => value + 1
                }
            }
        })();

        customState.value = 9;

        _chai.expect(customState).to.have.property('value', 10);
    });

    _test.it('should not update invalid state property values', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    validateFunction: value => value <= 1
                }
            }
        })({
            value: 0
        });

        let subscriptionExecutedCount = 0;

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecutedCount += 1;

            _chai.expect(data).to.have.property('newValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value += 1;
        customState.value += 1;

        _chai.expect(subscriptionExecutedCount).to.equal(1);
    });

    _test.it('should validate state property values before transform', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction: value => value + 1,
                    validateFunction: value => value <= 1
                }
            }
        })({
            value: 0
        });

        let subscriptionExecutedCount = 0;

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecutedCount += 1;

            _chai.expect(data).to.have.property('newValue', 2);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value += 1;
        customState.value += 1;

        _chai.expect(subscriptionExecutedCount).to.equal(1);
    });

    _test.it('should not update readOnly state property values', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    readOnly: true
                }
            }
        })({
            value: 0
        });

        let subscriptionExecutedCount = 0;

        customState.after('valueChange', () => {
            subscriptionExecutedCount += 1;
        });

        _chai.expect(customState).to.have.property('value', 0);

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecutedCount).to.equal(0);
    });

    _test.it('should publish an event when attempting to update readOnly state property values when readOnlySetBehavior is event', () => {
        const customState = _make(_State, {}, {
                _state: {
                    value: {
                        readOnly: true,
                        readOnlySetBehavior: 'event'
                    }
                }
            })({
                value: 0
            }),
            subscriptionsExecuted = [];

        customState.after('valueChange', () => {
            subscriptionsExecuted.push('valueChange');
        });

        customState.after('valueReadOnlySet', ({
            data
        }) => {
            subscriptionsExecuted.push('valueReadOnlySet');

            _chai.expect(data).to.have.property('attemptedValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        _chai.expect(customState).to.have.property('value', 0);

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'valueReadOnlySet'
        ]);
    });

    _test.it('should publish an event when attempting to update readOnly state property values when readOnlySetBehavior is event with configurable event name', () => {
        const customState = _make(_State, {}, {
                _state: {
                    value: {
                        readOnly: true,
                        readOnlySetBehavior: 'event',
                        readOnlySetEventName: 'someOtherCustomEventName'
                    }
                }
            })({
                value: 0
            }),
            subscriptionsExecuted = [];

        customState.after('valueChange', () => {
            subscriptionsExecuted.push('valueChange');
        });

        customState.after('someOtherCustomEventName', ({
            data
        }) => {
            subscriptionsExecuted.push('someOtherCustomEventName');

            _chai.expect(data).to.have.property('attemptedValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        _chai.expect(customState).to.have.property('value', 0);

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'someOtherCustomEventName'
        ]);
    });

    _test.it('should throw an error when attempting to update readOnly state property values when readOnlySetBehavior is throw', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    readOnly: true,
                    readOnlySetBehavior: 'throw'
                }
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false,
            thrown = false;

        customState.after('valueChange', () => {
            subscriptionExecuted = true;
        });

        _chai.expect(customState).to.have.property('value', 0);

        try {
            customState.value += 1;
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.false;
        _chai.expect(thrown).to.be.true;
    });

    _test.it('should throw an error when state property\'s readOnlySetBehavior is invalid', () => {
        let thrown = false;

        try {
            _make(_State, {}, {
                _state: {
                    value: {
                        readOnly: true,
                        readOnlySetBehavior: 'thisIsNotAValidValueHere'
                    }
                }
            })();
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.true;
    });

    _test.it('should not update setOnce state property values more than once', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    readOnly: 'setOnce'
                }
            }
        })();

        let subscriptionExecutedCount = 0;

        customState.after('valueChange', () => {
            subscriptionExecutedCount += 1;
        });

        customState.value = 1;

        _chai.expect(customState).to.have.property('value', 1);

        customState.value = 2;

        _chai.expect(customState).to.have.property('value', 1);
        _chai.expect(subscriptionExecutedCount).to.equal(1);
    });

    _test.it('should publish an event when attempting to update setOnce state property values more than once when readOnlySetBehavior is event', () => {
        const customState = _make(_State, {}, {
                _state: {
                    value: {
                        readOnly: 'setOnce',
                        readOnlySetBehavior: 'event'
                    }
                }
            })(),
            subscriptionsExecuted = [];

        customState.after('valueChange', () => {
            subscriptionsExecuted.push('valueChange');
        });

        customState.after('valueReadOnlySet', ({
            data
        }) => {
            subscriptionsExecuted.push('valueReadOnlySet');

            _chai.expect(data).to.have.property('attemptedValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = 0;

        _chai.expect(customState).to.have.property('value', 0);

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'valueChange',
            'valueReadOnlySet'
        ]);
    });

    _test.it('should publish an event when attempting to update setOnce state property values more than once when readOnlySetBehavior is event with configurable event name', () => {
        const customState = _make(_State, {}, {
                _state: {
                    value: {
                        readOnly: 'setOnce',
                        readOnlySetBehavior: 'event',
                        readOnlySetEventName: 'aDifferentEventName'
                    }
                }
            })(),
            subscriptionsExecuted = [];

        customState.after('valueChange', () => {
            subscriptionsExecuted.push('valueChange');
        });

        customState.after('aDifferentEventName', ({
            data
        }) => {
            subscriptionsExecuted.push('aDifferentEventName');

            _chai.expect(data).to.have.property('attemptedValue', 1);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = 0;

        _chai.expect(customState).to.have.property('value', 0);

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'valueChange',
            'aDifferentEventName'
        ]);
    });

    _test.it('should throw an error when attempting to update setOnce state property values more than once when readOnlySetBehavior is throw', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    readOnly: 'setOnce',
                    readOnlySetBehavior: 'throw'
                }
            }
        })();

        let subscriptionExecutedCount = 0,
            thrown = false;

        customState.after('valueChange', () => {
            subscriptionExecutedCount += 1;
        });

        customState.value = 0;

        _chai.expect(customState).to.have.property('value', 0);

        try {
            customState.value += 1;
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecutedCount).to.be.equal(1);
        _chai.expect(thrown).to.be.true;
    });

    _test.it('should publish a change event when a state property value is set to forceChangeEvent without changing the value', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = _State.forceChangeEvent;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should bypass the validateFunction when a state property value is set to forceChangeEvent', () => {
        let subscriptionExecuted = false,
            validateFunctionExecuted = false;

        const customState = _make(_State, {}, {
            _state: {
                value: {
                    validateFunction () {
                        validateFunctionExecuted = true;

                        return true;
                    }
                }
            }
        })({
            value: 0
        });

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = _State.forceChangeEvent;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.true;
        _chai.expect(validateFunctionExecuted).to.be.false;
    });

    _test.it('should bypass the validateFunction and setFunction when a state property value is set to forceChangeEvent', () => {
        let setFunctionExecuted = false,
            subscriptionExecuted = false,
            validateFunctionExecuted = false;

        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction (value) {
                        setFunctionExecuted = true;

                        return value;
                    },
                    validateFunction () {
                        validateFunctionExecuted = true;

                        return true;
                    }
                }
            }
        })({
            value: 0
        });

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = _State.forceChangeEvent;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(setFunctionExecuted).to.be.false;
        _chai.expect(subscriptionExecuted).to.be.true;
        _chai.expect(validateFunctionExecuted).to.be.false;
    });

    _test.it('should bypass the setFunction when a state property value is set to forceChangeEvent', () => {
        let setFunctionExecuted = false,
            subscriptionExecuted = false;

        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction (value) {
                        setFunctionExecuted = true;

                        return value;
                    }
                }
            }
        })({
            value: 0
        });

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = _State.forceChangeEvent;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(setFunctionExecuted).to.be.false;
        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should publish a change event when a state property\'s setFunction returns forceChangeEvent without changing the value', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction (value) {
                        _chai.expect(value).to.equal(123);

                        return _State.forceChangeEvent;
                    }
                }
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = 123;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should publish a change event when a state property\'s setFunction returns forceChangeEvent without changing the value after initial value validation', () => {
        let subscriptionExecuted = false,
            validateFunctionExecuted = true;

        const customState = _make(_State, {}, {
            _state: {
                value: {
                    setFunction (value) {
                        _chai.expect(value).to.equal(123);

                        return _State.forceChangeEvent;
                    },
                    validateFunction (value) {
                        validateFunctionExecuted = true;

                        return value === 123;
                    }
                }
            }
        })({
            value: 0
        });

        customState.after('valueChange', ({
            data
        }) => {
            subscriptionExecuted = true;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'value');
        });

        customState.value = 123;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.true;
        _chai.expect(validateFunctionExecuted).to.be.true;
    });

    _test.it('should not update a state property value if its change event is prevented', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.on('valueChange', event => {
            subscriptionExecuted = true;

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'value');

            event.prevent();
        });

        customState.value = 1;

        _chai.expect(customState).to.have.property('value', 0);
        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should enable subscribers to alter the new state property value', () => {
        const customState = _make(_State, {}, {
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecuted = false;

        customState.on('valueChange', event => {
            subscriptionExecuted = true;

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'value');

            event.data.newValue = 200;
        });

        customState.value = 1;

        _chai.expect(customState).to.have.property('value', 200);
        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should publish a general change event once when there are multiple synchronous state property changes', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
                _state: {
                    a: {},
                    b: {},
                    c: {}
                }
            })({
                a: 0,
                autoBatchChanges: true,
                b: 0,
                c: 0
            }),
            subscriptionsExecuted = [];

        customState.after('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.after('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.after('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.after('change', ({
            data: {
                newValue,
                oldValue,
                propertyNameSet
            }
        }) => {
            subscriptionsExecuted.push('change');

            _chai.expect(newValue).to.deep.equal({
                a: 1,
                b: 2,
                c: 3
            });
            _chai.expect(oldValue).to.deep.equal({
                a: 0,
                b: 0,
                c: 0
            });
            _chai.expect(Array.from(propertyNameSet)).to.have.members([
                'a',
                'b',
                'c'
            ]);

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange',
                'change'
            ]);

            callbackFunction();
        });

        _chai.expect(customState).to.have.property('a', 0);
        _chai.expect(customState).to.have.property('b', 0);
        _chai.expect(customState).to.have.property('c', 0);

        customState.a = 1;
        customState.b = 2;
        customState.c = 3;

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange'
        ]);
    });

    _test.it('should not publish a general change event when autoBatchChanges is set to false', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
                _state: {
                    a: {},
                    b: {},
                    c: {}
                }
            })({
                a: 0,
                autoBatchChanges: false,
                b: 0,
                c: 0
            }),
            subscriptionsExecuted = [];

        customState.after('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.after('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.after('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.after('change', ({
            data: {
                newValue,
                oldValue,
                propertyNameSet
            }
        }) => {
            subscriptionsExecuted.push('change');

            _chai.expect(newValue).to.deep.equal({
                a: 1,
                b: 2,
                c: 3
            });
            _chai.expect(oldValue).to.deep.equal({
                a: 0,
                b: 0,
                c: 0
            });
            _chai.expect(Array.from(propertyNameSet)).to.have.members([
                'a',
                'b',
                'c'
            ]);

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange',
                'change'
            ]);
        });

        _chai.expect(customState).to.have.property('a', 0);
        _chai.expect(customState).to.have.property('b', 0);
        _chai.expect(customState).to.have.property('c', 0);

        customState.a = 1;
        customState.b = 2;
        customState.c = 3;

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange'
        ]);

        _later(55, () => {
            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange'
            ]);

            callbackFunction();
        });
    });

    _test.it('should allow manually batching state property changes when autoBatchChanges is set to false', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
                _state: {
                    a: {},
                    b: {},
                    c: {}
                }
            })({
                a: 0,
                autoBatchChanges: false,
                b: 0,
                c: 0
            }),
            subscriptionsExecuted = [];

        customState.onceAfter('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.onceAfter('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.onceAfter('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.after('change', ({
            data: {
                newValue,
                oldValue,
                propertyNameSet
            }
        }) => {
            subscriptionsExecuted.push('change');

            _chai.expect(newValue).to.deep.equal({
                a: 3,
                c: 1
            });
            _chai.expect(oldValue).to.deep.equal({
                a: 1,
                c: 3
            });
            _chai.expect(Array.from(propertyNameSet)).to.have.members([
                'a',
                'c'
            ]);

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange',
                'aChange',
                'cChange',
                'change'
            ]);

            callbackFunction();
        });

        _chai.expect(customState).to.have.property('a', 0);
        _chai.expect(customState).to.have.property('b', 0);
        _chai.expect(customState).to.have.property('c', 0);

        customState.a = 1;
        customState.b = 2;
        customState.c = 3;

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange'
        ]);

        _later(55, () => {
            customState.onceAfter('aChange', event => {
                subscriptionsExecuted.push('aChange');

                _chai.expect(event.data).to.have.property('newValue', 3);
                _chai.expect(event.data).to.have.property('oldValue', 1);
                _chai.expect(event.data).to.have.property('propertyName', 'a');
            });

            customState.onceAfter('cChange', event => {
                subscriptionsExecuted.push('cChange');

                _chai.expect(event.data).to.have.property('newValue', 1);
                _chai.expect(event.data).to.have.property('oldValue', 3);
                _chai.expect(event.data).to.have.property('propertyName', 'c');
            });

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange'
            ]);

            _later(55, () => {
                customState.batchChanges();

                customState.a = 3;
                customState.b = 2;
                customState.c = 1;

                _chai.expect(subscriptionsExecuted).to.deep.equal([
                    'aChange',
                    'bChange',
                    'cChange',
                    'aChange',
                    'cChange'
                ]);
            });
        });
    });

    _test.it('should accumulate multiple state property changes to a single property when publishing a general change event', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
                _state: {
                    a: {},
                    b: {},
                    c: {}
                }
            })({
                a: 0,
                autoBatchChanges: true,
                b: 0,
                c: 0
            }),
            subscriptionsExecuted = [];

        customState.onceAfter('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.onceAfter('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.onceAfter('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.after('change', ({
            data: {
                newValue,
                oldValue,
                propertyNameSet
            }
        }) => {
            subscriptionsExecuted.push('change');

            _chai.expect(newValue).to.deep.equal({
                a: 3,
                b: 6,
                c: 9
            });
            _chai.expect(oldValue).to.deep.equal({
                a: 0,
                b: 0,
                c: 0
            });
            _chai.expect(Array.from(propertyNameSet)).to.have.members([
                'a',
                'b',
                'c'
            ]);

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'bChange',
                'cChange',
                'aChange',
                'bChange',
                'cChange',
                'aChange',
                'bChange',
                'cChange',
                'change'
            ]);

            callbackFunction();
        });

        _chai.expect(customState).to.have.property('a', 0);
        _chai.expect(customState).to.have.property('b', 0);
        _chai.expect(customState).to.have.property('c', 0);

        customState.a = 1;
        customState.b = 2;
        customState.c = 3;

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange'
        ]);

        customState.onceAfter('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 1);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.onceAfter('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 4);
            _chai.expect(event.data).to.have.property('oldValue', 2);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.onceAfter('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 6);
            _chai.expect(event.data).to.have.property('oldValue', 3);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.a = 2;
        customState.b = 4;
        customState.c = 6;

        _chai.expect(customState).to.have.property('a', 2);
        _chai.expect(customState).to.have.property('b', 4);
        _chai.expect(customState).to.have.property('c', 6);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange',
            'aChange',
            'bChange',
            'cChange'
        ]);

        customState.onceAfter('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 2);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.onceAfter('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 6);
            _chai.expect(event.data).to.have.property('oldValue', 4);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.onceAfter('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 9);
            _chai.expect(event.data).to.have.property('oldValue', 6);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.a = 3;
        customState.b = 6;
        customState.c = 9;

        _chai.expect(customState).to.have.property('a', 3);
        _chai.expect(customState).to.have.property('b', 6);
        _chai.expect(customState).to.have.property('c', 9);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'bChange',
            'cChange',
            'aChange',
            'bChange',
            'cChange',
            'aChange',
            'bChange',
            'cChange'
        ]);
    });

    _test.it('should not swallow exceptions thrown by subscribers to the general change event', {
        timeout: 377
    }, (test, callbackFunction) => {
        let subscriptionExecuted = false;

        const customState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            })({
                autoBatchChanges: true,
                value: 0
            }),
            emit = _process.emit,
            error = _Error({
                message: 'This exception should not get swallowed'
            });

        customState.after('change', () => {
            subscriptionExecuted = true;

            throw error;
        });

        _process.emit = (...args) => {
            if (args[0] === 'uncaughtException' && args[1] === error) {
                _process.emit = emit;

                _chai.expect(subscriptionExecuted).to.be.true;

                _later.asap(() => {
                    callbackFunction();
                });

                return true;
            }

            return Reflect.apply(emit, _process, args);
        };

        customState.value = 1;
    });

    _test.it('should compute properties from computeFunction function', () => {
        _chai.expect(_make(_State, {}, {
            _computed: {
                fullName () {
                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        })).to.have.property('fullName', 'Jane Smith');
    });

    _test.it('should compute properties from computeFunction method', () => {
        _chai.expect(_make(_State, {
            computeFullName () {
                return `${this.firstName} ${this.lastName}`;
            }
        }, {
            _computed: {
                fullName: 'computeFullName'
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        })).to.have.property('fullName', 'Jane Smith');
    });

    _test.it('should compute properties from computeFunction config function', () => {
        _chai.expect(_make(_State, {}, {
            _computed: {
                fullName: {
                    computeFunction () {
                        return `${this.firstName} ${this.lastName}`;
                    }
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        })).to.have.property('fullName', 'Jane Smith');
    });

    _test.it('should compute properties from computeFunction config method', () => {
        _chai.expect(_make(_State, {
            computeFullName () {
                return `${this.firstName} ${this.lastName}`;
            }
        }, {
            _computed: {
                fullName: {
                    computeFunction: 'computeFullName'
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        })).to.have.property('fullName', 'Jane Smith');
    });

    _test.it('should update computed properties when dependencies change', () => {
        const customState = _make(_State, {}, {
            _computed: {
                fullName () {
                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');

        customState.firstName = 'John';

        _chai.expect(customState).to.have.property('fullName', 'John Smith');

        customState.lastName = 'Johnson';

        _chai.expect(customState).to.have.property('fullName', 'John Johnson');
    });

    _test.it('should cache computed values', () => {
        let computeFunctionExecutedCount = 0;

        const customState = _make(_State, {}, {
            _computed: {
                doubled () {
                    computeFunctionExecutedCount += 1;

                    return this.value * 2;
                }
            },
            _state: {
                value: {}
            }
        })({
            value: 5
        });

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        _chai.expect(customState.doubled).to.equal(10);

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        _chai.expect(customState.doubled).to.equal(10);

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        customState.value = 7;

        _chai.expect(computeFunctionExecutedCount).to.equal(2);

        _chai.expect(customState.doubled).to.equal(14);

        _chai.expect(computeFunctionExecutedCount).to.equal(2);
    });

    _test.it('should allow computed properties to depend on other computed properties', () => {
        const customState = _make(_State, {}, {
            _computed: {
                sum () {
                    return this.a + this.b;
                },
                sumDoubled () {
                    return this.sum * 2;
                },
                sumQuadrupled () {
                    return this.sumDoubled * 2;
                }
            },
            _state: {
                a: {},
                b: {}
            }
        })({
            a: 1,
            b: 2
        });

        _chai.expect(customState.sum).to.equal(3);
        _chai.expect(customState.sumDoubled).to.equal(6);
        _chai.expect(customState.sumQuadrupled).to.equal(12);

        customState.a = 2;

        _chai.expect(customState.sumQuadrupled).to.equal(16);
        _chai.expect(customState.sumDoubled).to.equal(8);
        _chai.expect(customState.sum).to.equal(4);
    });

    _test.it('should detect circular dependencies', {
        timeout: 377
    }, (test, callbackFunction) => {
        _make(_State, {}, {
            _computed: {
                a () {
                    return this.b + 1;
                },
                b () {
                    return this.c + 1;
                },
                c () {
                    return this.a + 1;
                }
            }
        })().on('initializeError', event => {
            event.prevent();

            callbackFunction();
        });
    });

    _test.it('should publish computed property change events', () => {
        const customState = _make(_State, {}, {
            _computed: {
                fullName () {
                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        let subscriptionExecuted = false;

        customState.after('fullNameChange', ({
            data: {
                newValue,
                oldValue,
                propertyName
            }
        }) => {
            subscriptionExecuted = true;
            _chai.expect(newValue).to.equal('John Smith');
            _chai.expect(oldValue).to.equal('Jane Smith');
            _chai.expect(propertyName).to.equal('fullName');
        });

        customState.firstName = 'John';

        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should publish computed property change events with configurable event name', () => {
        const customState = _make(_State, {}, {
            _computed: {
                fullName: {
                    changeEventName: 'differentChangeEventName',
                    computeFunction () {
                        return `${this.firstName} ${this.lastName}`;
                    }
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        let subscriptionExecuted = false;

        customState.after('differentChangeEventName', ({
            data: {
                newValue,
                oldValue,
                propertyName
            }
        }) => {
            subscriptionExecuted = true;
            _chai.expect(newValue).to.equal('John Smith');
            _chai.expect(oldValue).to.equal('Jane Smith');
            _chai.expect(propertyName).to.equal('fullName');
        });

        customState.firstName = 'John';

        _chai.expect(subscriptionExecuted).to.be.true;
    });

    _test.it('should not publish a computed property change event if the value has not changed', () => {
        let computeFunctionExecutedCount = 0,
            subscriptionExecuted = false;

        const customState = _make(_State, {}, {
            _computed: {
                initials () {
                    computeFunctionExecutedCount += 1;

                    return `${this.firstName[0]}${this.lastName[0]}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        customState.after('initialsChange', () => {
            subscriptionExecuted = true;
        });

        _chai.expect(computeFunctionExecutedCount).to.equal(1);
        _chai.expect(customState).to.have.property('initials', 'JS');

        customState.firstName = 'John';

        _chai.expect(computeFunctionExecutedCount).to.equal(2);
        _chai.expect(customState).to.have.property('initials', 'JS');
        _chai.expect(subscriptionExecuted).to.be.false;
    });

    _test.it('should throw an error when attempting to set a computed property', () => {
        let thrown = false;

        try {
            _make(_State, {}, {
                _computed: {
                    fullName () {
                        return `${this.firstName} ${this.lastName}`;
                    }
                },
                _state: {
                    firstName: {},
                    lastName: {}
                }
            })({
                firstName: 'Jane',
                lastName: 'Smith'
            }).fullName = 'Someone Else';
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.true;
    });

    _test.it('should recompute computed properties when set to recompute', () => {
        let computeFunctionExecutedCount = 0;

        const customState = _make(_State, {}, {
            _computed: {
                fullName () {
                    computeFunctionExecutedCount += 1;

                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        _chai.expect(computeFunctionExecutedCount).to.equal(1);
        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');
        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        customState.fullName = _State.recompute;

        _chai.expect(computeFunctionExecutedCount).to.equal(2);
        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');
        _chai.expect(computeFunctionExecutedCount).to.equal(2);
    });

    _test.it('should publish a change event when a computed property\'s compute Function returns forceChangeEvent without changing the value', () => {
        const customState = _make(_State, {}, {
            _computed: {
                updateIfEven () {
                    return this.value % 2 === 0 ?
                        this.value :
                        _State.forceChangeEvent;
                }
            },
            _state: {
                value: {}
            }
        })({
            value: 0
        });

        let subscriptionExecutedCount = 0;

        customState.onceAfter('updateIfEvenChange', ({
            data
        }) => {
            subscriptionExecutedCount += 1;

            _chai.expect(data).to.have.property('newValue', 0);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'updateIfEven');
        });

        customState.value += 1;

        _chai.expect(customState).to.have.property('value', 1);

        customState.onceAfter('updateIfEvenChange', ({
            data
        }) => {
            subscriptionExecutedCount += 1;

            _chai.expect(data).to.have.property('newValue', 2);
            _chai.expect(data).to.have.property('oldValue', 0);
            _chai.expect(data).to.have.property('propertyName', 'updateIfEven');
        });

        customState.value += 1;

        _chai.expect(customState).to.have.property('updateIfEven', 2);
        _chai.expect(customState).to.have.property('value', 2);

        _chai.expect(subscriptionExecutedCount).to.equal(2);
    });

    _test.it('should not update a computed property value if its change event is prevented', () => {
        const customState = _make(_State, {}, {
            _computed: {
                fullName () {
                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        let subscriptionExecuted = false;

        customState.on('fullNameChange', event => {
            subscriptionExecuted = true;
            _chai.expect(event.data).to.have.property('newValue', 'John Smith');
            _chai.expect(event.data).to.have.property('oldValue', 'Jane Smith');
            _chai.expect(event.data).to.have.property('propertyName', 'fullName');

            event.prevent();
        });

        customState.firstName = 'John';

        _chai.expect(subscriptionExecuted).to.be.true;
        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');
    });

    _test.it('should enable subscribers to alter the new computed property value', () => {
        const customState = _make(_State, {}, {
            _computed: {
                fullName () {
                    return `${this.firstName} ${this.lastName}`;
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        let subscriptionExecuted = false;

        customState.on('fullNameChange', event => {
            subscriptionExecuted = true;
            _chai.expect(event.data).to.have.property('newValue', 'John Smith');
            _chai.expect(event.data).to.have.property('oldValue', 'Jane Smith');
            _chai.expect(event.data).to.have.property('propertyName', 'fullName');

            event.data.newValue = 'Someone Else';
        });

        customState.firstName = 'John';

        _chai.expect(subscriptionExecuted).to.be.true;
        _chai.expect(customState).to.have.property('fullName', 'Someone Else');
    });

    _test.it('should publish a general change event once when there are multiple synchronous computed property changes', {
        timeout: 377
    }, (test, callbackFunction) => {
        const customState = _make(_State, {}, {
                _computed: {
                    x () {
                        return this.a * 2;
                    },
                    y () {
                        return this.b * 2;
                    },
                    z () {
                        return this.c * 2;
                    }
                },
                _state: {
                    a: {},
                    b: {},
                    c: {}
                }
            })({
                a: 0,
                autoBatchChanges: true,
                b: 0,
                c: 0
            }),
            subscriptionsExecuted = [];

        customState.on('aChange', event => {
            subscriptionsExecuted.push('aChange');

            _chai.expect(event.data).to.have.property('newValue', 1);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'a');
        });

        customState.on('bChange', event => {
            subscriptionsExecuted.push('bChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'b');
        });

        customState.on('cChange', event => {
            subscriptionsExecuted.push('cChange');

            _chai.expect(event.data).to.have.property('newValue', 3);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'c');
        });

        customState.on('xChange', event => {
            subscriptionsExecuted.push('xChange');

            _chai.expect(event.data).to.have.property('newValue', 2);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'x');
        });

        customState.on('yChange', event => {
            subscriptionsExecuted.push('yChange');

            _chai.expect(event.data).to.have.property('newValue', 4);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'y');
        });

        customState.on('zChange', event => {
            subscriptionsExecuted.push('zChange');

            _chai.expect(event.data).to.have.property('newValue', 6);
            _chai.expect(event.data).to.have.property('oldValue', 0);
            _chai.expect(event.data).to.have.property('propertyName', 'z');
        });

        customState.on('change', ({
            data: {
                newValue,
                oldValue,
                propertyNameSet
            }
        }) => {
            subscriptionsExecuted.push('change');

            _chai.expect(newValue).to.deep.equal({
                a: 1,
                b: 2,
                c: 3,
                x: 2,
                y: 4,
                z: 6
            });
            _chai.expect(oldValue).to.deep.equal({
                a: 0,
                b: 0,
                c: 0,
                x: 0,
                y: 0,
                z: 0
            });
            _chai.expect(Array.from(propertyNameSet)).to.have.members([
                'a',
                'b',
                'c',
                'x',
                'y',
                'z'
            ]);

            _chai.expect(subscriptionsExecuted).to.deep.equal([
                'aChange',
                'xChange',
                'bChange',
                'yChange',
                'cChange',
                'zChange',
                'change'
            ]);

            callbackFunction();
        });

        _chai.expect(customState).to.have.property('a', 0);
        _chai.expect(customState).to.have.property('b', 0);
        _chai.expect(customState).to.have.property('c', 0);
        _chai.expect(customState).to.have.property('x', 0);
        _chai.expect(customState).to.have.property('y', 0);
        _chai.expect(customState).to.have.property('z', 0);

        customState.a = 1;
        customState.b = 2;
        customState.c = 3;

        _chai.expect(customState).to.have.property('a', 1);
        _chai.expect(customState).to.have.property('b', 2);
        _chai.expect(customState).to.have.property('c', 3);
        _chai.expect(customState).to.have.property('x', 2);
        _chai.expect(customState).to.have.property('y', 4);
        _chai.expect(customState).to.have.property('z', 6);

        _chai.expect(subscriptionsExecuted).to.deep.equal([
            'aChange',
            'xChange',
            'bChange',
            'yChange',
            'cChange',
            'zChange'
        ]);
    });

    _test.it('should be able to compute properties lazily', () => {
        let computeFunctionExecutedCount = 0;

        const customState = _make(_State, {}, {
            _computed: {
                fullName: {
                    computeFunction () {
                        computeFunctionExecutedCount += 1;

                        return `${this.firstName} ${this.lastName}`;
                    },
                    lazy: true
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        _chai.expect(computeFunctionExecutedCount).to.equal(0);

        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        customState.firstName = 'John';

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        customState.lastName = 'Johnson';

        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        _chai.expect(customState).to.have.property('fullName', 'John Johnson');

        _chai.expect(computeFunctionExecutedCount).to.equal(2);
    });

    _test.it('should detect lazy circular dependencies', () => {
        let thrown = false;

        try {
            _make(_State, {}, {
                _computed: {
                    a: {
                        computeFunction () {
                            return this.b + 1;
                        },
                        lazy: true
                    },
                    b: {
                        computeFunction () {
                            return this.c + 1;
                        },
                        lazy: true
                    },
                    c: {
                        computeFunction () {
                            return this.a + 1;
                        },
                        lazy: true
                    }
                }
            })().a;
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.true;
    });

    _test.it('should throw an error when attempting to set a lazy computed property', () => {
        let thrown = false;

        try {
            _make(_State, {}, {
                _computed: {
                    fullName: {
                        computeFunction () {
                            return `${this.firstName} ${this.lastName}`;
                        },
                        lazy: true
                    }
                },
                _state: {
                    firstName: {},
                    lastName: {}
                }
            })({
                firstName: 'Jane',
                lastName: 'Smith'
            }).fullName = 'Someone Else';
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.true;
    });

    _test.it('should recompute lazy computed properties when set to recompute', () => {
        let computeFunctionExecutedCount = 0;

        const customState = _make(_State, {}, {
            _computed: {
                fullName: {
                    computeFunction () {
                        computeFunctionExecutedCount += 1;

                        return `${this.firstName} ${this.lastName}`;
                    },
                    lazy: true
                }
            },
            _state: {
                firstName: {},
                lastName: {}
            }
        })({
            firstName: 'Jane',
            lastName: 'Smith'
        });

        _chai.expect(computeFunctionExecutedCount).to.equal(0);
        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');
        _chai.expect(computeFunctionExecutedCount).to.equal(1);

        customState.fullName = _State.recompute;

        _chai.expect(computeFunctionExecutedCount).to.equal(1);
        _chai.expect(customState).to.have.property('fullName', 'Jane Smith');
        _chai.expect(computeFunctionExecutedCount).to.equal(2);
    });

    _test.it('should allow child to inherit and/or replace parent properties', () => {
        const ParentState = _make(_State, {}, {
                _computed: {
                    specialCalculation () {
                        return this.sum;
                    },
                    sum () {
                        return this.a + this.b;
                    }
                },
                _state: {
                    a: {
                        initFunction: () => 0
                    },
                    b: {
                        initFunction: () => 0
                    }
                }
            }),

            ChildState = _make(ParentState, {}, {
                _computed: {
                    product () {
                        return this.a * this.b;
                    },
                    specialCalculation () {
                        return this.product;
                    }
                },
                _state: {
                    b: {
                        initFunction: () => 10
                    }
                }
            }),

            childInstance = ChildState({
                a: 12
            }),
            parentInstance = ParentState({
                a: 7
            });

        _chai.expect(ParentState).to.be.a('function');
        _chai.expect(ChildState).to.be.a('function');

        _chai.expect(childInstance).to.have.property('a', 12);
        _chai.expect(childInstance).to.have.property('b', 10);
        _chai.expect(childInstance).to.have.property('product', 120);
        _chai.expect(childInstance).to.have.property('specialCalculation', 120);
        _chai.expect(childInstance).to.have.property('sum', 22);

        _chai.expect(parentInstance).to.have.property('a', 7);
        _chai.expect(parentInstance).to.have.property('b', 0);
        _chai.expect(parentInstance).to.have.property('specialCalculation', 7);
        _chai.expect(parentInstance).to.have.property('sum', 7);
    });

    _test.it('should allow child to inherit and/or replace parent change complete methods', () => {
        const ParentState = _make(_State, {}, {
                _computed: {
                    sum () {
                        return this.a + this.b;
                    }
                },
                _state: {
                    a: {
                        initFunction: () => 0
                    },
                    b: {
                        initFunction: () => 0
                    }
                }
            }),

            changeCompleteMethodsExecuted = [],
            ChildState = _make(ParentState, {
                _event_computed_sumChange (...args) {
                    changeCompleteMethodsExecuted.push('_event_computed_sumChange');

                    return Reflect.apply(ParentState.prototype._event_computed_sumChange, this, args);
                },
                _event_state_aChange (...args) {
                    changeCompleteMethodsExecuted.push('_event_state_aChange');

                    return Reflect.apply(ParentState.prototype._event_state_aChange, this, args);
                },
                _event_state_bChange (...args) {
                    changeCompleteMethodsExecuted.push('_event_state_bChange');

                    return Reflect.apply(ParentState.prototype._event_state_bChange, this, args);
                }
            }),

            childInstance = ChildState();

        _chai.expect(ParentState).to.be.a('function');
        _chai.expect(ChildState).to.be.a('function');

        _chai.expect(changeCompleteMethodsExecuted).to.deep.equal([
            '_event_computed_sumChange'
        ]);

        childInstance.a = 100;

        _chai.expect(changeCompleteMethodsExecuted).to.deep.equal([
            '_event_computed_sumChange',
            '_event_state_aChange',
            '_event_computed_sumChange'
        ]);

        childInstance.b = -100;

        _chai.expect(changeCompleteMethodsExecuted).to.deep.equal([
            '_event_computed_sumChange',
            '_event_state_aChange',
            '_event_computed_sumChange',
            '_event_state_bChange',
            '_event_computed_sumChange'
        ]);
    });

    _test.it('should track trailing dependencies that follow a nested computation', () => {
        /* An eager computed reads a dirty lazy computed first, then reads a state
        property. The state property read happens after the nested computation of
        the lazy computed completes. The trailing dependency must still be tracked. */
        const customState = _make(_State, {}, {
            _computed: {
                inner: {
                    computeFunction () {
                        return this.a * 2;
                    },
                    lazy: true
                },
                outer () {
                    return this.inner + this.b;
                }
            },
            _state: {
                a: {
                    initFunction: () => 1
                },
                b: {
                    initFunction: () => 100
                }
            }
        })();

        _chai.expect(customState).to.have.property('outer', 102);

        customState.b = 200;

        _chai.expect(customState).to.have.property('outer', 202);

        customState.a = 5;

        _chai.expect(customState).to.have.property('inner', 10);
        _chai.expect(customState).to.have.property('outer', 210);
    });

    _test.it('should track dependencies across different state objects', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 10
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 20);

        source.value = 25;

        _chai.expect(derived).to.have.property('doubled', 50);
    });

    _test.it('should track chained dependencies across multiple state objects', () => {
        const DoublerState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),
            TriplerState = _make(_State, {}, {
                _computed: {
                    tripled () {
                        return this.source.doubled * 3;
                    }
                },
                _state: {
                    source: {}
                }
            }),

            a = SourceState({
                value: 1
            }),
            b = DoublerState({
                source: a
            }),
            c = TriplerState({
                source: b
            });

        _chai.expect(DoublerState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');
        _chai.expect(TriplerState).to.be.a('function');

        _chai.expect(b).to.have.property('doubled', 2);
        _chai.expect(c).to.have.property('tripled', 6);

        a.value = 10;

        _chai.expect(b).to.have.property('doubled', 20);
        _chai.expect(c).to.have.property('tripled', 60);
    });

    _test.it('should track cross-object dependencies for lazy computed properties', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled: {
                        computeFunction () {
                            return this.source.value * 2;
                        },
                        lazy: true
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 5
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 10);

        source.value = 50;

        _chai.expect(derived).to.have.property('doubled', 100);
    });

    _test.it('should track multiple dependents across objects on a single source property', () => {
        const ScalerState = _make(_State, {}, {
                _computed: {
                    scaled () {
                        return this.source.value * this.factor;
                    }
                },
                _state: {
                    factor: {},
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 2
            }),

            firstScaler = ScalerState({
                factor: 10,
                source
            }),
            secondScaler = ScalerState({
                factor: 100,
                source
            });

        _chai.expect(ScalerState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(firstScaler).to.have.property('scaled', 20);
        _chai.expect(secondScaler).to.have.property('scaled', 200);

        source.value = 3;

        _chai.expect(firstScaler).to.have.property('scaled', 30);
        _chai.expect(secondScaler).to.have.property('scaled', 300);
    });

    _test.it('should track multiple computed properties depending on the same cross-object source property', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    },
                    tripled () {
                        return this.source.value * 3;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 4
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 8);
        _chai.expect(derived).to.have.property('tripled', 12);

        source.value = 5;

        _chai.expect(derived).to.have.property('doubled', 10);
        _chai.expect(derived).to.have.property('tripled', 15);
    });

    _test.it('should clean up cross-object dependencies when a dependent is destroyed', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 4
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 8);
        _chai.expect(source._dependentStateMapByPropertyName.value.size).to.equal(1);

        derived.destroy();

        _chai.expect(source._dependentStateMapByPropertyName.value.size).to.equal(0);

        let thrown = false;

        try {
            source.value = 40;
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.false;
        _chai.expect(source).to.have.property('value', 40);
    });

    _test.it('should clean up cross-object dependencies when a source is destroyed', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source ?
                            this.source.value * 2 :
                            -1;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 7
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 14);
        _chai.expect(derived._computedDependencyStateMapByPropertyName.doubled.has(source)).to.be.true;

        source.destroy();

        _chai.expect(derived._computedDependencyStateMapByPropertyName.doubled.has(source)).to.be.false;
    });

    _test.it('should detect circular dependencies across state objects', () => {
        const NodeState = _make(_State, {}, {
                _computed: {
                    value: {
                        computeFunction () {
                            return this.other ?
                                this.other.value + 1 :
                                0;
                        },
                        lazy: true
                    }
                },
                _state: {
                    other: {}
                }
            }),
            ping = NodeState(),
            pong = NodeState();

        ping.other = pong;
        pong.other = ping;

        let thrown = false;

        try {
            ping.value;
        } catch {
            thrown = true;
            // This should be written using chai's `throw` assertion but when I do that, c8 doesn't register the lines covered for some reason.
        }

        _chai.expect(thrown).to.be.true;
    });

    _test.it('should allow a child class to override the computation stack mechanism', () => {
        let pushedComputationCount = 0;

        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    }
                },
                _pushComputation (...args) {
                    pushedComputationCount += 1;

                    return Reflect.apply(_State._pushComputation, this, args);
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 6
            }),

            derived = DerivedState({
                source
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 12);
        _chai.expect(pushedComputationCount > 0).to.be.true;

        source.value = 9;

        _chai.expect(derived).to.have.property('doubled', 18);
    });

    _test.it('should track same-object and cross-object dependencies together', () => {
        const MixedState = _make(_State, {}, {
                _computed: {
                    combined () {
                        return this.local + this.source.value;
                    }
                },
                _state: {
                    local: {},
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            source = SourceState({
                value: 100
            }),

            mixed = MixedState({
                local: 1,
                source
            });

        _chai.expect(MixedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(mixed).to.have.property('combined', 101);

        mixed.local = 5;

        _chai.expect(mixed).to.have.property('combined', 105);

        source.value = 200;

        _chai.expect(mixed).to.have.property('combined', 205);
    });

    _test.it('should reroute tracking when a cross-object source reference is reassigned', () => {
        const DerivedState = _make(_State, {}, {
                _computed: {
                    doubled () {
                        return this.source.value * 2;
                    }
                },
                _state: {
                    source: {}
                }
            }),
            SourceState = _make(_State, {}, {
                _state: {
                    value: {}
                }
            }),

            sourceA = SourceState({
                value: 1
            }),
            sourceB = SourceState({
                value: 100
            }),

            derived = DerivedState({
                source: sourceA
            });

        _chai.expect(DerivedState).to.be.a('function');
        _chai.expect(SourceState).to.be.a('function');

        _chai.expect(derived).to.have.property('doubled', 2);

        derived.source = sourceB;

        _chai.expect(derived).to.have.property('doubled', 200);

        sourceB.value = 7;

        _chai.expect(derived).to.have.property('doubled', 14);

        sourceA.value = 999;

        _chai.expect(derived).to.have.property('doubled', 14);
    });
});
