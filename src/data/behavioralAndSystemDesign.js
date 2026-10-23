export const BEHAVIORAL_PROMPTS = [
  {
    id: 'b-1',
    category: 'Conflict & Collaboration',
    title: 'Technical Disagreement with Senior Colleague',
    prompt: 'Tell me about a time you strongly disagreed with a coworker or lead over a technical or architectural decision. How did you resolve it?',
    interviewerLookingFor: 'Humility, objective data-driven reasoning, ability to "disagree and commit", and constructive team communication without ego.',
    sampleGuidance: {
      situation: 'Our team was redesigning an e-commerce checkout flow. The tech lead favored a complex microservices event-driven choreography, whereas I believed a simpler REST orchestrator suited our 5-person team better.',
      task: 'I needed to resolve the architecture direction without causing friction or stalling our sprint deadline.',
      action: 'I set up a 30-minute whiteboard spike, drafted latency and maintenance cost projections for both approaches, and proposed building a minimal prototype of the core order service.',
      result: 'The data revealed that the simpler orchestrator met all SLA targets while saving 4 weeks of dev time. The team adopted it, shipped on schedule, and had zero outage events during Black Friday.'
    }
  },
  {
    id: 'b-2',
    category: 'Failure & Outages',
    title: 'Critical Production Outage or Bug',
    prompt: 'Describe a situation where a code release broke production or an unexpected incident occurred. How did you handle the emergency and post-mortem?',
    interviewerLookingFor: 'Calm under pressure, systematic root cause analysis, blameless post-mortem culture, and implementing guardrails so the issue never happens again.',
    sampleGuidance: {
      situation: 'A Friday evening release introduced an unindexed query in our user activity service, causing database CPU to spike to 100% and throwing 504 Gateway Timeouts.',
      task: 'My goal was to mitigate customer downtime immediately and identify the root cause.',
      action: 'I initiated an incident Slack room, quickly rolled back the deployment to the previous Docker image, spun up read replicas, and then replicated the query locally to profile execution plans using EXPLAIN ANALYZE.',
      result: 'Downtime was contained to 8 minutes. On Monday, I led a blameless post-mortem, added query performance linters to our CI pipeline, and instituted automated index verification.'
    }
  },
  {
    id: 'b-3',
    category: 'Deadlines & Impact',
    title: 'Tight Deadlines & Scope Management',
    prompt: 'Give an example of a project where you had an aggressive deadline with shifting requirements. How did you deliver successfully?',
    interviewerLookingFor: 'Prioritization, ruthless scope cutting, stakeholder communication, and avoiding burnout or poor code quality.',
    sampleGuidance: {
      situation: 'A enterprise customer deal required multi-factor authentication (MFA) within 3 weeks to sign an annual contract.',
      task: 'We could not build SMS, TOTP, and hardware keys all at once without compromising security.',
      action: 'I negotiated with product to release TOTP (Authenticator app) first as Phase 1, prioritizing core security and auditing, while deferring SMS to Phase 2.',
      result: 'We delivered Phase 1 in 14 days with 100% test coverage. The customer signed the $120k contract on time, and our Phase 2 release rolled out seamlessly.'
    }
  },
  {
    id: 'b-4',
    category: 'Leadership & Initiative',
    title: 'Self-Driven Technical Improvement',
    prompt: 'Tell me about an initiative you took to improve engineering velocity, tooling, or developer experience without being asked.',
    interviewerLookingFor: 'Ownership mindset, proactive problem solving, empathy for fellow engineers, and quantifiable team impact.',
    sampleGuidance: {
      situation: 'Our local integration test suite took 28 minutes to run on PRs, creating a developer bottleneck and blocking deployments.',
      task: 'I wanted to cut CI test times in half to improve team velocity.',
      action: 'During a hack week, I profiled the Jest test runners, parallelized database seeders using testcontainers, and implemented test sharding across GitHub Actions matrix runners.',
      result: 'CI run times plummeted from 28 minutes down to 6.5 minutes (76% reduction). PR turnaround time dropped by 3 hours per engineer, saving an estimated 40 developer hours weekly.'
    }
  }
];

