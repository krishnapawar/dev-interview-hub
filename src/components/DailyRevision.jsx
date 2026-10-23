import { useState, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  Flame,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  Eye,
  Bookmark,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import {
  getDueQuestions,
  rateCardSRS,
  calculateStreak,
  generateHeatmapData,
  getTodayKey,
  SRS_INTERVALS_DAYS,
} from '../utils/srs'
import { playSound } from '../utils/audio'

export default function DailyRevision({
  allQuestions = [],
  srsData = { cards: {}, activityLog: {} },
  onUpdateSRS,
  onToggleBookmark,
  savedBookmarks = [],
  soundEnabled = true,
  onFinishSession,
}) {
  const today = getTodayKey()
  const streakInfo = useMemo(() => calculateStreak(srsData.activityLog), [srsData.activityLog])
  const heatmap = useMemo(() => generateHeatmapData(srsData.activityLog, 28), [srsData.activityLog])

  // Get due queue
  const queue = useMemo(() => {
    return getDueQuestions(allQuestions, srsData.cards || {}, 12)
  }, [allQuestions, srsData.cards])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionRatings, setSessionRatings] = useState({ struggled: 0, good: 0, easy: 0 })

  const currentQ = queue[currentIndex]
  const cardSrs = currentQ ? (srsData.cards || {})[currentQ.id] : null
  const currentLevel = cardSrs ? cardSrs.level : 1

  function handleRating(rating) {
    if (!currentQ) return
    playSound(rating === 'struggled' ? 'click' : 'success', soundEnabled)

    const updatedCard = rateCardSRS(cardSrs, rating, today)
    const newCards = {
      ...(srsData.cards || {}),
      [currentQ.id]: updatedCard,
    }

    const todayCount = (srsData.activityLog?.[today] || 0) + 1
    const newActivityLog = {
      ...(srsData.activityLog || {}),
      [today]: todayCount,
    }

    setSessionRatings(prev => ({ ...prev, [rating]: prev[rating] + 1 }))

    if (onUpdateSRS) {
      onUpdateSRS({
        cards: newCards,
        activityLog: newActivityLog,
      })
    }

    if (currentIndex + 1 >= queue.length) {
      setSessionCompleted(true)
      playSound('success', soundEnabled)
    } else {
      setCurrentIndex(i => i + 1)
      setIsAnswerRevealed(false)
    }
  }

  function handleResetSession() {
    playSound('click', soundEnabled)
    setCurrentIndex(0)
    setIsAnswerRevealed(false)
    setSessionCompleted(false)
    setSessionRatings({ struggled: 0, good: 0, easy: 0 })
  }

  const masteredCount = useMemo(() => {
    return Object.values(srsData.cards || {}).filter(c => c.level >= 5).length
  }, [srsData.cards])

  return (
    <div className="srs-wrapper">
      {/* Top SRS Banner & Streak Stats */}
      <div className="srs-stats-hero">
        <div className="srs-streak-card">
          <div className="streak-icon-wrap">
            <Flame size={28} className="streak-flame" />
          </div>
          <div className="streak-details">
            <div className="streak-number">{streakInfo.currentStreak} Days</div>
            <div className="streak-label">DAILY STUDY STREAK</div>
          </div>
        </div>

        <div className="srs-metric-pill">
          <Layers size={18} className="text-purple-400" />
          <div>
            <strong>{queue.length} Questions</strong>
            <span>Due for Review Today</span>
          </div>
        </div>

        <div className="srs-metric-pill">
          <Award size={18} className="text-emerald-400" />
          <div>
            <strong>{masteredCount} Questions</strong>
            <span>In Permanent Mastery (Box 5)</span>
          </div>
        </div>

        <div className="srs-metric-pill">
          <TrendingUp size={18} className="text-blue-400" />
          <div>
            <strong>{streakInfo.totalReviews} Total</strong>
            <span>Reviews Completed</span>
          </div>
        </div>
      </div>

      {/* 4-Week Activity Heatmap */}
      <div className="srs-heatmap-container">
        <div className="heatmap-header">
          <div className="heatmap-title">
            <Calendar size={15} />
            <span>Last 28 Days Study Activity</span>
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <span className="legend-box lvl-0" />
            <span className="legend-box lvl-1" />
            <span className="legend-box lvl-2" />
            <span className="legend-box lvl-3" />
            <span className="legend-box lvl-4" />
            <span>More</span>
          </div>
        </div>

        <div className="heatmap-grid">
          {heatmap.map(sq => (
            <div
              key={sq.date}
              className={`heatmap-square lvl-${sq.intensity} ${sq.isToday ? 'today-square' : ''}`}
              title={`${sq.date}: ${sq.count} reviews`}
            />
          ))}
        </div>
      </div>

      {/* Main Review Session Area */}
      {!sessionCompleted && queue.length > 0 && currentQ && (
        <div className="srs-review-card">
          {/* Card Top Row */}
          <div className="srs-card-top">
            <div className="srs-progress-counter">
              Question {currentIndex + 1} of {queue.length}
            </div>

            <div className="srs-box-badge">
              Leitner Box {currentLevel} (Review every {SRS_INTERVALS_DAYS[currentLevel]}d)
            </div>

            <div className="srs-topic-tag">
              {currentQ.noteTitle || 'Interview Guide'}
            </div>

            {onToggleBookmark && (
              <button
                className={`srs-bm-btn ${savedBookmarks.includes(currentQ.id) ? 'bookmarked' : ''}`}
                onClick={() => onToggleBookmark(currentQ.id)}
                title="Bookmark question"
              >
                <Bookmark size={15} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="srs-session-progress">
            <div
              className="srs-progress-fill"
              style={{ width: `${Math.round(((currentIndex + 1) / queue.length) * 100)}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="srs-question-body">
            <h3>{currentQ.question}</h3>
          </div>

          {/* Answer Area */}
          {!isAnswerRevealed ? (
            <div className="srs-reveal-prompt">
              <button
                className="srs-reveal-btn"
                onClick={() => {
                  playSound('flip', soundEnabled)
                  setIsAnswerRevealed(true)
                }}
              >
                <Eye size={17} /> Reveal Answer & Code
              </button>
              <p>Try articulating your response out loud before revealing!</p>
            </div>
          ) : (
            <div className="srs-answer-wrapper">
              <div className="srs-answer-header">
                <Sparkles size={15} /> Benchmark Explanation & Architecture
              </div>
              <div className="markdown-body srs-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: CodeBlock }}
                >
                  {currentQ.answer || 'No answer details available.'}
                </ReactMarkdown>
              </div>

              {/* Leitner Rating Actions */}
              <div className="srs-rating-container">
                <div className="rating-prompt">
                  How well did you recall this answer?
                </div>
                <div className="srs-rating-buttons">
                  <button
                    className="srs-rate-btn struggled"
                    onClick={() => handleRating('struggled')}
                  >
                    <span className="rate-badge">Box 1</span>
                    <strong>Struggled</strong>
                    <span className="rate-sub">Review in 1 day</span>
                  </button>

                  <button
                    className="srs-rate-btn good"
                    onClick={() => handleRating('good')}
                  >
                    <span className="rate-badge">Box {Math.min(5, currentLevel + 1)}</span>
                    <strong>Good Recall</strong>
                    <span className="rate-sub">Review in {SRS_INTERVALS_DAYS[Math.min(5, currentLevel + 1)]}d</span>
                  </button>

                  <button
                    className="srs-rate-btn easy"
                    onClick={() => handleRating('easy')}
                  >
                    <span className="rate-badge">Box {Math.min(5, currentLevel + 2)}</span>
                    <strong>Easy / Mastered</strong>
                    <span className="rate-sub">Review in {SRS_INTERVALS_DAYS[Math.min(5, currentLevel + 2)]}d</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Completed Screen */}
      {sessionCompleted && (
        <div className="srs-celebrate-card">
          <div className="trophy-glow-wrap">
            <Trophy size={48} className="trophy-glow" />
          </div>
          <h2>Daily Practice Completed! 🎉</h2>
          <p>
            You reviewed <strong>{queue.length} questions</strong> today. Your spaced repetition schedule has been updated!
          </p>

          <div className="session-breakdown">
            <div className="breakdown-item green">
              <strong>{sessionRatings.easy}</strong> Easy
            </div>
            <div className="breakdown-item yellow">
              <strong>{sessionRatings.good}</strong> Good
            </div>
            <div className="breakdown-item red">
              <strong>{sessionRatings.struggled}</strong> Struggled
            </div>
          </div>

          <div className="celebrate-actions">
            <button className="primary-button" onClick={handleResetSession}>
              <RotateCcw size={16} /> Review Again
            </button>
            {onFinishSession && (
              <button className="hero-secondary" onClick={onFinishSession}>
                Back to Dashboard <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* If queue is empty */}
      {!sessionCompleted && queue.length === 0 && (
        <div className="srs-celebrate-card">
          <CheckCircle2 size={42} className="text-emerald-400" />
          <h2>You're All Caught Up For Today!</h2>
          <p>
            No questions are overdue right now. Great job staying on top of your spaced repetition intervals!
          </p>
        </div>
      )}
    </div>
  )
}
