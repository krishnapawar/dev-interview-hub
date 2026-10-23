import { useState, useMemo } from 'react'
import {
  Zap,
  Printer,
  Download,
  Copy,
  Check,
  Search,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Share2,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { CRAM_CHEATS } from '../data/cramNotes'
import { playSound } from '../utils/audio'

export default function CramSheet({
  bookmarkedQuestions = [],
  soundEnabled = true,
}) {
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  // Topics list
  const topics = ['All', ...CRAM_CHEATS.map(c => c.topic), 'Bookmarked']

  // Filtered items
  const filteredSections = useMemo(() => {
    let sections = CRAM_CHEATS

    if (selectedTopic === 'Bookmarked') {
      // Build a section from user's bookmarked questions
      if (!bookmarkedQuestions.length) return []
      return [
        {
          topic: 'Your Bookmarked Questions',
          color: '#fbbf24',
          items: bookmarkedQuestions.map(q => ({
            question: q.question,
            definition: q.answer ? q.answer.slice(0, 180).replace(/^[#\s*`-]+/, '') + '...' : 'Review answer in full guide.',
            trap: 'Review edge cases and error handling for this topic.',
            seniorTip: 'Always explain the system trade-offs and performance implications.',
          })),
        },
      ]
    }

    if (selectedTopic !== 'All') {
      sections = sections.filter(s => s.topic === selectedTopic)
    }

    if (!search.trim()) return sections

    const q = search.toLowerCase()
    return sections
      .map(s => ({
        ...s,
        items: s.items.filter(
          item =>
            item.question.toLowerCase().includes(q) ||
            item.definition.toLowerCase().includes(q) ||
            item.trap.toLowerCase().includes(q) ||
            item.seniorTip.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.items.length > 0)
  }, [selectedTopic, search, bookmarkedQuestions])

  // Print handler
  function handlePrint() {
    playSound('click', soundEnabled)
    window.print()
  }

  // Export Markdown handler
  function handleExportMarkdown() {
    playSound('success', soundEnabled)
    let md = `# DevPrep — Technical Interview 30-Minute Cram Sheet\n`
    md += `*Generated on ${new Date().toLocaleDateString()} — Rapid Interview Recall*\n\n`

    filteredSections.forEach(sec => {
      md += `## 📚 ${sec.topic}\n\n`
      sec.items.forEach(item => {
        md += `### ${item.question}\n`
        md += `- **Definition:** ${item.definition}\n`
        md += `- **⚠️ Interviewer Trap:** ${item.trap}\n`
        md += `- **💡 Senior Tip:** ${item.seniorTip}\n\n`
      })
    })

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-cram-sheet-${selectedTopic.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy Markdown
  function handleCopyMarkdown() {
    playSound('click', soundEnabled)
    let md = `# DevPrep — 30-Minute Cram Sheet\n\n`
    filteredSections.forEach(sec => {
      md += `## ${sec.topic}\n`
      sec.items.forEach(item => {
        md += `### ${item.question}\n`
        md += `- Definition: ${item.definition}\n`
        md += `- Trap: ${item.trap}\n`
        md += `- Tip: ${item.seniorTip}\n\n`
      })
    })

    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalCramItems = filteredSections.reduce((acc, s) => acc + s.items.length, 0)

  return (
    <div className="cram-wrapper">
      {/* Non-printed Controls Header */}
      <div className="cram-header no-print">
        <div className="cram-title-area">
          <div className="cram-badge">
            <Zap size={14} /> 30-MINUTE HIGH-YIELD REVISION
          </div>
          <h2>Interview Day Cram Sheet</h2>
          <p>
            Quick 1-liner definitions, interviewer traps, and senior talking points for rapid revision right before your technical interview.
          </p>
        </div>

        <div className="cram-actions">
          <button
            className="cram-action-btn"
            onClick={handleCopyMarkdown}
            title="Copy as Markdown"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            className="cram-action-btn"
            onClick={handleExportMarkdown}
            title="Download Markdown file"
          >
            <Download size={15} />
            <span>Export .MD</span>
          </button>

          <button
            className="cram-print-btn"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            <span>Print One-Sheet (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (no-print) */}
      <div className="cram-controls no-print">
        <div className="cram-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search cram sheet concepts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="cram-chips custom-scrollbar">
          {topics.map(t => (
            <button
              key={t}
              className={`cram-chip ${selectedTopic === t ? 'active' : ''}`}
              onClick={() => setSelectedTopic(t)}
            >
              {t === 'Bookmarked' ? <Bookmark size={12} className="inline mr-1" /> : null}
              {t}
              {t === 'Bookmarked' && ` (${bookmarkedQuestions.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Print-only Title Header (shows up when printing) */}
      <div className="print-only print-header">
        <h1>DevPrep — 30-Minute Technical Interview Cram Sheet</h1>
        <p>Curated 1-sentence definitions, edge cases, and architectural nuances • Generated for {selectedTopic}</p>
      </div>

      {/* Main Cram Content */}
      <div className="cram-content-sections">
        {filteredSections.map(sec => (
          <div key={sec.topic} className="cram-topic-block">
            <div className="cram-topic-head">
              <span className="topic-indicator" style={{ background: sec.color }} />
              <h3>{sec.topic}</h3>
              <span className="cram-count">{sec.items.length} High-Yield Concepts</span>
            </div>

            <div className="cram-cards-grid">
              {sec.items.map((item, idx) => (
                <article key={idx} className="cram-card">
                  <div className="cram-card-top">
                    <span className="cram-num">#{idx + 1}</span>
                    <h4 className="cram-q-title">{item.question}</h4>
                  </div>

                  {/* 1. Definition */}
                  <div className="cram-point def">
                    <div className="cram-icon-tag def">
                      <Sparkles size={13} /> 1-Liner Definition
                    </div>
                    <p>{item.definition}</p>
                  </div>

                  {/* 2. Trap */}
                  <div className="cram-point trap">
                    <div className="cram-icon-tag trap">
                      <AlertTriangle size={13} /> Interviewer Trap
                    </div>
                    <p>{item.trap}</p>
                  </div>

                  {/* 3. Senior Tip */}
                  <div className="cram-point tip">
                    <div className="cram-icon-tag tip">
                      <Lightbulb size={13} /> Senior Nuance
                    </div>
                    <p>{item.seniorTip}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="cram-empty">
            <Bookmark size={32} />
            <h3>No cram items found</h3>
            <p>
              {selectedTopic === 'Bookmarked'
                ? 'You have not bookmarked any questions yet. Bookmark questions in the guides or question bank to see them in this cram sheet.'
                : 'Try adjusting your search filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
