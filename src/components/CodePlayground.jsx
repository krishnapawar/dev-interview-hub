import { useState, useEffect, useRef } from 'react'
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  Terminal,
  Code2,
  Layers,
  Search,
  Clock,
  ChevronRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  Zap,
} from 'lucide-react'
import { CODING_CHALLENGES } from '../data/codingChallenges'
import { playSound } from '../utils/audio'

const STORAGE_KEY_PLAYGROUND = 'devprep_coding_solutions_v1'

function getSavedSolutions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYGROUND)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function CodePlayground({ soundEnabled = true }) {
  const [challenges, setChallenges] = useState(CODING_CHALLENGES)
  const [selectedId, setSelectedId] = useState(CODING_CHALLENGES[0].id)
  const [isScratchpad, setIsScratchpad] = useState(false)
  const [savedSolutions, setSavedSolutions] = useState(getSavedSolutions)

  // Current active challenge
  const activeChallenge = challenges.find(c => c.id === selectedId) || challenges[0]

  // Code state
  const [code, setCode] = useState(() => {
    return savedSolutions[activeChallenge.id] || activeChallenge.starterCode
  })
  const [scratchpadCode, setScratchpadCode] = useState(`// Freeform JavaScript Sandbox
// Write and execute any code here:

const users = [
  { id: 1, name: 'Alice', role: 'Fullstack' },
  { id: 2, name: 'Bob', role: 'DevOps' },
  { id: 3, name: 'Charlie', role: 'Frontend' }
];

const names = users.map(u => u.name);
console.log('User names:', names);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fib(7) =', fibonacci(7));
`)

  const [activeTab, setActiveTab] = useState('tests') // 'tests' | 'console'
  const [consoleOutput, setConsoleOutput] = useState([])
  const [testResults, setTestResults] = useState([])
  const [executionTime, setExecutionTime] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('All')

  // When changing challenge
  useEffect(() => {
    if (!isScratchpad) {
      setCode(savedSolutions[activeChallenge.id] || activeChallenge.starterCode)
      setTestResults([])
      setConsoleOutput([])
      setShowSolution(false)
      setExecutionTime(null)
    }
  }, [activeChallenge.id, isScratchpad])

  // Save changes to localStorage
  function handleCodeChange(newCode) {
    if (isScratchpad) {
      setScratchpadCode(newCode)
    } else {
      setCode(newCode)
      const updated = { ...savedSolutions, [activeChallenge.id]: newCode }
      setSavedSolutions(updated)
      try {
        localStorage.setItem(STORAGE_KEY_PLAYGROUND, JSON.stringify(updated))
      } catch {}
    }
  }

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to Run
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        runCode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, scratchpadCode, isScratchpad, activeChallenge])

  // Reset to starter code
  function handleReset() {
    playSound('click', soundEnabled)
    if (isScratchpad) {
      setScratchpadCode(`console.log("Hello from JavaScript Playground!");`)
    } else {
      handleCodeChange(activeChallenge.starterCode)
    }
    setTestResults([])
    setConsoleOutput([])
    setExecutionTime(null)
  }

  // Execute Code safely
  async function runCode() {
    setIsRunning(true)
    playSound('click', soundEnabled)
    const logs = []
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args) => {
      logs.push({ type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') })
      originalLog.apply(console, args)
    }
    console.warn = (...args) => {
      logs.push({ type: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') })
      originalWarn.apply(console, args)
    }
    console.error = (...args) => {
      logs.push({ type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') })
      originalError.apply(console, args)
    }

    const startTime = performance.now()

    if (isScratchpad) {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(scratchpadCode)
        const res = fn()
        if (res !== undefined) {
          logs.push({ type: 'result', message: `Returned: ${typeof res === 'object' ? JSON.stringify(res, null, 2) : res}` })
        }
      } catch (err) {
        logs.push({ type: 'error', message: String(err.stack || err.message) })
      } finally {
        console.log = originalLog
        console.warn = originalWarn
        console.error = originalError
      }
      const endTime = performance.now()
      setExecutionTime(Math.round((endTime - startTime) * 10) / 10)
      setConsoleOutput(logs)
      setActiveTab('console')
      setIsRunning(false)
      return
    }

    // Run Challenge with Test Cases
    const currentCode = code
    const results = []
    let allPassed = true

    try {
      // Evaluate user code in scoped function
      // eslint-disable-next-line no-new-func
      const evalScope = new Function(`
        ${currentCode}
        return {
          fn: typeof ${activeChallenge.id.replace(/-/g, '_')} !== 'undefined' 
              ? ${activeChallenge.id.replace(/-/g, '_')} 
              : (typeof debounce !== 'undefined' ? debounce 
              : (typeof throttle !== 'undefined' ? throttle 
              : (typeof deepClone !== 'undefined' ? deepClone 
              : (typeof promiseAll !== 'undefined' ? promiseAll 
              : (typeof flatten !== 'undefined' ? flatten 
              : (typeof curry !== 'undefined' ? curry 
              : (typeof memoize !== 'undefined' ? memoize 
              : (typeof twoSum !== 'undefined' ? twoSum 
              : (typeof LRUCache !== 'undefined' ? LRUCache : null)))))))))
        };
      `)

      const { fn: userFunc } = evalScope()

      if (!userFunc) {
        throw new Error(`Target function or class was not defined in the editor. Make sure your function name matches the prompt.`)
      }

      for (const t of activeChallenge.testCases) {
        try {
          // eslint-disable-next-line no-new-func
          const testRunner = new Function(`
            const testFn = ${t.testFn};
            return testFn;
          `)()

          const pass = await testRunner(userFunc)
          results.push({
            id: t.id,
            name: t.name,
            expected: t.expected,
            passed: Boolean(pass),
            error: null
          })
          if (!pass) allPassed = false
        } catch (testErr) {
          results.push({
            id: t.id,
            name: t.name,
            expected: t.expected,
            passed: false,
            error: testErr.message
          })
          allPassed = false
        }
      }
    } catch (syntaxOrExecErr) {
      allPassed = false
      logs.push({ type: 'error', message: syntaxOrExecErr.message })
      results.push({
        id: 'runtime-err',
        name: 'Syntax / Compilation',
        expected: 'Valid executable code',
        passed: false,
        error: syntaxOrExecErr.message
      })
    } finally {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }

    const endTime = performance.now()
    setExecutionTime(Math.round((endTime - startTime) * 10) / 10)
    setConsoleOutput(logs)
    setTestResults(results)
    setActiveTab(results.length > 0 ? 'tests' : 'console')
    setIsRunning(false)

    if (allPassed && results.length > 0) {
      playSound('success', soundEnabled)
    } else {
      playSound('click', soundEnabled)
    }
  }

  // Filter challenges
  const filteredChallenges = challenges.filter(c => {
    const matchesDiff = difficultyFilter === 'All' || c.difficulty === difficultyFilter
    const matchesSearch = !search.trim() || `${c.title} ${c.category} ${c.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    return matchesDiff && matchesSearch
  })

  return (
    <div className="playground-wrapper">
      {/* Top Header */}
      <div className="playground-header">
        <div className="playground-title-area">
          <div className="playground-badge">
            <Zap size={14} /> LIVE HANDS-ON INTERVIEW CHALLENGES
          </div>
          <h2>Interactive Code Playground & Challenges</h2>
          <p>
            Write, test, and validate core JavaScript algorithms and utility functions commonly tested in FAANG & startup coding rounds.
          </p>
        </div>

        <div className="playground-mode-toggle">
          <button
            className={`mode-btn ${!isScratchpad ? 'active' : ''}`}
            onClick={() => setIsScratchpad(false)}
          >
            <Layers size={14} /> Challenge Mode ({challenges.length})
          </button>
          <button
            className={`mode-btn ${isScratchpad ? 'active' : ''}`}
            onClick={() => setIsScratchpad(true)}
          >
            <Terminal size={14} /> Freeform JS Sandbox
          </button>
        </div>
      </div>

      {/* Main Grid: Left challenges drawer, Center editor, Right console/tests */}
      <div className="playground-main-grid">
        {/* Left Side: Challenge Picker (when in challenge mode) */}
        {!isScratchpad && (
          <aside className="challenge-sidebar custom-scrollbar">
            <div className="challenge-sidebar-head">
              <div className="challenge-search-box">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Filter challenges..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="challenge-diff-chips">
                {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    className={`diff-chip ${difficultyFilter === d ? 'active' : ''} ${d.toLowerCase()}`}
                    onClick={() => setDifficultyFilter(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="challenge-list">
              {filteredChallenges.map(c => {
                const isSelected = c.id === selectedId
                const isSolved = savedSolutions[c.id] && testResults.length > 0 && testResults.every(r => r.passed)
                return (
                  <button
                    key={c.id}
                    className={`challenge-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="challenge-card-top">
                      <span className={`diff-tag ${c.difficulty.toLowerCase()}`}>
                        {c.difficulty}
                      </span>
                      <span className="time-tag">
                        <Clock size={11} /> {c.timeEstimate}
                      </span>
                      {isSolved && (
                        <CheckCircle2 size={14} className="text-emerald-400 ml-auto" />
                      )}
                    </div>
                    <div className="challenge-card-title">{c.title}</div>
                    <div className="challenge-card-tags">
                      {c.tags.slice(0, 2).map(t => (
                        <span key={t} className="tag-pill">{t}</span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* Center: Editor & Challenge Details */}
        <div className={`playground-center-column ${isScratchpad ? 'full-width' : ''}`}>
          {/* Challenge Description Card */}
          {!isScratchpad && (
            <div className="challenge-brief-card">
              <div className="brief-head">
                <div>
                  <span className={`diff-pill ${activeChallenge.difficulty.toLowerCase()}`}>
                    {activeChallenge.difficulty}
                  </span>
                  <span className="brief-cat">{activeChallenge.category}</span>
                </div>
                <button
                  className="solution-toggle-btn"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showSolution ? 'Hide Solution' : 'Reveal Solution'}</span>
                </button>
              </div>

              <h3 className="brief-title">{activeChallenge.title}</h3>
              <p className="brief-desc">{activeChallenge.description}</p>

              {/* Solution Accordion */}
              {showSolution && (
                <div className="solution-panel">
                  <div className="solution-head">
                    <Sparkles size={14} />
                    <strong>Optimal Benchmark Solution</strong>
                  </div>
                  <pre className="solution-code">
                    <code>{activeChallenge.solutionCode}</code>
                  </pre>
                  <p className="solution-expl">
                    <strong>Explanation:</strong> {activeChallenge.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Interactive Code Editor Box */}
          <div className="editor-container">
            <div className="editor-toolbar">
              <div className="editor-title">
                <Code2 size={15} />
                <span>{isScratchpad ? 'JavaScript Sandbox (ES6+)' : `${activeChallenge.title} (solution.js)`}</span>
              </div>

              <div className="editor-actions">
                <button
                  className="editor-btn"
                  onClick={handleReset}
                  title="Reset to starter template"
                >
                  <RotateCcw size={13} /> Reset
                </button>

                <button
                  className="run-btn"
                  onClick={runCode}
                  disabled={isRunning}
                  title="Run Code (Cmd + Enter)"
                >
                  <Play size={14} />
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  <kbd>⌘↵</kbd>
                </button>
              </div>
            </div>

            <div className="code-editor-wrapper">
              <textarea
                className="code-textarea custom-scrollbar"
                value={isScratchpad ? scratchpadCode : code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="Write your JavaScript code here..."
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Execution Console & Test Output */}
        <div className="playground-output-column">
          <div className="output-panel">
            <div className="output-tabs">
              {!isScratchpad && (
                <button
                  className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tests')}
                >
                  <CheckCircle2 size={14} />
                  <span>Test Cases</span>
                  {testResults.length > 0 && (
                    <span className="results-count">
                      {testResults.filter(r => r.passed).length}/{testResults.length}
                    </span>
                  )}
                </button>
              )}
              <button
                className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
                onClick={() => setActiveTab('console')}
              >
                <Terminal size={14} />
                <span>Console Log</span>
                {consoleOutput.length > 0 && (
                  <span className="results-count">{consoleOutput.length}</span>
                )}
              </button>

              {executionTime !== null && (
                <span className="execution-time ml-auto">
                  ⚡ {executionTime}ms
                </span>
              )}
            </div>

            <div className="output-body custom-scrollbar">
              {/* TAB 1: Test Cases */}
              {activeTab === 'tests' && !isScratchpad && (
                <div className="tests-view">
                  {testResults.length === 0 ? (
                    <div className="output-empty">
                      <HelpCircle size={24} />
                      <p>Click <strong>Run Code (⌘↵)</strong> to execute automated test cases against your solution.</p>
                    </div>
                  ) : (
                    <div className="test-items-list">
                      {testResults.every(r => r.passed) && (
                        <div className="all-passed-banner">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>All Tests Passed! 🎉</strong>
                            <p>Great job! Your solution handles the test assertions cleanly.</p>
                          </div>
                        </div>
                      )}

                      {testResults.map((r, i) => (
                        <div key={r.id || i} className={`test-item ${r.passed ? 'pass' : 'fail'}`}>
                          <div className="test-header">
                            {r.passed ? (
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            ) : (
                              <XCircle size={15} className="text-rose-400" />
                            )}
                            <span className="test-name">{r.name}</span>
                            <span className={`test-status-pill ${r.passed ? 'pass' : 'fail'}`}>
                              {r.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          {r.error && (
                            <div className="test-err-msg">
                              Error: {r.error}
                            </div>
                          )}
                          <div className="test-expect">
                            Expected: <code>{r.expected}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Console Log */}
              {activeTab === 'console' && (
                <div className="console-view">
                  {consoleOutput.length === 0 ? (
                    <div className="output-empty">
                      <Terminal size={24} />
                      <p>Console output will appear here. Use <code>console.log()</code> to inspect variables.</p>
                    </div>
                  ) : (
                    <div className="console-lines">
                      {consoleOutput.map((log, index) => (
                        <div key={index} className={`console-line ${log.type}`}>
                          <span className="line-prefix">
                            {log.type === 'error' ? '✖' : log.type === 'warn' ? '▲' : '›'}
                          </span>
                          <span className="line-content">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
