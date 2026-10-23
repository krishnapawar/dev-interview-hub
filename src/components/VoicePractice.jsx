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
  VolumeX,
  Layers,
  ChevronRight,
  Flame,
  Award,
  AlertTriangle,
  X,
  Keyboard,
  Timer,
  Info,
  ShieldAlert,
  Headphones,
  Download,
} from 'lucide-react'
import { analyzeSpeech, extractKeyConcepts } from '../utils/conceptAnalyzer'
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
  const [showBraveModal, setShowBraveModal] = useState(false)
  const [isBrave, setIsBrave] = useState(false)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null)
  const [isSpeakingBenchmark, setIsSpeakingBenchmark] = useState(false)

  // Detect Linux or Brave environment
  const isLikelyLinux = typeof navigator !== 'undefined' && (/Linux/i.test(navigator.userAgent || '') || /Chromium/i.test(navigator.userAgent || ''))
  const [practiceMode, setPracticeMode] = useState(isLikelyLinux ? 'timer' : 'mic') // 'mic' | 'timer'

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Check if browser is Brave
  useEffect(() => {
    if (navigator?.brave?.isBrave) {
      navigator.brave.isBrave().then(val => {
        if (val) setIsBrave(true)
      }).catch(() => {})
    }
  }, [])

  // Filter questions by topic
  const topics = ['All', ...new Set(questions.map(q => q.noteTitle || 'General'))]

  const pool = questions.filter(
    q => selectedTopic === 'All' || (q.noteTitle || 'General') === selectedTopic
  )

  const currentQ = pool[currentQuestionIndex] || questions[0]
  const targetKeywords = currentQ ? extractKeyConcepts(currentQ.question, currentQ.answer).slice(0, 6) : []

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
            'Browser cloud speech API is blocked or unreachable (Brave and Linux Chromium block Google cloud dictation). Use Audio Recording & Verbal Timer below, or open Google Chrome/Edge for cloud dictation.'
          )
          setPracticeMode('timer')
        } else if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in browser settings.')
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

  // Timer interval while recording is active
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

  // Stop TTS if question changes
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeakingBenchmark(false)
  }, [currentQuestionIndex])

  // Start microphone stream, audio visualizer, and MediaRecorder
  async function startAudioCapture() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream

        // Web Audio context for live frequency analysis
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          audioContextRef.current = ctx
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 32
          const source = ctx.createMediaStreamSource(stream)
          source.connect(analyser)
        }

        // MediaRecorder to capture actual spoken audio file
        audioChunksRef.current = []
        if (typeof MediaRecorder !== 'undefined') {
          try {
            const recorder = new MediaRecorder(stream)
            recorder.ondataavailable = e => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data)
              }
            }
            recorder.onstop = () => {
              if (audioChunksRef.current.length > 0) {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setRecordedAudioUrl(url)
              }
            }
            mediaRecorderRef.current = recorder
            recorder.start()
          } catch (recErr) {
            console.warn('MediaRecorder error:', recErr)
          }
        }
      } catch (err) {
        console.warn('Microphone stream error:', err)
      }
    }
  }

  // Stop mic capture and media recording
  function stopAudioCapture() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
      mediaRecorderRef.current = null
    }

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
      stopAudioCapture()
      setIsRecording(false)
      playSound('click', soundEnabled)
    } else {
      // Start
      setElapsedSeconds(0)
      setAnalysis(null)
      setSpeechError('')
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }

      startAudioCapture()

      if (practiceMode === 'timer') {
        setIsRecording(true)
        playSound('flip', soundEnabled)
      } else {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
          playSound('flip', soundEnabled)
        } catch {
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
      stopAudioCapture()
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
        .slice(0, 360)
      setTranscript(`In my experience, ${sampleText}`)
      setElapsedSeconds(45)
    }
  }

  // Text to speech for benchmark answer
  function toggleSpeechBenchmark() {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.')
      return
    }

    if (isSpeakingBenchmark) {
      window.speechSynthesis.cancel()
      setIsSpeakingBenchmark(false)
      return
    }

    const cleanAnswer = (currentQ?.answer || '')
      .replace(/```[\s\S]*?```/g, 'Code example omitted.')
      .replace(/[*#`_>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const speechText = `${currentQ?.question || ''}. ${cleanAnswer}`.slice(0, 650)

    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.onend = () => setIsSpeakingBenchmark(false)
    utterance.onerror = () => setIsSpeakingBenchmark(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setIsSpeakingBenchmark(true)
  }

  // Insert target keyword into notes
  function handleInsertKeyword(keyword) {
    playSound('click', soundEnabled)
    setTranscript(prev => {
      const trimmed = prev.trim()
      if (!trimmed) return `We should discuss ${keyword}`
      return `${trimmed}, ${keyword}`
    })
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
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
      setRecordedAudioUrl(null)
    }
    if (isRecording) {
      if (recognitionRef.current && practiceMode === 'mic') {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      stopAudioCapture()
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
          <h2>Speech & Audio Voice Practice with Concept Matcher</h2>
          <p>
            Simulate answering interviewers out loud under timed pressure. Record your real voice, test your spoken pacing (WPM), and evaluate key technical keyword coverage.
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
              if (recordedAudioUrl) {
                URL.revokeObjectURL(recordedAudioUrl)
                setRecordedAudioUrl(null)
              }
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

            {/* Target Keywords Guide */}
            {targetKeywords.length > 0 && (
              <div className="target-keywords-bar">
                <span className="target-keywords-title">Target Concepts to Hit:</span>
                <div className="target-keywords-list">
                  {targetKeywords.map(kw => {
                    const isMentioned = transcript.toLowerCase().includes(kw)
                    return (
                      <button
                        key={kw}
                        type="button"
                        className={`target-kw-chip ${isMentioned ? 'hit' : ''}`}
                        onClick={() => handleInsertKeyword(kw)}
                        title={`Click to insert "${kw}" into your response notes`}
                      >
                        {isMentioned ? <CheckCircle2 size={11} /> : '+'}
                        <span>{kw}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
                  title="Practice speaking out loud with real microphone recording & timer (100% offline & Brave/Linux compatible)"
                >
                  <Timer size={13} />
                  <span>Verbal Recording & Timer (Offline)</span>
                </button>

                <button
                  type="button"
                  className={`mode-btn ${practiceMode === 'mic' ? 'active' : ''}`}
                  onClick={() => {
                    setPracticeMode('mic')
                    setSpeechError('')
                  }}
                  title="Automatic live cloud speech-to-text dictation (Requires Google Chrome / Edge)"
                >
                  <Mic size={13} />
                  <span>Cloud Dictation (Chrome)</span>
                </button>
              </div>

              <button
                type="button"
                className="brave-help-btn"
                onClick={() => setShowBraveModal(true)}
                title="Learn why Voice-to-Text shows network error in Brave or Linux"
              >
                <HelpCircle size={12} /> Why Voice Error in Brave/Linux?
              </button>
            </div>

            {/* Informative Speech Notice Banner if Speech Error */}
            {speechError && (
              <div className="speech-notice-banner">
                <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                <div className="speech-notice-text">
                  <strong>Browser Cloud STT Blocked:</strong>
                  <span>{speechError}</span>
                  <div className="notice-actions-row">
                    <button
                      type="button"
                      className="banner-action-link"
                      onClick={() => setShowBraveModal(true)}
                    >
                      Learn more
                    </button>
                    <button
                      type="button"
                      className="banner-action-link"
                      onClick={handleSimulateSample}
                    >
                      Fill simulated answer
                    </button>
                  </div>
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
                    {practiceMode === 'timer' ? 'Recording voice & timer active...' : 'Listening to speech...'}
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
                  Ready to practice speaking
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
                      ? '🎙️ Microphone is recording your voice! Speak your technical answer out loud right now. You can also jot down bullet points here as you speak.'
                      : '🎙️ Speak clearly into your microphone... words will appear here if your browser supports cloud speech recognition.'
                    : 'Click "Start Recording & Speaking" or type your spoken response here, then click "Analyze My Answer" to view concept coverage...'
                }
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
              />
            </div>

            {/* Recorded Audio Playback Bar */}
            {recordedAudioUrl && (
              <div className="audio-playback-bar">
                <div className="audio-playback-meta">
                  <Headphones size={15} className="text-purple-400 shrink-0" />
                  <div>
                    <strong>Your Recorded Voice Answer</strong>
                    <span>Listen back to evaluate your clarity, pacing, and tone</span>
                  </div>
                </div>
                <audio controls src={recordedAudioUrl} className="custom-audio-element" />
                <button
                  type="button"
                  className="audio-clear-btn"
                  onClick={() => {
                    URL.revokeObjectURL(recordedAudioUrl)
                    setRecordedAudioUrl(null)
                  }}
                  title="Discard recording"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="recorder-actions">
              <button
                className={`mic-toggle-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? <Pause size={16} /> : practiceMode === 'timer' ? <Play size={16} /> : <Mic size={16} />}
                <span>
                  {isRecording
                    ? 'Stop Recording'
                    : practiceMode === 'timer'
                    ? 'Start Recording & Timer'
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
                  if (recordedAudioUrl) {
                    URL.revokeObjectURL(recordedAudioUrl)
                    setRecordedAudioUrl(null)
                  }
                }}
                title="Clear transcript and recording"
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
                <div className="benchmark-head-row">
                  <h5>Benchmark Answer</h5>
                  <button
                    type="button"
                    className={`tts-listen-btn ${isSpeakingBenchmark ? 'playing' : ''}`}
                    onClick={toggleSpeechBenchmark}
                    title="Listen to benchmark answer read aloud"
                  >
                    {isSpeakingBenchmark ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    <span>{isSpeakingBenchmark ? 'Stop Audio' : 'Listen to Answer'}</span>
                  </button>
                </div>
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

              <div className="empty-actions-row">
                <button
                  className="subtle-sample-trigger"
                  onClick={handleSimulateSample}
                >
                  <Sparkles size={13} /> Test with simulated answer
                </button>
                <button
                  className="subtle-tts-trigger"
                  onClick={toggleSpeechBenchmark}
                >
                  {isSpeakingBenchmark ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{isSpeakingBenchmark ? 'Stop Audio' : 'Listen to Benchmark'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Brave / Linux Diagnostic Modal */}
      {showBraveModal && (
        <div className="brave-modal-overlay" onClick={() => setShowBraveModal(false)}>
          <div className="brave-modal-box" onClick={e => e.stopPropagation()}>
            <div className="brave-modal-header">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-400" />
                <h3>Why Voice-to-Text Fails in Brave & Linux</h3>
              </div>
              <button
                className="brave-modal-close"
                onClick={() => setShowBraveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="brave-modal-body">
              <div className="modal-callout">
                <strong>Why the network error occurs:</strong>
                <p>
                  In browsers like Google Chrome, the Web Speech API (<code>webkitSpeechRecognition</code>) does not perform transcription on your local device. Instead, it uploads your raw microphone stream to <strong>Google's cloud servers</strong>.
                </p>
                <p>
                  <strong>Brave Browser</strong> blocks this Google telemetry connection by design to protect your microphone privacy. Similarly, Chromium builds on Linux lack Google API keys.
                </p>
              </div>

              <h4>How you can practice effectively right now:</h4>
              <ul className="modal-steps-list">
                <li>
                  <strong>1. Real Microphone Audio Recording:</strong> Keep the <em>Verbal Recording & Timer</em> mode selected. It records your actual voice locally via standard HTML5 Audio and lets you play it back.
                </li>
                <li>
                  <strong>2. Target Concepts Checklist:</strong> Tap any concept chip above the text box to insert key technical terms directly into your notes.
                </li>
                <li>
                  <strong>3. 1-Click "Simulate Answer":</strong> Test the WPM pacing gauge, filler word detection, and concept matching algorithms immediately.
                </li>
                <li>
                  <strong>4. Want Live Cloud Dictation?</strong> Open this page in official <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, where Google/Microsoft speech servers are enabled.
                </li>
              </ul>
            </div>

            <div className="brave-modal-footer">
              <button
                className="btn-primary"
                onClick={() => setShowBraveModal(false)}
              >
                Got It, Let's Practice!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
