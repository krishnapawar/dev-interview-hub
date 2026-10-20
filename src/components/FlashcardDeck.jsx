import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  Award,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { playSound } from '../utils/audio'

export default function FlashcardDeck({
  questions = [],
  saved,
  onToggleBookmark,
  onToggleMastered,
  onOpenNote,
  soundEnabled = true,
}) {
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(120) // 2-minute mock answer timer
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Unique topics
  const topics = ['All', ...new Set(questions.map(q => q.noteTitle || 'General'))]

  // Initialize or re-filter deck
  useEffect(() => {
    let filtered = questions
    if (selectedTopic !== 'All') {
      filtered = questions.filter(q => (q.noteTitle || 'General') === selectedTopic)
    }
    setDeck(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
    setTimerSeconds(120)
    setIsTimerRunning(false)
    setSessionCompleted(false)
  }, [selectedTopic, questions])

  // Timer interval
  useEffect(() => {
    let interval = null
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            playSound('timerBell', soundEnabled)
            setIsTimerRunning(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds, soundEnabled])

  const currentQ = deck[currentIndex]

  function handleFlip() {
    playSound('flip', soundEnabled)
    setIsFlipped(!isFlipped)
  }

  function handleNext() {
    playSound('click', soundEnabled)
    if (currentIndex + 1 >= deck.length) {
      setSessionCompleted(true)
      playSound('success', soundEnabled)
    } else {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
      setTimerSeconds(120)
      setIsTimerRunning(false)
    }
  }

  function handlePrev() {
    playSound('click', soundEnabled)
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setIsFlipped(false)
      setTimerSeconds(120)
      setIsTimerRunning(false)
    }
  }

  function handleShuffle() {
    playSound('flip', soundEnabled)
    const shuffled = [...deck].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setTimerSeconds(120)
    setIsTimerRunning(false)
    setSessionCompleted(false)
  }

  function handleRateMastered() {
    if (!currentQ) return
    playSound('success', soundEnabled)
    onToggleMastered(currentQ.id, true)
    handleNext()
  }

  function handleRateReview() {
    if (!currentQ) return
    playSound('click', soundEnabled)
    onToggleMastered(currentQ.id, false)
    handleNext()
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        handleFlip()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlipped, currentIndex, deck.length])

  if (!questions.length) {
    return (
      <div className="flashcard-empty">
        <Sparkles size={32} />
        <h3>Loading flashcards...</h3>
        <p>Syncing technical questions from your repository.</p>
      </div>
    )
  }

  if (sessionCompleted) {
    const masteredInTopic = (saved.mastered || []).filter(id => deck.some(q => q.id === id)).length
    return (
      <div className="flashcard-complete-card">
        <div className="complete-icon">
          <Award size={48} />
        </div>
        <h2>Active Recall Session Complete!</h2>
        <p>
          You practiced all <strong>{deck.length}</strong> questions in this deck. Repetition is the key to interview fluency!
        </p>

        <div className="complete-stats">
          <div className="c-stat">
            <span className="c-stat-val">{deck.length}</span>
            <span className="c-stat-lbl">Questions Practiced</span>
          </div>
          <div className="c-stat">
            <span className="c-stat-val">{masteredInTopic}</span>
            <span className="c-stat-lbl">Marked Mastered</span>
          </div>
          <div className="c-stat">
            <span className="c-stat-val">
              {deck.length ? Math.round((masteredInTopic / deck.length) * 100) : 0}%
            </span>
            <span className="c-stat-lbl">Deck Mastery</span>
          </div>
        </div>

        <div className="complete-actions">
          <button
            className="primary-button"
            onClick={() => {
              handleShuffle()
              setSessionCompleted(false)
            }}
          >
            <Shuffle size={16} /> Shuffle & Practice Again
          </button>
          <button
            className="outline-button"
            onClick={() => {
              setSelectedTopic('All')
              setSessionCompleted(false)
            }}
          >
            Switch Topic
          </button>
        </div>
      </div>
    )
  }

  const isBookmarked = currentQ && (saved.bookmarks || []).includes(currentQ.id)
  const isMastered = currentQ && (saved.mastered || []).includes(currentQ.id)

  const formatTimer = sec => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="flashcard-container">
      {/* Top Filter and Controls */}
      <div className="flashcard-topbar">
        <div className="topic-select-wrap">
          <label htmlFor="flashcard-topic">TOPIC:</label>
          <select
            id="flashcard-topic"
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
          >
            {topics.map(t => (
              <option key={t} value={t}>
                {t} ({t === 'All' ? questions.length : questions.filter(q => q.noteTitle === t).length})
              </option>
            ))}
          </select>
        </div>

        <div className="flashcard-meta-actions">
          <button className="subtle-btn" onClick={handleShuffle} title="Shuffle deck">
            <Shuffle size={15} /> <span>Shuffle</span>
          </button>
          <div className="deck-progress-badge">
            {currentIndex + 1} / {deck.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="deck-progress-bar">
        <div
          className="deck-progress-fill"
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard */}
      <div className="flashcard-perspective">
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
          {/* FRONT: Question */}
          <div className="flashcard-face flashcard-front">
            <div className="card-top-row">
              <div className="card-topic-tag">
                <span className="dot" />
                {currentQ?.noteTitle || 'Interview Question'}
              </div>
              <div className="card-actions-right">
                <button
                  className={`card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={() => onToggleBookmark(currentQ.id)}
                  title="Bookmark this question"
                >
                  <Bookmark size={16} />
                </button>
              </div>
            </div>

            <div className="card-main-content">
              <div className="question-eyebrow">QUESTION #{currentIndex + 1}</div>
              <h2 className="card-question-text">{currentQ?.question}</h2>
              <p className="card-hint">
                <Sparkles size={14} /> Try to structure your answer verbally: definition, why it’s needed, practical example, and edge cases.
              </p>
            </div>

            {/* Answer practice timer */}
            <div className="card-timer-row">
              <div className="timer-badge">
                <Clock size={14} className={timerSeconds <= 20 ? 'text-amber-400' : ''} />
                <span>{formatTimer(timerSeconds)}</span>
              </div>
              <button
                className="timer-control-btn"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                title={isTimerRunning ? 'Pause timer' : 'Start 2-min verbal timer'}
              >
                {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
              </button>
              <button
                className="timer-reset-btn"
                onClick={() => {
                  setTimerSeconds(120)
                  setIsTimerRunning(false)
                }}
                title="Reset timer"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="card-footer-prompt" onClick={handleFlip}>
              <span>Click card or press <kbd>Space</kbd> to reveal answer</span>
            </div>
          </div>

          {/* BACK: Detailed Answer */}
          <div className="flashcard-face flashcard-back">
            <div className="card-top-row">
              <div className="card-topic-tag">
                <Check size={13} className="text-emerald-400" />
                <span>Reference Answer</span>
              </div>
              <button className="card-flip-back-btn" onClick={handleFlip} title="Flip back to question">
                <RotateCcw size={14} /> Question
              </button>
            </div>

            <h3 className="card-back-title">{currentQ?.question}</h3>

            <div className="card-answer-scroll custom-scrollbar">
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock,
                  }}
                >
                  {currentQ?.answer || 'No detailed reference provided.'}
                </ReactMarkdown>
              </div>
            </div>

            {/* Self-Rating for Active Recall */}
            <div className="card-rating-bar">
              <span className="rate-label">Self-Assessment:</span>
              <button className="rate-btn review-btn" onClick={handleRateReview}>
                Needs Review 🔄
              </button>
              <button className="rate-btn master-btn" onClick={handleRateMastered}>
                Mastered! ✅
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flashcard-controls">
        <button
          className="outline-button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <button className="flip-button" onClick={handleFlip}>
          <RotateCcw size={15} /> {isFlipped ? 'Show Question' : 'Reveal Answer'}
        </button>
        <button className="primary-button" onClick={handleNext}>
          Next <ChevronRight size={16} />
        </button>
      </div>

      <div className="keyboard-shortcuts-hint">
        <span><kbd>Space</kbd> Flip</span>
        <span><kbd>←</kbd> Prev</span>
        <span><kbd>→</kbd> Next</span>
      </div>
    </div>
  )
}
