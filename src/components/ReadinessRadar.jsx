import { useMemo } from 'react'
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Target,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { getTopicMetadata } from '../utils/markdownParser'
import { playSound } from '../utils/audio'

export default function ReadinessRadar({
  notes = [],
  allQuestions = [],
  saved = { mastered: [], completed: [], customQuestions: [] },
  onOpenQuestion,
  onSelectTopic,
  soundEnabled = true,
}) {
  // Domain categories
  const DOMAINS = [
    { name: 'Frontend', key: 'Frontend', color: '#00d8ff', match: /react|javascript/i },
    { name: 'Backend', key: 'Backend', color: '#22c55e', match: /node|express|php|laravel/i },
    { name: 'Databases', key: 'Databases', color: '#3b82f6', match: /sql|database|mongo/i },
    { name: 'Protocols', key: 'Protocols', color: '#a855f7', match: /websocket/i },
    { name: 'DevOps', key: 'DevOps', color: '#f97316', match: /git/i },
    { name: 'Fullstack', key: 'Fullstack', color: '#ec4899', match: /mern|fullstack/i },
  ]

  // Compute domain readiness scores
  const domainStats = useMemo(() => {
    return DOMAINS.map(d => {
      const questionsInDomain = allQuestions.filter(q => {
        const meta = getTopicMetadata(q.notePath || '', q.noteTitle)
        return meta.category === d.name || d.match.test(q.noteTitle || '')
      })

      const total = questionsInDomain.length || 1
      const mastered = questionsInDomain.filter(q => (saved.mastered || []).includes(q.id)).length
      const score = Math.min(100, Math.round((mastered / total) * 100))

      let tier = 'Needs Focus'
      if (score >= 80) tier = 'Interview Ready'
      else if (score >= 50) tier = 'Proficient'
      else if (score >= 20) tier = 'In Progress'

      return {
        ...d,
        total: questionsInDomain.length,
        mastered,
        score,
        tier,
        unmasteredQuestions: questionsInDomain.filter(q => !(saved.mastered || []).includes(q.id)),
      }
    })
  }, [allQuestions, saved.mastered])

  // Overall Readiness Score
  const overallScore = useMemo(() => {
    if (!domainStats.length) return 0
    const sum = domainStats.reduce((acc, d) => acc + d.score, 0)
    return Math.round(sum / domainStats.length)
  }, [domainStats])

  // Overall Grade
  const grade = useMemo(() => {
    if (overallScore >= 90) return { letter: 'A+', label: 'Elite FAANG Candidate', color: '#34d399' }
    if (overallScore >= 80) return { letter: 'A', label: 'Interview Ready', color: '#34d399' }
    if (overallScore >= 70) return { letter: 'B+', label: 'Strong Competency', color: '#60a5fa' }
    if (overallScore >= 50) return { letter: 'B', label: 'Good Foundation', color: '#fbbf24' }
    if (overallScore >= 30) return { letter: 'C', label: 'Growing Momentum', color: '#f97316' }
    return { letter: 'D', label: 'Early Revision Stage', color: '#f87171' }
  }, [overallScore])

  // Weakest Domain Diagnostic
  const weakestDomain = useMemo(() => {
    return [...domainStats].sort((a, b) => a.score - b.score)[0]
  }, [domainStats])

  // Recommended next 5 questions to study
  const recommendedQuestions = useMemo(() => {
    if (!weakestDomain) return []
    return weakestDomain.unmasteredQuestions.slice(0, 5)
  }, [weakestDomain])

  // Calculate SVG Radar polygon points
  const radarPoints = useMemo(() => {
    const size = 260
    const center = size / 2
    const radius = 95
    const total = domainStats.length

    const points = domainStats.map((d, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2
      const valueRatio = Math.max(0.12, d.score / 100)
      const x = center + radius * valueRatio * Math.cos(angle)
      const y = center + radius * valueRatio * Math.sin(angle)
      return { x, y, name: d.name, score: d.score, angle, color: d.color }
    })

    const svgPolygon = points.map(p => `${p.x},${p.y}`).join(' ')
    return { points, svgPolygon, center, radius, size }
  }, [domainStats])

  return (
    <div className="radar-dashboard-section">
      <div className="radar-card">
        {/* Header */}
        <div className="radar-head">
          <div className="radar-title-wrap">
            <Target size={20} className="text-purple-400" />
            <div>
              <h3>Candidate Readiness Radar & Diagnostics</h3>
              <p>Multi-domain technical competency breakdown and weak-spot diagnostic engine.</p>
            </div>
          </div>

          {/* Overall Grade Pill */}
          <div className="grade-badge" style={{ borderColor: grade.color }}>
            <span className="grade-letter" style={{ color: grade.color }}>{grade.letter}</span>
            <div className="grade-text">
              <strong>{grade.label}</strong>
              <small>{overallScore}% Composite Readiness</small>
            </div>
          </div>
        </div>

        {/* Content Split: SVG Radar Left, Domain Breakdown Right */}
        <div className="radar-body-grid">
          {/* Radar Visualization */}
          <div className="radar-visual-col">
            <svg
              className="radar-svg"
              viewBox={`0 0 ${radarPoints.size} ${radarPoints.size}`}
            >
              {/* Spider concentric background rings */}
              {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
                <circle
                  key={i}
                  cx={radarPoints.center}
                  cy={radarPoints.center}
                  r={radarPoints.radius * scale}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray={scale < 1 ? '3 3' : 'none'}
                />
              ))}

              {/* Axis rays */}
              {radarPoints.points.map((p, i) => {
                const outerX = radarPoints.center + radarPoints.radius * Math.cos(p.angle)
                const outerY = radarPoints.center + radarPoints.radius * Math.sin(p.angle)
                return (
                  <line
                    key={i}
                    x1={radarPoints.center}
                    y1={radarPoints.center}
                    x2={outerX}
                    y2={outerY}
                    stroke="rgba(255, 255, 255, 0.1)"
                  />
                )
              })}

              {/* Data polygon */}
              <polygon
                points={radarPoints.svgPolygon}
                fill="rgba(139, 124, 246, 0.25)"
                stroke="#a78bfa"
                strokeWidth="2.5"
              />

              {/* Points */}
              {radarPoints.points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill={p.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Label */}
                  <text
                    x={radarPoints.center + (radarPoints.radius + 20) * Math.cos(p.angle)}
                    y={radarPoints.center + (radarPoints.radius + 14) * Math.sin(p.angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {p.name} ({p.score}%)
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Domain Breakdown Bars */}
          <div className="radar-bars-col">
            <div className="domain-bars-list">
              {domainStats.map(d => (
                <div key={d.key} className="domain-bar-item">
                  <div className="bar-item-top">
                    <span className="bar-dot" style={{ background: d.color }} />
                    <span className="bar-domain-name">{d.name}</span>
                    <span className="bar-count-tag">
                      {d.mastered}/{d.total} Mastered
                    </span>
                    <span className={`bar-tier-tag ${d.tier.toLowerCase().replace(/\s+/g, '-')}`}>
                      {d.score}% • {d.tier}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(4, d.score)}%`,
                        background: d.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Weak-Spot Recommendation */}
        {weakestDomain && recommendedQuestions.length > 0 && (
          <div className="diagnostic-recommendation-box">
            <div className="rec-box-header">
              <AlertTriangle size={16} className="text-amber-400" />
              <div>
                <strong>Priority Focus Area: {weakestDomain.name} ({weakestDomain.score}%)</strong>
                <p>To maximize interview readiness, study these recommended high-frequency questions next:</p>
              </div>
            </div>

            <div className="rec-questions-grid">
              {recommendedQuestions.map(q => (
                <button
                  key={q.id}
                  className="rec-q-card"
                  onClick={() => {
                    playSound('click', soundEnabled)
                    if (onOpenQuestion) onOpenQuestion(q)
                  }}
                >
                  <span className="rec-q-title">{q.question}</span>
                  <span className="rec-q-link">
                    Study Now <ChevronRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