export const SYSTEM_DESIGN_TOPICS = [
  {
    id: 'cap-theorem',
    title: 'CAP Theorem & Distributed Trade-offs',
    summary: 'In any distributed data store, you can only guarantee at most TWO out of Consistency, Availability, and Partition Tolerance.',
    details: [
      {
        concept: 'CP (Consistency + Partition Tolerance)',
        examples: 'MongoDB, Redis Cluster, HBase, CockroachDB',
        tradeoff: 'Prefers correctness over uptime. If a network partition occurs, writes are blocked until consensus is restored to prevent split-brain state.'
      },
      {
        concept: 'AP (Availability + Partition Tolerance)',
        examples: 'Cassandra, DynamoDB, CouchDB',
        tradeoff: 'Prefers uptime over immediate consistency. Systems remain writable on both sides of a partition, yielding Eventual Consistency via vector clocks or last-write-wins.'
      }
    ],
    ruleOfThumb: 'Financial and banking systems demand CP/ACID; social media feeds, metrics, and chat histories thrive on AP/Eventual consistency.'
  },
  {
    id: 'caching-patterns',
    title: 'Caching Strategies & Invalidation',
    summary: 'Proper caching reduces database read load by 80-95% and cuts latency from 50ms to <2ms.',
    details: [
      {
        concept: 'Cache-Aside (Lazy Loading)',
        examples: 'App checks Cache -> On miss, reads DB -> Writes to Cache',
        tradeoff: 'Simple, resilient. Only requested data is cached. Con: Cache miss penalty on first access and risk of stale data if DB is updated directly.'
      },
      {
        concept: 'Write-Through',
        examples: 'App writes to Cache -> Cache synchronously writes to DB',
        tradeoff: 'High consistency; reads are always fresh. Con: Higher write latency since both data layers must commit.'
      },
      {
        concept: 'Write-Behind (Write-Back)',
        examples: 'App writes to Cache -> Cache asynchronously flushes batch to DB',
        tradeoff: 'Blazing fast write throughput. Con: Risk of data loss if cache crashes before dirty writes are persisted.'
      }
    ],
    ruleOfThumb: '"There are only two hard things in Computer Science: cache invalidation and naming things." Always set a sensible TTL (Time To Live) as a safety net.'
  },
  {
    id: 'db-scaling',
    title: 'Database Scaling: Replication vs Sharding',
    summary: 'Scale reads with replicas; scale writes and storage capacity with sharding.',
    details: [
      {
        concept: 'Master-Slave (Read Replicas)',
        examples: 'Single Primary writes, N Secondary read replicas',
        tradeoff: 'Handles 10x read spikes easily. Con: Replication lag means replica reads might be slightly stale right after a write.'
      },
      {
        concept: 'Database Sharding (Horizontal Partitioning)',
        examples: 'Hash-based sharding by User_ID across N databases',
        tradeoff: 'Unlimited write and storage scalability. Con: Cross-shard JOINs, distributed transactions, and re-sharding migrations are notoriously complex.'
      }
    ],
    ruleOfThumb: 'Exhaust vertical scaling, indexing, read replicas, and caching BEFORE introducing horizontal sharding.'
  },
  {
    id: 'rate-limiting',
    title: 'API Rate Limiting Algorithms',
    summary: 'Protect services against DDoS, credential stuffing, and noisy neighbors.',
    details: [
      {
        concept: 'Token Bucket',
        examples: 'Bucket holds tokens; refilled at steady rate $R$; request takes 1 token',
        tradeoff: 'Allows controlled bursts while enforcing an average rate limit. Ideal for modern public APIs (Stripe, GitHub).'
      },
      {
        concept: 'Sliding Window Counter',
        examples: 'Combines current minute and previous minute weights in Redis',
        tradeoff: 'Prevents edge-of-window traffic spikes (e.g. 100 requests at 0:59 and 100 at 1:00) with minimal memory footprint.'
      }
    ],
    ruleOfThumb: 'Store rate limit counters in Redis with atomic INCR and EXPIRE operations.'
  }
];
