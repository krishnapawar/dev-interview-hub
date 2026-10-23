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
  AlertTriangle,
  X,
  Keyboard,
  Timer,
  Info,
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
  const [speechError, setSpeechError] = useState('')
  // Default to timer_only if Linux/Chromium or user preference
  const isLikelyLinux = typeof navigator !== 'undefined' && (/Linux/i.test(navigator.userAgent || '') || /Chromium/i.test(navigator.userAgent || ''))
  const [practiceMode, setPracticeMode] = useState(isLikelyLinux ? 'timer' : 'mic') // 'mic' | 'timer'

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const [micActivity, setMicActivity] = useState(false)

  // Filter questions by topic
  const topics = ['All', ...new Set(questions.map(q => q.noteTitle || 'General'))]

  const pool = questions.filter(
    q => selectedTopic === 'All' || (q.noteTitle || 'General') === selectedTopic
  )

  const currentQ = pool[currentQuestionIndex] || questions[0]

  // Setup Web Speech Recognition when in 'mic' mode
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setPracticeMode('timer')
      return
    }

    try {
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
        setSpeechError('')
      }

      recognition.onerror = event => {
        setIsRecording(false)
        if (event.error === 'network') {
          setSpeechError(
            'Browser cloud speech API is blocked or unreachable (Google disables cloud STT in Linux Chromium). Switched to Verbal Timer Mode so you can practice speaking out loud without interruptions!'
          )
          setPracticeMode('timer')
        } else if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Switched to Verbal Timer Mode.')
          setPracticeMode('timer')
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError(`Speech notice: ${event.error}. Switched to Verbal Timer Mode.`)
          setPracticeMode('timer')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    } catch {
      setPracticeMode('timer')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  // Timer interval while recording or verbal timer is active
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

  // Local Microphone Volume Feedback via Web Audio API (100% offline, works on Linux)
  async function startLocalMic() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          audioContextRef.current = ctx
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 32
          const source = ctx.createMediaStreamSource(stream)
          source.connect(analyser)
          setMicActivity(true)
        }
      } catch (err) {
        // mic not allowed or unavailable; fallback to visual timer animation
        setMicActivity(false)
      }
    }
  }

  function stopLocalMic() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
    setMicActivity(false)
  }

  // Toggle Speech Recording or Verbal Timer
  function toggleRecording() {
    if (isRecording) {
      // Stop
      if (recognitionRef.current && practiceMode === 'mic') {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      stopLocalMic()
      setIsRecording(false)
      playSound('click', soundEnabled)
    } else {
      // Start
      setElapsedSeconds(0)
      setAnalysis(null)
      setSpeechError('')
      startLocalMic()

      if (practiceMode === 'timer') {
        setIsRecording(true)
        playSound('flip', soundEnabled)
      } else {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
          playSound('flip', soundEnabled)
        } catch (err) {
          setPracticeMode('timer')
          setIsRecording(true)
          playSound('flip', soundEnabled)
        }
      }
    }
  }

  // Analyze answer
  function handleAnalyze() {
    playSound('success', soundEnabled)
    if (isRecording) {
      if (recognitionRef.current && practiceMode === 'mic') {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      stopLocalMic()
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

  // Load sample answer for current question
  function handleSimulateSample() {
    playSound('click', soundEnabled)
    setSpeechError('')
    if (currentQ?.answer) {
      const sampleText = currentQ.answer
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^[#*-]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 320)
      setTranscript(`In my experience, ${sampleText}`)
      setElapsedSeconds(42)
    }
  }

  // Shuffle question
  function handleShuffle() {
    playSound('click', soundEnabled)
    const nextIdx = Math.floor(Math.random() * pool.length)
    setCurrentQuestionIndex(nextIdx)
    setTranscript('')
    setElapsedSeconds(0)
    setAnalysis(null)
    setSpeechError('')
    if (isRecording) {
      if (recognitionRef.current && practiceMode === 'mic') {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      stopLocalMic()
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
            Simulate answering interviewers out loud under timed pressure. Test your spoken fluency, articulation speed (WPM), and key technical keyword coverage.
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
              setSpeechError('')
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
            {/* Mode Switcher Tabs */}
            <div className="practice-mode-bar">
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-btn ${practiceMode === 'timer' ? 'active' : ''}`}
                  onClick={() => {
                    setPracticeMode('timer')
                    setSpeechError('')
                  }}
                  title="Practice answering out loud under a live timer without cloud speech dependencies (100% offline & Linux compatible)"
                >
                  <Timer size={13} />
                  <span>Verbal Out Loud Timer (Offline)</span>
                </button>

                <button
                  type="button"
                  className={`mode-btn ${practiceMode === 'mic' ? 'active' : ''}`}
                  onClick={() => {
                    setPracticeMode('mic')
                    setSpeechError('')
                  }}
                  title="Automatic live speech-to-text dictation using browser cloud speech service"
                >
                  <Mic size={13} />
                  <span>Speech-to-Text Dictation</span>
                </button>
              </div>

              {practiceMode === 'timer' && (
                <span className="offline-pill">
                  <CheckCircle2 size={11} /> 100% Offline & Linux Compatible
                </span>
              )}
            </div>

            {/* Informative Speech Notice Banner if Speech Error */}
            {speechError && (
              <div className="speech-notice-banner">
                <Info size={16} className="text-amber-400 shrink-0" />
                <div className="speech-notice-text">
                  <strong>Linux/Chromium Notice:</strong>
                  <span>{speechError}</span>
                </div>
                <button
                  className="speech-notice-close"
                  onClick={() => setSpeechError('')}
                  title="Dismiss notice"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="recorder-top">
              <div className="timer-badge">
                <Clock size={14} />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              {isRecording ? (
                <div className="recording-indicator">
                  <span className="rec-dot pulse-dot" />
                  <span>
                    {practiceMode === 'timer' ? 'Speaking timer active...' : 'Listening to speech...'}
                  </span>
                  <div className="voice-wave">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                </div>
              ) : (
                <span className="ready-indicator">
                  Ready to practice
                </span>
              )}
            </div>

            {/* Answer Transcribed Textarea */}
            <div className="transcript-box-wrapper">
              <textarea
                className="transcript-textarea custom-scrollbar"
                placeholder={
                  isRecording
                    ? practiceMode === 'timer'
                      ? '⏱️ Timer is running! Speak your answer out loud right now. You can also jot down bullet points here as you speak.'
                      : '🎙️ Speak clearly into your microphone... your words will appear here in real-time.'
                    : 'Click "Start Speaking" or type your spoken response here, then click "Analyze My Answer" to view concept coverage...'
                }
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="recorder-actions">
              <button
                className={`mic-toggle-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? <Pause size={16} /> : practiceMode === 'timer' ? <Play size={16} /> : <Mic size={16} />}
                <span>
                  {isRecording
                    ? 'Stop Timer'
                    : practiceMode === 'timer'
                    ? 'Start Verbal Answer Timer'
                    : 'Start Speaking'}
                </span>
              </button>

              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={!transcript.trim()}
              >
                <Sparkles size={16} />
                <span>Analyze My Answer</span>
              </button>

              <button
                className="sample-text-btn"
                onClick={handleSimulateSample}
                title="Fill a simulated candidate answer to test the concept analyzer"
              >
                <Sparkles size={13} />
                <span>Simulate Answer</span>
              </button>

              <button
                className="clear-btn"
                onClick={() => {
                  setTranscript('')
                  setAnalysis(null)
                  setElapsedSeconds(0)
                  setSpeechError('')
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
                Speak your explanation out loud under the timer or type your thoughts on the left, then click <strong>Analyze My Answer</strong> to view your concept coverage percentage, pace, and benchmark side-by-side.
              </p>
              <button
                className="subtle-sample-trigger"
                onClick={handleSimulateSample}
              >
                <Sparkles size={13} /> Or test with a simulated answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
