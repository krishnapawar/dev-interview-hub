import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  Shuffle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Volume2,
  Layers,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react'
import { analyzeSpeech } from '../utils/conceptAnalyzer'
import { playSound } from '../utils/audio'

export default function VoicePractice({
  questions = [],
  soundEnabled = true,
}) {
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  // Filter questions by topic
  const topics = ['All', ...new Set(questions.map(q => q.noteTitle || 'General'))]

  const pool = questions.filter(
    q => selectedTopic === 'All' || (q.noteTitle || 'General') === selectedTopic
  )

  const currentQ = pool[currentQuestionIndex] || questions[0]

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = event => {
      let currentResult = ''
      for (let i = 0; i < event.results.length; i++) {
        currentResult += event.results[i][0].transcript + ' '
      }
      setTranscript(currentResult)
    }

    recognition.onerror = event => {
      console.warn('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  // Timer interval while recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  // Toggle Speech Recording
  function toggleRecording() {
    if (!recognitionRef.current && isSupported) return

    if (isRecording) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsRecording(false)
      playSound('click', soundEnabled)
    } else {
      setTranscript('')
      setElapsedSeconds(0)
      setAnalysis(null)
      try {
        recognitionRef.current.start()
        setIsRecording(true)
        playSound('flip', soundEnabled)
      } catch (err) {
        console.error('Could not start recognition:', err)
      }
    }
  }

  // Analyze answer
  function handleAnalyze() {
    playSound('success', soundEnabled)
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsRecording(false)
    }

    const result = analyzeSpeech(
      transcript,
      currentQ?.question || '',
      currentQ?.answer || '',
      Math.max(10, elapsedSeconds)
    )
    setAnalysis(result)
  }

  // Shuffle question
  function handleShuffle() {
    playSound('click', soundEnabled)
    const nextIdx = Math.floor(Math.random() * pool.length)
    setCurrentQuestionIndex(nextIdx)
    setTranscript('')
    setElapsedSeconds(0)
    setAnalysis(null)
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  // Format seconds mm:ss
  function formatTime(sec) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="voice-wrapper">
      {/* Header */}
      <div className="voice-header">
        <div className="voice-title-area">
          <div className="voice-badge">
            <Mic size={14} /> VERBAL ARTICULATION PRACTICE
          </div>
          <h2>Speech-to-Text Voice Practice & Concept Matcher</h2>
          <p>
            Simulate answering interviewers out loud. Speak into your microphone and analyze your technical keyword coverage, speaking pace, and clarity against the benchmark answer.
          </p>
        </div>

        <div className="voice-topic-select">
          <select
            value={selectedTopic}
            onChange={e => {
              setSelectedTopic(e.target.value)
              setCurrentQuestionIndex(0)
              setTranscript('')
              setAnalysis(null)
            }}
          >
            {topics.map(t => (
              <option key={t} value={t}>
                Topic: {t}
              </option>
            ))}
          </select>

          <button className="voice-shuffle-btn" onClick={handleShuffle} title="Pick another random question">
            <Shuffle size={14} /> Next Question
          </button>
        </div>
      </div>

      {/* Main Practice Split */}
      <div className="voice-grid">
        {/* Left Column: Question & Speech Controls */}
        <div className="voice-candidate-column">
          <div className="voice-question-card">
            <div className="voice-q-meta">
              <span className="topic-pill">{currentQ?.noteTitle || 'Interview Guide'}</span>
              <span className="q-index-pill">
                #{currentQuestionIndex + 1} of {pool.length}
              </span>
            </div>
            <h3 className="voice-question-text">{currentQ?.question}</h3>
          </div>

          {/* Recorder Controls */}
          <div className="recorder-panel">
            <div className="recorder-top">
              <div className="timer-badge">
                <Clock size={14} />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              {isRecording && (
                <div className="recording-indicator">
                  <span className="rec-dot pulse-dot" />
                  <span>Listening...</span>
                  <div className="voice-wave">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                </div>
              )}

              {!isSupported && (
                <span className="text-amber-400 text-xs">
                  (Mic unsupported in this browser — type response below)
                </span>
              )}
            </div>

            {/* Answer Transcribed Textarea */}
            <div className="transcript-box-wrapper">
              <textarea
                className="transcript-textarea custom-scrollbar"
                placeholder={
                  isRecording
                    ? 'Speak clearly into your microphone... your words will appear here in real-time.'
                    : 'Click "Start Speaking" or type your spoken response here...'
                }
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="recorder-actions">
              {isSupported && (
                <button
                  className={`mic-toggle-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isRecording ? 'Stop Speaking' : 'Start Speaking'}</span>
                </button>
              )}

              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={!transcript.trim()}
              >
                <Sparkles size={16} />
                <span>Analyze My Answer</span>
              </button>

              <button
                className="clear-btn"
                onClick={() => {
                  setTranscript('')
                  setAnalysis(null)
                  setElapsedSeconds(0)
                }}
                title="Clear transcript"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Report or Benchmark Answer */}
        <div className="voice-feedback-column">
          {analysis ? (
            <div className="analysis-card">
              <div className="analysis-head">
                <Award size={20} className="text-purple-400" />
                <div>
                  <h4>Articulation Analysis</h4>
                  <p>Rating: <strong className="text-emerald-400">{analysis.rating}</strong></p>
                </div>
                <div className="score-circle">
                  <span>{analysis.coveragePercent}%</span>
                  <small>Concept Match</small>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="metrics-row">
                <div className="metric-box">
                  <strong>{analysis.wpm}</strong>
                  <span>Words / Min</span>
                </div>
                <div className="metric-box">
                  <strong>{analysis.wordCount}</strong>
                  <span>Total Words</span>
                </div>
                <div className="metric-box">
                  <strong>{analysis.totalFillers}</strong>
                  <span>Filler Words</span>
                </div>
              </div>

              {/* Concept Coverage Chips */}
              <div className="concepts-section">
                <h5>Key Technical Keywords</h5>
                <div className="concepts-chips">
                  {analysis.matchedConcepts.map(c => (
                    <span key={c} className="concept-chip matched">
                      <CheckCircle2 size={12} /> {c}
                    </span>
                  ))}
                  {analysis.missingConcepts.map(c => (
                    <span key={c} className="concept-chip missing">
                      <HelpCircle size={12} /> {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benchmark Reference */}
              <div className="benchmark-reveal">
                <h5>Benchmark Answer</h5>
                <div className="markdown-body custom-scrollbar benchmark-scroll">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ code: CodeBlock }}
                  >
                    {currentQ?.answer || 'No answer'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-analysis-card">
              <Sparkles size={36} className="text-purple-400 opacity-60" />
              <h4>Ready to Evaluate Your Answer</h4>
              <p>
                Speak or type your explanation of the technical question on the left, then click <strong>Analyze My Answer</strong> to view your concept coverage percentage, pace, and benchmark side-by-side.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
