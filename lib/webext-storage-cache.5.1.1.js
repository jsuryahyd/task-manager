var webextStorageCache = (function () {
	'use strict';

	function NestedProxy(target) {
		return new Proxy(target, {
			get(target, prop) {
				if (typeof target[prop] !== 'function') {
					return new NestedProxy(target[prop]);
				}
				return (...arguments_) =>
					new Promise((resolve, reject) => {
						target[prop](...arguments_, result => {
							if (chrome.runtime.lastError) {
								reject(new Error(chrome.runtime.lastError.message));
							} else {
								resolve(result);
							}
						});
					});
			},
		});
	}
	const chromeP = globalThis.chrome && new NestedProxy(globalThis.chrome);

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var microMemoize = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
	    module.exports = factory() ;
	})(commonjsGlobal, (function () {    var DEFAULT_OPTIONS_KEYS = {
	        isEqual: true,
	        isMatchingKey: true,
	        isPromise: true,
	        maxSize: true,
	        onCacheAdd: true,
	        onCacheChange: true,
	        onCacheHit: true,
	        transformKey: true,
	    };
	    var slice = Array.prototype.slice;
	    function cloneArray(arrayLike) {
	        var length = arrayLike.length;
	        if (!length) {
	            return [];
	        }
	        if (length === 1) {
	            return [arrayLike[0]];
	        }
	        if (length === 2) {
	            return [arrayLike[0], arrayLike[1]];
	        }
	        if (length === 3) {
	            return [arrayLike[0], arrayLike[1], arrayLike[2]];
	        }
	        return slice.call(arrayLike, 0);
	    }
	    function getCustomOptions(options) {
	        var customOptions = {};
	        for (var key in options) {
	            if (!DEFAULT_OPTIONS_KEYS[key]) {
	                customOptions[key] = options[key];
	            }
	        }
	        return customOptions;
	    }
	    function isMemoized(fn) {
	        return (typeof fn === 'function' && fn.isMemoized);
	    }
	    function isSameValueZero(object1, object2) {
	        return object1 === object2 || (object1 !== object1 && object2 !== object2);
	    }
	    function mergeOptions(existingOptions, newOptions) {
	        var target = {};
	        for (var key in existingOptions) {
	            target[key] = existingOptions[key];
	        }
	        for (var key in newOptions) {
	            target[key] = newOptions[key];
	        }
	        return target;
	    }
	    var Cache =  (function () {
	        function Cache(options) {
	            this.keys = [];
	            this.values = [];
	            this.options = options;
	            var isMatchingKeyFunction = typeof options.isMatchingKey === 'function';
	            if (isMatchingKeyFunction) {
	                this.getKeyIndex = this._getKeyIndexFromMatchingKey;
	            }
	            else if (options.maxSize > 1) {
	                this.getKeyIndex = this._getKeyIndexForMany;
	            }
	            else {
	                this.getKeyIndex = this._getKeyIndexForSingle;
	            }
	            this.canTransformKey = typeof options.transformKey === 'function';
	            this.shouldCloneArguments = this.canTransformKey || isMatchingKeyFunction;
	            this.shouldUpdateOnAdd = typeof options.onCacheAdd === 'function';
	            this.shouldUpdateOnChange = typeof options.onCacheChange === 'function';
	            this.shouldUpdateOnHit = typeof options.onCacheHit === 'function';
	        }
	        Object.defineProperty(Cache.prototype, "size", {
	            get: function () {
	                return this.keys.length;
	            },
	            enumerable: false,
	            configurable: true
	        });
	        Object.defineProperty(Cache.prototype, "snapshot", {
	            get: function () {
	                return {
	                    keys: cloneArray(this.keys),
	                    size: this.size,
	                    values: cloneArray(this.values),
	                };
	            },
	            enumerable: false,
	            configurable: true
	        });
	        Cache.prototype._getKeyIndexFromMatchingKey = function (keyToMatch) {
	            var _a = this.options, isMatchingKey = _a.isMatchingKey, maxSize = _a.maxSize;
	            var keys = this.keys;
	            var keysLength = keys.length;
	            if (!keysLength) {
	                return -1;
	            }
	            if (isMatchingKey(keys[0], keyToMatch)) {
	                return 0;
	            }
	            if (maxSize > 1) {
	                for (var index = 1; index < keysLength; index++) {
	                    if (isMatchingKey(keys[index], keyToMatch)) {
	                        return index;
	                    }
	                }
	            }
	            return -1;
	        };
	        Cache.prototype._getKeyIndexForMany = function (keyToMatch) {
	            var isEqual = this.options.isEqual;
	            var keys = this.keys;
	            var keysLength = keys.length;
	            if (!keysLength) {
	                return -1;
	            }
	            if (keysLength === 1) {
	                return this._getKeyIndexForSingle(keyToMatch);
	            }
	            var keyLength = keyToMatch.length;
	            var existingKey;
	            var argIndex;
	            if (keyLength > 1) {
	                for (var index = 0; index < keysLength; index++) {
	                    existingKey = keys[index];
	                    if (existingKey.length === keyLength) {
	                        argIndex = 0;
	                        for (; argIndex < keyLength; argIndex++) {
	                            if (!isEqual(existingKey[argIndex], keyToMatch[argIndex])) {
	                                break;
	                            }
	                        }
	                        if (argIndex === keyLength) {
	                            return index;
	                        }
	                    }
	                }
	            }
	            else {
	                for (var index = 0; index < keysLength; index++) {
	                    existingKey = keys[index];
	                    if (existingKey.length === keyLength &&
	                        isEqual(existingKey[0], keyToMatch[0])) {
	                        return index;
	                    }
	                }
	            }
	            return -1;
	        };
	        Cache.prototype._getKeyIndexForSingle = function (keyToMatch) {
	            var keys = this.keys;
	            if (!keys.length) {
	                return -1;
	            }
	            var existingKey = keys[0];
	            var length = existingKey.length;
	            if (keyToMatch.length !== length) {
	                return -1;
	            }
	            var isEqual = this.options.isEqual;
	            if (length > 1) {
	                for (var index = 0; index < length; index++) {
	                    if (!isEqual(existingKey[index], keyToMatch[index])) {
	                        return -1;
	                    }
	                }
	                return 0;
	            }
	            return isEqual(existingKey[0], keyToMatch[0]) ? 0 : -1;
	        };
	        Cache.prototype.orderByLru = function (key, value, startingIndex) {
	            var keys = this.keys;
	            var values = this.values;
	            var currentLength = keys.length;
	            var index = startingIndex;
	            while (index--) {
	                keys[index + 1] = keys[index];
	                values[index + 1] = values[index];
	            }
	            keys[0] = key;
	            values[0] = value;
	            var maxSize = this.options.maxSize;
	            if (currentLength === maxSize && startingIndex === currentLength) {
	                keys.pop();
	                values.pop();
	            }
	            else if (startingIndex >= maxSize) {
	                keys.length = values.length = maxSize;
	            }
	        };
	        Cache.prototype.updateAsyncCache = function (memoized) {
	            var _this = this;
	            var _a = this.options, onCacheChange = _a.onCacheChange, onCacheHit = _a.onCacheHit;
	            var firstKey = this.keys[0];
	            var firstValue = this.values[0];
	            this.values[0] = firstValue.then(function (value) {
	                if (_this.shouldUpdateOnHit) {
	                    onCacheHit(_this, _this.options, memoized);
	                }
	                if (_this.shouldUpdateOnChange) {
	                    onCacheChange(_this, _this.options, memoized);
	                }
	                return value;
	            }, function (error) {
	                var keyIndex = _this.getKeyIndex(firstKey);
	                if (keyIndex !== -1) {
	                    _this.keys.splice(keyIndex, 1);
	                    _this.values.splice(keyIndex, 1);
	                }
	                throw error;
	            });
	        };
	        return Cache;
	    }());
	    function createMemoizedFunction(fn, options) {
	        if (options === void 0) { options = {}; }
	        if (isMemoized(fn)) {
	            return createMemoizedFunction(fn.fn, mergeOptions(fn.options, options));
	        }
	        if (typeof fn !== 'function') {
	            throw new TypeError('You must pass a function to `memoize`.');
	        }
	        var _a = options.isEqual, isEqual = _a === void 0 ? isSameValueZero : _a, isMatchingKey = options.isMatchingKey, _b = options.isPromise, isPromise = _b === void 0 ? false : _b, _c = options.maxSize, maxSize = _c === void 0 ? 1 : _c, onCacheAdd = options.onCacheAdd, onCacheChange = options.onCacheChange, onCacheHit = options.onCacheHit, transformKey = options.transformKey;
	        var normalizedOptions = mergeOptions({
	            isEqual: isEqual,
	            isMatchingKey: isMatchingKey,
	            isPromise: isPromise,
	            maxSize: maxSize,
	            onCacheAdd: onCacheAdd,
	            onCacheChange: onCacheChange,
	            onCacheHit: onCacheHit,
	            transformKey: transformKey,
	        }, getCustomOptions(options));
	        var cache = new Cache(normalizedOptions);
	        var keys = cache.keys, values = cache.values, canTransformKey = cache.canTransformKey, shouldCloneArguments = cache.shouldCloneArguments, shouldUpdateOnAdd = cache.shouldUpdateOnAdd, shouldUpdateOnChange = cache.shouldUpdateOnChange, shouldUpdateOnHit = cache.shouldUpdateOnHit;
	        var memoized = function () {
	            var key = shouldCloneArguments
	                ? cloneArray(arguments)
	                : arguments;
	            if (canTransformKey) {
	                key = transformKey(key);
	            }
	            var keyIndex = keys.length ? cache.getKeyIndex(key) : -1;
	            if (keyIndex !== -1) {
	                if (shouldUpdateOnHit) {
	                    onCacheHit(cache, normalizedOptions, memoized);
	                }
	                if (keyIndex) {
	                    cache.orderByLru(keys[keyIndex], values[keyIndex], keyIndex);
	                    if (shouldUpdateOnChange) {
	                        onCacheChange(cache, normalizedOptions, memoized);
	                    }
	                }
	            }
	            else {
	                var newValue = fn.apply(this, arguments);
	                var newKey = shouldCloneArguments
	                    ? key
	                    : cloneArray(arguments);
	                cache.orderByLru(newKey, newValue, keys.length);
	                if (isPromise) {
	                    cache.updateAsyncCache(memoized);
	                }
	                if (shouldUpdateOnAdd) {
	                    onCacheAdd(cache, normalizedOptions, memoized);
	                }
	                if (shouldUpdateOnChange) {
	                    onCacheChange(cache, normalizedOptions, memoized);
	                }
	            }
	            return values[0];
	        };
	        memoized.cache = cache;
	        memoized.fn = fn;
	        memoized.isMemoized = true;
	        memoized.options = normalizedOptions;
	        return memoized;
	    }
	    return createMemoizedFunction;
	}));
	});

	function isCurrentPathname(path) {
	    if (!path) {
	        return false;
	    }
	    try {
	        const { pathname } = new URL(path, location.origin);
	        return pathname === location.pathname;
	    }
	    catch {
	        return false;
	    }
	}
	function getManifest(_version) {
	    return globalThis.chrome?.runtime?.getManifest?.();
	}
	function once(function_) {
	    let result;
	    return () => {
	        if (typeof result === 'undefined') {
	            result = function_();
	        }
	        return result;
	    };
	}
	const isExtensionContext = once(() => typeof globalThis.chrome?.extension === 'object');
	const isBackgroundPage = once(() => {
	    const manifest = getManifest();
	    if (manifest
	        && isCurrentPathname(manifest.background_page || manifest.background?.page)) {
	        return true;
	    }
	    return Boolean(manifest?.background?.scripts
	        && isCurrentPathname('/_generated_background_page.html'));
	});

	const converters = {
		days: value => value * 864e5,
		hours: value => value * 36e5,
		minutes: value => value * 6e4,
		seconds: value => value * 1e3,
		milliseconds: value => value,
		microseconds: value => value / 1e3,
		nanoseconds: value => value / 1e6
	};
	function toMilliseconds(timeDescriptor) {
		let totalMilliseconds = 0;
		for (const [key, value] of Object.entries(timeDescriptor)) {
			if (typeof value !== 'number') {
				throw new TypeError(`Expected a \`number\` for key \`${key}\`, got \`${value}\` (${typeof value})`);
			}
			const converter = converters[key];
			if (!converter) {
				throw new Error(`Unsupported time key: ${key}`);
			}
			totalMilliseconds += converter(value);
		}
		return totalMilliseconds;
	}

	const cacheDefault = { days: 30 };
	function timeInTheFuture(time) {
	    return Date.now() + toMilliseconds(time);
	}
	async function has(key) {
	    return (await _get(key, false)) !== undefined;
	}
	async function _get(key, remove) {
	    const internalKey = `cache:${key}`;
	    const storageData = await chromeP.storage.local.get(internalKey);
	    const cachedItem = storageData[internalKey];
	    if (cachedItem === undefined) {
	        return;
	    }
	    if (Date.now() > cachedItem.maxAge) {
	        if (remove) {
	            await chromeP.storage.local.remove(internalKey);
	        }
	        return;
	    }
	    return cachedItem;
	}
	async function get(key) {
	    const cacheItem = await _get(key, true);
	    return cacheItem === null || cacheItem === void 0 ? void 0 : cacheItem.data;
	}
	async function set(key, value, maxAge = cacheDefault) {
	    if (arguments.length < 2) {
	        throw new TypeError('Expected a value as the second argument');
	    }
	    if (typeof value === 'undefined') {
	        await delete_(key);
	    }
	    else {
	        const internalKey = `cache:${key}`;
	        await chromeP.storage.local.set({
	            [internalKey]: {
	                data: value,
	                maxAge: timeInTheFuture(maxAge),
	            },
	        });
	    }
	    return value;
	}
	async function delete_(key) {
	    const internalKey = `cache:${key}`;
	    return chromeP.storage.local.remove(internalKey);
	}
	async function deleteWithLogic(logic) {
	    var _a;
	    const wholeCache = (await chromeP.storage.local.get());
	    const removableItems = [];
	    for (const [key, value] of Object.entries(wholeCache)) {
	        if (key.startsWith('cache:') && ((_a = logic === null || logic === void 0 ? void 0 : logic(value)) !== null && _a !== void 0 ? _a : true)) {
	            removableItems.push(key);
	        }
	    }
	    if (removableItems.length > 0) {
	        await chromeP.storage.local.remove(removableItems);
	    }
	}
	async function deleteExpired() {
	    await deleteWithLogic(cachedItem => Date.now() > cachedItem.maxAge);
	}
	async function clear() {
	    await deleteWithLogic();
	}
	function function_(getter, { cacheKey, maxAge = { days: 30 }, staleWhileRevalidate = { days: 0 }, shouldRevalidate, } = {}) {
	    const getSet = async (key, args) => {
	        const freshValue = await getter(...args);
	        if (freshValue === undefined) {
	            await delete_(key);
	            return;
	        }
	        const milliseconds = toMilliseconds(maxAge) + toMilliseconds(staleWhileRevalidate);
	        return set(key, freshValue, { milliseconds });
	    };
	    return Object.assign(microMemoize((async (...args) => {
	        const userKey = cacheKey ? cacheKey(args) : args[0];
	        const cachedItem = await _get(userKey, false);
	        if (cachedItem === undefined || (shouldRevalidate === null || shouldRevalidate === void 0 ? void 0 : shouldRevalidate(cachedItem.data))) {
	            return getSet(userKey, args);
	        }
	        if (timeInTheFuture(staleWhileRevalidate) > cachedItem.maxAge) {
	            setTimeout(getSet, 0, userKey, args);
	        }
	        return cachedItem.data;
	    })), {
	        fresh: (async (...args) => {
	            const userKey = cacheKey ? cacheKey(args) : args[0];
	            return getSet(userKey, args);
	        }),
	    });
	}
	const cache = {
	    has,
	    get,
	    set,
	    clear,
	    function: function_,
	    delete: delete_,
	};
	function init() {
	    if (isExtensionContext()) {
	        globalThis.webextStorageCache = cache;
	    }
	    if (!isBackgroundPage()) {
	        return;
	    }
	    if (chrome.alarms) {
	        chrome.alarms.create('webext-storage-cache', {
	            delayInMinutes: 1,
	            periodInMinutes: 60 * 24,
	        });
	        let lastRun = 0;
	        chrome.alarms.onAlarm.addListener(alarm => {
	            if (alarm.name === 'webext-storage-cache' && lastRun < Date.now() - 1000) {
	                lastRun = Date.now();
	                void deleteExpired();
	            }
	        });
	    }
	    else {
	        setTimeout(deleteExpired, 60000);
	        setInterval(deleteExpired, 1000 * 3600 * 24);
	    }
	}
	init();

	return cache;

}());
