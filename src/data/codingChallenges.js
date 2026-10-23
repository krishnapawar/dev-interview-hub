export const CODING_CHALLENGES = [
  {
    id: 'debounce',
    title: 'Implement Debounce',
    difficulty: 'Medium',
    category: 'JavaScript / Async',
    timeEstimate: '15 mins',
    tags: ['Closures', 'Async', 'DOM Optimization'],
    description: `Implement a \`debounce\` function that delays invoking the passed function until after \`delay\` milliseconds have elapsed since the last time the debounced function was invoked.
    
Commonly asked for search typeaheads, window resize listeners, and auto-save fields.`,
    starterCode: `/**
 * @param {Function} fn
 * @param {number} delay
 * @return {Function}
 */
function debounce(fn, delay) {
  // Your implementation here
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    solutionCode: `function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}`,
    explanation: `Debouncing enforces that a function not be called again until a certain amount of time has passed without it being called. We maintain a \`timer\` variable in the outer closure. Every time the returned function is called, we cancel any existing timer with \`clearTimeout(timer)\` and schedule a new timer.`,
    testCases: [
      {
        id: 1,
        name: 'Executes once after delay expires',
        testFn: `async (debounce) => {
          let callCount = 0;
          const fn = debounce(() => { callCount++; }, 50);
          fn();
          fn();
          fn();
          await new Promise(r => setTimeout(r, 80));
          return callCount === 1;
        }`,
        expected: 'callCount === 1'
      },
      {
        id: 2,
        name: 'Preserves latest arguments passed',
        testFn: `async (debounce) => {
          let lastArg = null;
          const fn = debounce((x) => { lastArg = x; }, 40);
          fn('first');
          fn('second');
          fn('final');
          await new Promise(r => setTimeout(r, 60));
          return lastArg === 'final';
        }`,
        expected: 'lastArg === "final"'
      }
    ]
  },
  {
    id: 'throttle',
    title: 'Implement Throttle',
    difficulty: 'Medium',
    category: 'JavaScript / Async',
    timeEstimate: '15 mins',
    tags: ['Closures', 'Rate Limiting', 'Timers'],
    description: `Implement a \`throttle\` function that restricts the invocation of the provided function to at most once per \`interval\` milliseconds.

Commonly asked for scroll listeners, infinite scroll triggers, and rate-limiting button clicks.`,
    starterCode: `/**
 * @param {Function} fn
 * @param {number} interval
 * @return {Function}
 */
function throttle(fn, interval) {
  // Your implementation here
}`,
    solutionCode: `function throttle(fn, interval) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, interval);
    }
  };
}`,
    explanation: `Throttling guarantees that the function executes at regular intervals regardless of how many times the trigger is fired. We set a boolean flag \`inThrottle\` during the cooldown period and only allow execution when the flag is false.`,
    testCases: [
      {
        id: 1,
        name: 'Calls immediately on first invocation',
        testFn: `(throttle) => {
          let count = 0;
          const fn = throttle(() => count++, 100);
          fn();
          return count === 1;
        }`,
        expected: 'count === 1'
      },
      {
        id: 2,
        name: 'Suppresses consecutive calls during throttle interval',
        testFn: `async (throttle) => {
          let count = 0;
          const fn = throttle(() => count++, 60);
          fn(); // 1
          fn(); // blocked
          fn(); // blocked
          await new Promise(r => setTimeout(r, 80));
          fn(); // 2
          return count === 2;
        }`,
        expected: 'count === 2'
      }
    ]
  },
  {
    id: 'deep-clone',
    title: 'Deep Clone Object',
    difficulty: 'Medium',
    category: 'JavaScript / Data Structures',
    timeEstimate: '20 mins',
    tags: ['Recursion', 'References', 'Objects'],
    description: `Create a \`deepClone(value)\` function that creates a deep copy of a JavaScript object, array, or primitive without mutating or referencing the original nested structures.
    
Should handle nested objects, arrays, Date, and primitive values.`,
    starterCode: `/**
 * @param {any} value
 * @return {any}
 */
function deepClone(value) {
  // Your implementation here
}`,
    solutionCode: `function deepClone(value, map = new WeakMap()) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value);
  if (map.has(value)) return map.get(value);

  const clone = Array.isArray(value) ? [] : {};
  map.set(value, clone);

  for (const key of Object.keys(value)) {
    clone[key] = deepClone(value[key], map);
  }
  return clone;
}`,
    explanation: `Deep cloning requires recursion for nested objects and arrays. A \`WeakMap\` is used to track visited objects, preventing infinite recursion on circular references. Primitives and dates are handled with specific constructors or returned as-is.`,
    testCases: [
      {
        id: 1,
        name: 'Clones nested object without mutating original',
        testFn: `(deepClone) => {
          const original = { a: 1, b: { c: 2, d: [3, 4] } };
          const copy = deepClone(original);
          copy.b.c = 99;
          copy.b.d.push(5);
          return original.b.c === 2 && original.b.d.length === 2 && copy.b.c === 99;
        }`,
        expected: 'original unaffected'
      },
      {
        id: 2,
        name: 'Clones arrays correctly',
        testFn: `(deepClone) => {
          const arr = [1, [2, 3], { x: 10 }];
          const copy = deepClone(arr);
          copy[1].push(4);
          return arr[1].length === 2 && copy[1].length === 3;
        }`,
        expected: 'nested array copied'
      }
    ]
  },
  {
    id: 'custom-promise-all',
    title: 'Custom Promise.all',
    difficulty: 'Hard',
    category: 'JavaScript / Async',
    timeEstimate: '20 mins',
    tags: ['Promises', 'Concurrency', 'Async'],
    description: `Implement \`promiseAll(promises)\` which takes an array of promises (or values) and returns a single Promise that resolves to an array of results in the same order, or rejects immediately with the first rejection reason.`,
    starterCode: `/**
 * @param {Array<any>} promises
 * @return {Promise<Array<any>>}
 */
function promiseAll(promises) {
  // Your implementation here
}`,
    solutionCode: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!promises || promises.length === 0) {
      return resolve([]);
    }
    const results = new Array(promises.length);
    let completed = 0;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then(val => {
          results[index] = val;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}`,
    explanation: `We wrap the logic inside a \`new Promise\`. If the array is empty, we resolve immediately with \`[]\`. We maintain a \`completed\` counter and an array of results. Using \`Promise.resolve(p)\` handles both promises and raw values. If any promise rejects, \`reject()\` triggers immediately.`,
    testCases: [
      {
        id: 1,
        name: 'Resolves all promises in input order',
        testFn: `async (promiseAll) => {
          const p1 = new Promise(r => setTimeout(() => r('A'), 30));
          const p2 = Promise.resolve('B');
          const p3 = 42;
          const res = await promiseAll([p1, p2, p3]);
          return res[0] === 'A' && res[1] === 'B' && res[2] === 42;
        }`,
        expected: '["A", "B", 42]'
      },
      {
        id: 2,
        name: 'Rejects fast on first failure',
        testFn: `async (promiseAll) => {
          const p1 = new Promise(r => setTimeout(() => r(1), 100));
          const p2 = Promise.reject(new Error('Boom'));
          try {
            await promiseAll([p1, p2]);
            return false;
          } catch (e) {
            return e.message === 'Boom';
          }
        }`,
        expected: 'Rejection error "Boom"'
      }
    ]
  },
  {
    id: 'flatten-array',
    title: 'Flatten Nested Array',
    difficulty: 'Easy',
    category: 'JavaScript / Algorithms',
    timeEstimate: '10 mins',
    tags: ['Recursion', 'Arrays', 'ES6'],
    description: `Write a function \`flatten(arr, depth = 1)\` that flattens a multi-dimensional array up to the specified \`depth\`. (Emulates \`Array.prototype.flat\`).`,
    starterCode: `/**
 * @param {Array} arr
 * @param {number} depth
 * @return {Array}
 */
function flatten(arr, depth = 1) {
  // Your implementation here
}`,
    solutionCode: `function flatten(arr, depth = 1) {
  if (depth <= 0) return arr.slice();
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
    explanation: `We iterate through the array. If an element is an array and \`depth > 0\`, we recursively flatten it with \`depth - 1\` and spread its results. Otherwise, we push the item as-is.`,
    testCases: [
      {
        id: 1,
        name: 'Flattens 1 level by default',
        testFn: `(flatten) => {
          const res = flatten([1, [2, 3], [4, [5]]]);
          return JSON.stringify(res) === JSON.stringify([1, 2, 3, 4, [5]]);
        }`,
        expected: '[1, 2, 3, 4, [5]]'
      },
      {
        id: 2,
        name: 'Flattens up to specified depth',
        testFn: `(flatten) => {
          const res = flatten([1, [2, [3, [4]]]], 2);
          return JSON.stringify(res) === JSON.stringify([1, 2, 3, [4]]);
        }`,
        expected: '[1, 2, 3, [4]]'
      }
    ]
  },
  {
    id: 'curry',
    title: 'Function Currying',
    difficulty: 'Medium',
    category: 'JavaScript / Functional',
    timeEstimate: '15 mins',
    tags: ['Functional Programming', 'Arity', 'Closures'],
    description: `Implement a \`curry(fn)\` function that transforms a function of arity $N$ into a sequence of functions that accept arguments one by one or in chunks until all required arguments are collected.`,
    starterCode: `/**
 * @param {Function} fn
 * @return {Function}
 */
function curry(fn) {
  // Your implementation here
}`,
    solutionCode: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}`,
    explanation: `\`fn.length\` gives the number of parameters the original function expects. In each invocation, we check if \`args.length >= fn.length\`. If yes, we invoke \`fn\`. If not, we return a new function that appends new arguments to the existing ones.`,
    testCases: [
      {
        id: 1,
        name: 'Supports single and multiple argument application',
        testFn: `(curry) => {
          const sum = (a, b, c) => a + b + c;
          const curried = curry(sum);
          return curried(1)(2)(3) === 6 && curried(1, 2)(3) === 6 && curried(1)(2, 3) === 6;
        }`,
        expected: 'returns 6 for all combinations'
      }
    ]
  },
  {
    id: 'memoize',
    title: 'Memoize Function',
    difficulty: 'Easy',
    category: 'JavaScript / Optimization',
    timeEstimate: '10 mins',
    tags: ['Caching', 'Performance', 'Closures'],
    description: `Implement \`memoize(fn)\` that caches the return values of expensive function calls based on its arguments. Consecutive calls with identical arguments should return the cached result.`,
    starterCode: `/**
 * @param {Function} fn
 * @return {Function}
 */
function memoize(fn) {
  // Your implementation here
}`,
    solutionCode: `function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    explanation: `A \`Map\` stores cached results keyed by the serialized arguments. If a matching key exists, the cached result is returned immediately without re-executing the original function.`,
    testCases: [
      {
        id: 1,
        name: 'Returns correct value and prevents re-execution',
        testFn: `(memoize) => {
          let executions = 0;
          const square = memoize((n) => { executions++; return n * n; });
          const a = square(5);
          const b = square(5);
          const c = square(10);
          return a === 25 && b === 25 && c === 100 && executions === 2;
        }`,
        expected: 'executions === 2'
      }
    ]
  },
  {
    id: 'two-sum',
    title: 'Two Sum (O(n) Optimal)',
    difficulty: 'Easy',
    category: 'Algorithms / Data Structures',
    timeEstimate: '10 mins',
    tags: ['Hash Map', 'Arrays', 'Optimization'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\` in $O(n)$ time complexity.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your implementation here
}`,
    solutionCode: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    explanation: `By storing visited numbers and their indices in a \`Map\`, we can check whether the required complement (\`target - nums[i]\`) has already been seen in $O(1)$ time, yielding an optimal $O(n)$ total runtime.`,
    testCases: [
      {
        id: 1,
        name: 'Finds pair indices correctly',
        testFn: `(twoSum) => {
          const res = twoSum([2, 7, 11, 15], 9);
          return res[0] === 0 && res[1] === 1;
        }`,
        expected: '[0, 1]'
      },
      {
        id: 2,
        name: 'Handles duplicate values and non-sequential indices',
        testFn: `(twoSum) => {
          const res = twoSum([3, 2, 4], 6);
          return res[0] === 1 && res[1] === 2;
        }`,
        expected: '[1, 2]'
      }
    ]
  },
  {
    id: 'lru-cache',
    title: 'LRU (Least Recently Used) Cache',
    difficulty: 'Hard',
    category: 'Data Structures / System Design',
    timeEstimate: '25 mins',
    tags: ['Map', 'Design', 'Caching'],
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.
    
Implement the \`LRUCache\` class:
- \`new LRUCache(capacity)\` initializes the LRU cache with positive size \`capacity\`.
- \`get(key)\` returns the value of the \`key\` if the key exists, otherwise returns \`-1\`.
- \`put(key, value)\` updates the value of the \`key\` if it exists. Otherwise, add the key-value pair. If the number of keys exceeds capacity, evict the least recently used key.`,
    starterCode: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // Your implementation
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // Your implementation
  }
}`,
    solutionCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    // Refresh position to most recently used
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // First key in Map iterator is the oldest/least recently used
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
    explanation: `JavaScript's \`Map\` preserves insertion order. To update an item's freshness upon access or replacement, we delete it and re-insert it. When capacity is exceeded, \`this.cache.keys().next().value\` returns the oldest key in $O(1)$ time.`,
    testCases: [
      {
        id: 1,
        name: 'Evicts oldest item when capacity exceeded',
        testFn: `(LRUCache) => {
          const lru = new LRUCache(2);
          lru.put(1, 1);
          lru.put(2, 2);
          const v1 = lru.get(1); // 1, makes 1 recently used
          lru.put(3, 3); // evicts 2
          const v2 = lru.get(2); // -1 (evicted)
          const v3 = lru.get(3); // 3
          return v1 === 1 && v2 === -1 && v3 === 3;
        }`,
        expected: 'evicts key 2, retains key 1 and 3'
      }
    ]
  }
];
