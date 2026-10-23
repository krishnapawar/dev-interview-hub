// High-Yield 30-Minute Cram Sheet data with 1-liner definitions, traps, and senior tips

export const CRAM_CHEATS = [
  {
    topic: 'React',
    color: '#00d8ff',
    items: [
      {
        question: 'How does React Reconciliation & Virtual DOM work?',
        definition: 'React creates an in-memory Virtual DOM tree; on state changes, Fiber computes the minimal diff (O(n) heuristic) and batches DOM mutations in the Commit phase.',
        trap: 'Confusing Virtual DOM with Shadow DOM (Shadow DOM is browser encapsulation, Virtual DOM is in-memory JavaScript representation).',
        seniorTip: 'Always mention Fiber architecture enables priority scheduling, abortable work units, and Concurrent React (Suspense, startTransition).'
      },
      {
        question: 'useEffect vs useLayoutEffect',
        definition: '`useEffect` runs asynchronously after the browser paints the screen; `useLayoutEffect` runs synchronously after DOM mutations but BEFORE the browser paints.',
        trap: 'Using `useLayoutEffect` for API calls or non-DOM operations, which blocks visual rendering and causes UI jank.',
        seniorTip: 'Use `useLayoutEffect` only when reading layout geometry (e.g. measuring element height, tooltip positioning) to prevent visual flickering.'
      },
      {
        question: 'React Keys in Lists',
        definition: 'Keys give elements a stable identity between renders, allowing React to match existing DOM nodes across diffs rather than re-mounting everything.',
        trap: 'Using array index as key when list order can change (filtering, sorting, prepending), causing broken component state and input focus bugs.',
        seniorTip: 'Demonstrate understanding that without stable keys, React treats shifted items as updated rather than moved, triggering unnecessary re-renders of child trees.'
      },
      {
        question: 'useMemo vs useCallback',
        definition: '`useMemo` caches the RESULT of an expensive computation; `useCallback` caches the FUNCTION INSTANCE itself across renders.',
        trap: 'Prematurely wrapping primitive operations in `useMemo`—the overhead of dependency array comparison and cache lookup can exceed the calculation cost.',
        seniorTip: 'Only use `useCallback` when passing functions to `React.memo` wrapped child components or as dependencies in `useEffect`.'
      }
    ]
  },
  {
    topic: 'JavaScript',
    color: '#facc15',
    items: [
      {
        question: 'Event Loop, Microtasks vs Macrotasks',
        definition: 'Call stack executes synchronous code; Microtasks (Promises, queueMicrotask) execute immediately after each stack empty; Macrotasks (setTimeout, setInterval, I/O) run on next turn.',
        trap: 'Believing `setTimeout(fn, 0)` executes before a resolved Promise—Promises ALWAYS drain first.',
        seniorTip: 'Explain that Promise microtasks can starve the event loop and UI rendering if scheduled recursively.'
      },
      {
        question: 'Closures & Memory Management',
        definition: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment (variables retained after outer function returns).',
        trap: 'Forgetting that closures retain references in memory and can prevent garbage collection if tied to long-lived objects or global DOM handlers.',
        seniorTip: 'Clean up event listeners, timers, and abort controllers in unmount handlers to avoid closure memory leaks.'
      },
      {
        question: 'Prototypal Inheritance vs ES6 Classes',
        definition: 'JavaScript uses prototype delegation; objects have internal `[[Prototype]]` link. ES6 `class` is syntactic sugar over prototype chains and constructor functions.',
        trap: 'Thinking ES6 classes introduce a distinct object-oriented type system into JavaScript engine.',
        seniorTip: 'Explain `Object.create(proto)` and that method lookup traverses up `__proto__` until `Object.prototype`, then resolves to `null`.'
      }
    ]
  },
  {
    topic: 'Node.js & Backend',
    color: '#22c55e',
    items: [
      {
        question: 'Node.js Concurrency: Libuv & Thread Pool',
        definition: 'Node is single-threaded for JS execution via V8, but offloads blocking I/O, file system operations, and crypto to a 4-thread Libuv C++ thread pool.',
        trap: 'Claiming Node is completely single-threaded (network I/O is non-blocking via OS epoll/kqueue, while file system and crypto use worker threads).',
        seniorTip: 'Mention `UV_THREADPOOL_SIZE` environment variable can be tuned for heavy file or crypto workloads.'
      },
      {
        question: 'Streams & Backpressure',
        definition: 'Streams process data piece-by-piece in chunks rather than buffering the entire file into memory; Backpressure handles fast producers and slow consumers.',
        trap: 'Using `fs.readFile` on large files (e.g. 2GB log file) which exhausts the V8 heap and crashes the process.',
        seniorTip: 'Use `stream.pipeline()` instead of `.pipe()` to automatically handle stream error propagation and cleanup.'
      },
      {
        question: 'Cluster Mode vs Worker Threads',
        definition: 'Cluster forks multiple independent Node processes sharing the same server port (multi-core scaling); Worker Threads share memory in the same process.',
        trap: 'Cluster processes do NOT share memory; use Redis or IPC for shared state/sessions across clustered instances.',
        seniorTip: 'Deploy Node in production behind NGINX or PM2 cluster mode with zero-downtime reloads.'
      }
    ]
  },
  {
    topic: 'SQL & Databases',
    color: '#3b82f6',
    items: [
      {
        question: 'B-Tree Indexing & Performance',
        definition: 'B-Tree indexes maintain sorted tree structure enabling logarithmic O(log N) lookups, range scans, and prefix searches.',
        trap: 'Over-indexing tables slows down `INSERT`, `UPDATE`, and `DELETE` operations because every index must be modified on each write.',
        seniorTip: 'Explain composite index leftmost prefix rule: an index on `(A, B, C)` supports queries on `A` and `(A, B)`, but NOT on `B` alone.'
      },
      {
        question: 'ACID Transactions & Isolation Levels',
        definition: 'Atomicity (all-or-nothing), Consistency (rules preserved), Isolation (concurrent safety), Durability (persisted on disk via WAL).',
        trap: 'Default Read Committed does not protect against Non-repeatable reads or Phantom reads (requires Repeatable Read or Serializable).',
        seniorTip: 'Explain WAL (Write-Ahead Logging): changes are written sequentially to transaction logs before dirty pages are flushed to table files.'
      },
      {
        question: 'Database Normalization vs Denormalization',
        definition: 'Normalization (1NF-3NF) eliminates data redundancy and anomalies; Denormalization deliberately duplicates data to eliminate costly `JOIN`s for read-heavy systems.',
        trap: 'Blindly normalizing everything in high-scale analytical or read-heavy applications leads to excessive JOIN latency.',
        seniorTip: 'In real-world distributed architectures: OLTP is normalized for write consistency, while OLAP/Reporting is denormalized.'
      }
    ]
  },
  {
    topic: 'WebSockets & Real-Time',
    color: '#a855f7',
    items: [
      {
        question: 'WebSocket vs Server-Sent Events (SSE) vs Long Polling',
        definition: 'WebSocket is full-duplex bi-directional TCP connection over a single socket; SSE is unidirectional server-to-client streaming over HTTP/2.',
        trap: 'Using WebSockets when only server-to-client updates are needed (SSE is simpler, reconnects automatically, and works over standard HTTP/2).',
        seniorTip: 'To scale WebSockets horizontally across multiple Node servers, use Redis Pub/Sub adapter to broadcast messages across clusters.'
      }
    ]
  },
  {
    topic: 'Git & DevOps',
    color: '#f97316',
    items: [
      {
        question: 'Git Merge vs Git Rebase',
        definition: '`git merge` creates a new merge commit preserving exact branch timeline; `git rebase` replays commits onto target tip creating a linear history.',
        trap: 'Rebasing shared public branches—rewriting commit SHAs will break teammates\' local repositories.',
        seniorTip: 'Golden rule: Rebase local feature branches before opening a PR; Merge when integrating into shared `main` branch.'
      }
    ]
  }
];
