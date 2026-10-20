import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { playSound } from '../utils/audio'

export default function QuestionExplorer({
  questions = [],
  saved,
  onToggleBookmark,
  onToggleMastered,
  onOpenNoteAtQuestion,
  soundEnabled = true,
}) {
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'mastered' | 'review' | 'bookmarked'
  const [expandedId, setExpandedId] = useState(null)

  const topics = ['All', ...new Set(questions.map(q => q.noteTitle || 'General'))]

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesTopic = selectedTopic === 'All' || (q.noteTitle || 'General') === selectedTopic
      const matchesSearch =
        !search.trim() ||
        `${q.question} ${q.answer}`.toLowerCase().includes(search.toLowerCase())

      let matchesStatus = true
      const isMastered = (saved.mastered || []).includes(q.id)
      const isBookmarked = (saved.bookmarks || []).includes(q.id)

      if (statusFilter === 'mastered') matchesStatus = isMastered
      if (statusFilter === 'review') matchesStatus = !isMastered
      if (statusFilter === 'bookmarked') matchesStatus = isBookmarked

      return matchesTopic && matchesSearch && matchesStatus
    })
  }, [questions, selectedTopic, search, statusFilter, saved.mastered, saved.bookmarks])

  function toggleExpand(id) {
    playSound('click', soundEnabled)
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="explorer-container">
      <div className="explorer-head">
        <div>
          <h2>Interview Question Bank</h2>
          <p>
            Explore all <strong>{questions.length}</strong> questions across your technical guides. Search, expand answers, and track your revision.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="explorer-controls">
        <div className="search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search questions or keywords (e.g. event loop, closure, join, replica set)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="explorer-filters-row">
          <div className="topic-chips custom-scrollbar">
            {topics.map(t => (
              <button
                key={t}
                className={`filter-chip ${selectedTopic === t ? 'selected' : ''}`}
                onClick={() => setSelectedTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="status-chips">
            <button
              className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({questions.length})
            </button>
            <button
              className={`status-pill ${statusFilter === 'mastered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('mastered')}
            >
              Mastered ({saved.mastered?.length || 0})
            </button>
            <button
              className={`status-pill ${statusFilter === 'bookmarked' ? 'active' : ''}`}
              onClick={() => setStatusFilter('bookmarked')}
            >
              Saved ({saved.bookmarks?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="explorer-results-bar">
        <span>Showing {filteredQuestions.length} questions</span>
        {search && <span className="query-tag">Matching: "{search}"</span>}
      </div>

      {/* Question Accordion List */}
      <div className="explorer-list">
        {filteredQuestions.map((q, idx) => {
          const isExpanded = expandedId === q.id
          const isBookmarked = (saved.bookmarks || []).includes(q.id)
          const isMastered = (saved.mastered || []).includes(q.id)

          return (
            <div
              key={q.id}
              className={`explorer-item ${isExpanded ? 'expanded' : ''} ${isMastered ? 'item-mastered' : ''}`}
            >
              <div className="explorer-item-header" onClick={() => toggleExpand(q.id)}>
                <div className="q-left">
                  <span className="q-index">#{idx + 1}</span>
                  <div className="q-topic-tag">{q.noteTitle}</div>
                  <h3 className="q-text">{q.question}</h3>
                </div>

                <div className="q-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className={`action-icon-btn ${isMastered ? 'mastered' : ''}`}
                    onClick={() => {
                      playSound('success', soundEnabled)
                      onToggleMastered(q.id)
                    }}
                    title={isMastered ? 'Marked Mastered (Click to undo)' : 'Mark as Mastered'}
                  >
                    <Check size={14} />
                  </button>

                  <button
                    className={`action-icon-btn ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={() => {
                      playSound('click', soundEnabled)
                      onToggleBookmark(q.id)
                    }}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                  >
                    <Bookmark size={14} />
                  </button>

                  <button
                    className="action-icon-btn expand-btn"
                    onClick={() => toggleExpand(q.id)}
                    title={isExpanded ? 'Collapse answer' : 'Expand answer'}
                  >
                    <ChevronDown size={16} className={isExpanded ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="explorer-item-body">
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{ code: CodeBlock }}
                    >
                      {q.answer || 'No details provided.'}
                    </ReactMarkdown>
                  </div>

                  <div className="explorer-item-footer">
                    <button
                      className="text-btn"
                      onClick={() => onOpenNoteAtQuestion(q)}
                    >
                      <span>Read in full guide ({q.noteTitle})</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredQuestions.length === 0 && (
          <div className="empty-state">
            <Sparkles size={28} />
            <h3>No questions found</h3>
            <p>Try searching with another keyword or resetting the topic filters.</p>
            <button
              className="outline-button"
              onClick={() => {
                setSearch('')
                setSelectedTopic('All')
                setStatusFilter('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
