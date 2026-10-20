import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { playSound } from '../utils/audio'

export default function MockInterview({
  questions = [],
  onFinishRound,
  onExit,
  soundEnabled = true,
}) {
  const [stage, setStage] = useState('setup') // 'setup' | 'in_progress' | 'summary'
  const [selectedDomain, setSelectedDomain] = useState('All')
  const [questionCount, setQuestionCount] = useState(5)
  const [interviewQueue, setInterviewQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [responses, setResponses] = useState([]) // array of { question, score, userNotes }
  const [timeLeft, setTimeLeft] = useState(90)
  const [timerRunning, setTimerRunning] = useState(false)

  // Start interview
  function startInterview() {
    let pool = questions
    if (selectedDomain === 'Frontend') {
      pool = questions.filter(q => /react|javascript/i.test(q.noteTitle || ''))
    } else if (selectedDomain === 'Backend') {
      pool = questions.filter(q => /node|express|php|laravel|websocket/i.test(q.noteTitle || ''))
    } else if (selectedDomain === 'Databases & Systems') {
      pool = questions.filter(q => /sql|database|mongo/i.test(q.noteTitle || ''))
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount)
    setInterviewQueue(shuffled)
    setCurrentIndex(0)
    setResponses([])
    setAnswerRevealed(false)
    setTimeLeft(90)
    setTimerRunning(true)
    setStage('in_progress')
    playSound('flip', soundEnabled)
  }

  // Timer tick
  useEffect(() => {
    let t = null
    if (stage === 'in_progress' && timerRunning && timeLeft > 0) {
      t = setInterval(() => {
        setTimeLeft(sec => {
          if (sec <= 1) {
            playSound('timerBell', soundEnabled)
            setTimerRunning(false)
            return 0
          }
          return sec - 1
        })
      }, 1000)
    }
    return () => clearInterval(t)
  }, [stage, timerRunning, timeLeft, soundEnabled])

  const currentQ = interviewQueue[currentIndex]

  function recordScore(score) {
    playSound(score >= 2 ? 'success' : 'click', soundEnabled)
    const newResponses = [
      ...responses,
      {
        question: currentQ,
        score, // 1 (struggled), 2 (partial), 3 (nailed)
      },
    ]
    setResponses(newResponses)

    if (currentIndex + 1 >= interviewQueue.length) {
      setStage('summary')
      playSound('success', soundEnabled)
      if (onFinishRound) onFinishRound(newResponses)
    } else {
      setCurrentIndex(i => i + 1)
      setAnswerRevealed(false)
      setTimeLeft(90)
      setTimerRunning(true)
    }
  }

  if (stage === 'setup') {
    return (
      <div className="mock-setup-container">
        <div className="mock-setup-card">
          <div className="mock-badge">
            <Trophy size={16} /> MOCK INTERVIEW SIMULATOR
          </div>
          <h1>Simulate a Real Technical Interview Round</h1>
          <p className="mock-intro">
            Face random technical questions with a real-time countdown timer. Answer out loud, inspect the benchmark answer, and score yourself on clarity, depth, and edge cases.
          </p>

          <div className="mock-config-grid">
            <div className="config-block">
              <label>Domain / Track:</label>
              <div className="config-options">
                {['All', 'Frontend', 'Backend', 'Databases & Systems'].map(dom => (
                  <button
                    key={dom}
                    className={`config-pill ${selectedDomain === dom ? 'active' : ''}`}
                    onClick={() => setSelectedDomain(dom)}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <label>Number of Questions:</label>
              <div className="config-options">
                {[5, 10, 15].map(cnt => (
                  <button
                    key={cnt}
                    className={`config-pill ${questionCount === cnt ? 'active' : ''}`}
                    onClick={() => setQuestionCount(cnt)}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mock-cta-row">
            <button className="primary-button large-btn" onClick={startInterview}>
              <Play size={16} /> Start Technical Round
            </button>
            <button className="outline-button" onClick={onExit}>
              Exit to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'summary') {
    const totalPossible = interviewQueue.length * 3
    const earnedScore = responses.reduce((acc, r) => acc + r.score, 0)
    const percentage = Math.round((earnedScore / totalPossible) * 100)
    const nailedCount = responses.filter(r => r.score === 3).length
    const partialCount = responses.filter(r => r.score === 2).length
    const reviewCount = responses.filter(r => r.score === 1).length

    let readinessVerdict = 'Ready for High-Impact Interviews!'
    let verdictColor = 'text-emerald-400'
    if (percentage < 60) {
      readinessVerdict = 'Needs Additional Core Revision'
      verdictColor = 'text-amber-400'
    } else if (percentage < 80) {
      readinessVerdict = 'Strong Foundation — Polish Edge Cases'
      verdictColor = 'text-blue-400'
    }

    return (
      <div className="mock-summary-container">
        <div className="mock-summary-card">
          <div className="summary-badge">
            <Award size={20} /> ROUND SCORECARD
          </div>
          <div className="score-ring-wrap">
            <div className="score-percentage">{percentage}%</div>
            <div className={`score-verdict ${verdictColor}`}>{readinessVerdict}</div>
          </div>

          <div className="summary-metrics-row">
            <div className="metric-box">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="metric-num">{nailedCount}</span>
              <span className="metric-lbl">Nailed (100%)</span>
            </div>
            <div className="metric-box">
              <Sparkles size={18} className="text-blue-400" />
              <span className="metric-num">{partialCount}</span>
              <span className="metric-lbl">Partial (66%)</span>
            </div>
            <div className="metric-box">
              <XCircle size={18} className="text-rose-400" />
              <span className="metric-num">{reviewCount}</span>
              <span className="metric-lbl">Review Needed</span>
            </div>
          </div>

          <div className="summary-breakdown-section">
            <h3>Question Breakdown:</h3>
            <div className="breakdown-list custom-scrollbar">
              {responses.map((resp, i) => (
                <div key={i} className="breakdown-item">
                  <div className="b-left">
                    <span className="b-num">Q{i + 1}</span>
                    <div>
                      <div className="b-q-text">{resp.question?.question}</div>
                      <div className="b-topic">{resp.question?.noteTitle}</div>
                    </div>
                  </div>
                  <div className="b-score">
                    {resp.score === 3 ? (
                      <span className="badge-nailed">Nailed</span>
                    ) : resp.score === 2 ? (
                      <span className="badge-partial">Partial</span>
                    ) : (
                      <span className="badge-review">Needs Review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-cta-row">
            <button className="primary-button" onClick={() => setStage('setup')}>
              <RotateCcw size={16} /> New Interview Round
            </button>
            <button className="outline-button" onClick={onExit}>
              Return to Notes
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active question stage
  return (
    <div className="mock-active-container">
      <div className="mock-header">
        <div className="mock-q-counter">
          Question <strong>{currentIndex + 1}</strong> of {interviewQueue.length}
        </div>
        <div className={`mock-timer ${timeLeft <= 20 ? 'timer-warning' : ''}`}>
          <Clock size={16} />
          <span>
            {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}
            {timeLeft % 60}
          </span>
        </div>
      </div>

      <div className="mock-question-card">
        <div className="mock-topic-pill">
          {currentQ?.noteTitle || 'Technical Interview'}
        </div>

        <h2 className="mock-question-title">{currentQ?.question}</h2>
        <div className="mock-prompt-banner">
          <HelpCircle size={17} />
          <span>
            Speak your answer aloud. Address what it is, why it exists, practical trade-offs, and an example.
          </span>
        </div>

        {!answerRevealed ? (
          <div className="reveal-area">
            <button
              className="primary-button"
              onClick={() => {
                playSound('click', soundEnabled)
                setAnswerRevealed(true)
                setTimerRunning(false)
              }}
            >
              <Eye size={16} /> Reveal Benchmark Answer
            </button>
          </div>
        ) : (
          <div className="revealed-answer-box">
            <div className="answer-header">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Benchmark Technical Answer</span>
            </div>
            <div className="answer-body-markdown custom-scrollbar">
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: CodeBlock }}
                >
                  {currentQ?.answer || 'No answer available.'}
                </ReactMarkdown>
              </div>
            </div>

            <div className="score-prompt-box">
              <span className="score-title">How well did you explain this topic?</span>
              <div className="score-buttons">
                <button
                  className="score-btn score-1"
                  onClick={() => recordScore(1)}
                >
                  <XCircle size={16} /> Struggled / Needs Review
                </button>
                <button
                  className="score-btn score-2"
                  onClick={() => recordScore(2)}
                >
                  <Sparkles size={16} /> Mostly Covered / Partial
                </button>
                <button
                  className="score-btn score-3"
                  onClick={() => recordScore(3)}
                >
                  <CheckCircle2 size={16} /> Nailed It / Confident
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
