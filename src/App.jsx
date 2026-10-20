import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Award,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Filter,
  Flame,
  GitBranch,
  Github,
  Globe,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListFilter,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  RefreshCw,
  Search,
  Server,
  Shuffle,
  Sparkles,
  Sun,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import { fetchRepositoryNotes, repositoryUrl } from './github'
import {
  extractQuestionsFromNote,
  getTopicMetadata,
  parseNoteOutline,
} from './utils/markdownParser'
import { playSound } from './utils/audio'
import CodeBlock from './components/CodeBlock'
import TableOfContents from './components/TableOfContents'
import CommandPalette from './components/CommandPalette'
import FlashcardDeck from './components/FlashcardDeck'
import MockInterview from './components/MockInterview'
import QuestionExplorer from './components/QuestionExplorer'
import ScratchpadModal from './components/ScratchpadModal'

const STORAGE_KEY = 'devprep_interview_hub_v2'

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    bookmarks: [],
    completed: [], // Note paths completed
    mastered: [], // Question IDs mastered
    theme: 'dark',
    sound: true,
    fontSize: 'normal', // 'normal' | 'comfortable' | 'large'
  }
}

export default function App() {
  const [saved, setSaved] = useState(readSaved)
  const [notes, setNotes] = useState([])
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [activeNote, setActiveNote] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'reader' | 'flashcards' | 'mock' | 'explorer' | 'bookmarks'
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [scratchpadOpen, setScratchpadOpen] = useState(false)
  const [readerMode, setReaderMode] = useState('document') // 'document' | 'qa_cards'
  const [readingProgress, setReadingProgress] = useState(0)
  const [activeHeadingSlug, setActiveHeadingSlug] = useState('')
  const readerContentRef = useRef(null)

  // Persist saved state and apply theme
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    document.documentElement.dataset.theme = saved.theme
  }, [saved])

  // Initial load
  useEffect(() => {
    loadNotes()
  }, [])

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function loadNotes() {
    setLoading(true)
    setNotice('')
    try {
      const data = await fetchRepositoryNotes()
      const sorted = (data.notes || []).sort((a, b) => a.name.localeCompare(b.name))
      setNotes(sorted)
      setBranch(data.branch || 'main')
      if (data.notice) setNotice(data.notice)
      setActiveNote(curr => curr ? sorted.find(n => n.path === curr.path) || sorted[0] : sorted[0] || null)
    } catch (e) {
      setNotice('Serving cached notes.')
    } finally {
      setLoading(false)
    }
  }

  // Extract all questions from all notes
  const allQuestions = useMemo(() => {
    return notes.flatMap(note => extractQuestionsFromNote(note))
  }, [notes])

  // Outline for the active note
  const activeOutline = useMemo(() => {
    return activeNote ? parseNoteOutline(activeNote.content) : []
  }, [activeNote])

  // Questions for active note
  const activeNoteQuestions = useMemo(() => {
    return activeNote ? extractQuestionsFromNote(activeNote) : []
  }, [activeNote])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(notes.map(n => getTopicMetadata(n.path).category))
    return ['All', ...Array.from(set).sort()]
  }, [notes])

  // Filtered notes for dashboard
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const meta = getTopicMetadata(n.path)
      const matchesCategory = selectedCategory === 'All' || meta.category === selectedCategory
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || `${n.name} ${n.path} ${meta.description}`.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [notes, selectedCategory, query])

  // Bookmarked items
  const bookmarkedNotes = useMemo(() => {
    return notes.filter(n => saved.bookmarks.includes(n.path))
  }, [notes, saved.bookmarks])

  const bookmarkedQuestions = useMemo(() => {
    return allQuestions.filter(q => saved.bookmarks.includes(q.id))
  }, [allQuestions, saved.bookmarks])

  // Reading progress scroll handler
  useEffect(() => {
    function handleScroll() {
      if (view !== 'reader') return
      const el = document.documentElement
      const totalHeight = el.scrollHeight - el.clientHeight
      if (totalHeight > 0) {
        const percent = Math.min(100, Math.max(0, Math.round((el.scrollTop / totalHeight) * 100)))
        setReadingProgress(percent)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [view])

  // Toggle Bookmark for Note or Question
  function toggleBookmark(idOrPath) {
    playSound('click', saved.sound)
    setSaved(s => {
      const exists = (s.bookmarks || []).includes(idOrPath)
      const newBookmarks = exists
        ? s.bookmarks.filter(b => b !== idOrPath)
        : [...(s.bookmarks || []), idOrPath]
      return { ...s, bookmarks: newBookmarks }
    })
  }

  // Toggle Mastered Question
  function toggleMastered(questionId, forceStatus) {
    setSaved(s => {
      const isCurrentlyMastered = (s.mastered || []).includes(questionId)
      const shouldMaster = forceStatus !== undefined ? forceStatus : !isCurrentlyMastered
      const newMastered = shouldMaster
        ? Array.from(new Set([...(s.mastered || []), questionId]))
        : (s.mastered || []).filter(id => id !== questionId)
      return { ...s, mastered: newMastered }
    })
  }

  // Toggle Note Completed
  function toggleNoteCompleted(notePath) {
    playSound('success', saved.sound)
    setSaved(s => {
      const exists = (s.completed || []).includes(notePath)
      const newCompleted = exists
        ? s.completed.filter(p => p !== notePath)
        : [...(s.completed || []), notePath]
      return { ...s, completed: newCompleted }
    })
  }

  function openNote(note) {
    playSound('click', saved.sound)
    setActiveNote(note)
    setView('reader')
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openQuestionInReader(question) {
    const targetNote = notes.find(n => n.path === question.notePath)
    if (targetNote) {
      setActiveNote(targetNote)
      setView('reader')
      setMobileMenu(false)
      setTimeout(() => {
        const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3')
        for (const h of headings) {
          if (h.textContent.toLowerCase().includes(question.question.toLowerCase().slice(0, 20))) {
            h.scrollIntoView({ behavior: 'smooth', block: 'center' })
            h.classList.add('heading-highlight')
            setTimeout(() => h.classList.remove('heading-highlight'), 3000)
            break
          }
        }
      }, 300)
    }
  }

  function handleSelectHeading(item) {
    setActiveHeadingSlug(item.slug)
    const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3, .markdown-body h4')
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes(item.title.toLowerCase().slice(0, 15))) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' })
        h.classList.add('heading-highlight')
        setTimeout(() => h.classList.remove('heading-highlight'), 2500)
        break
      }
    }
  }

  // Stats calculation
  const totalQuestionsCount = allQuestions.length || 213
  const masteredCount = (saved.mastered || []).length
  const masteryPercentage = Math.round((masteredCount / Math.max(1, totalQuestionsCount)) * 100)
  const completedNotesCount = (saved.completed || []).filter(p => notes.some(n => n.path === p)).length
  const totalNotesCount = notes.length || 10

  const selectedNoteMeta = activeNote ? getTopicMetadata(activeNote.path, activeNote.name) : null

  return (
    <div className={`app-shell font-size-${saved.fontSize}`}>
      {/* Top Reading Progress Bar (in reader view) */}
      {view === 'reader' && (
        <div className="global-progress-bar">
          <div className="global-progress-fill" style={{ width: `${readingProgress}%` }} />
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Code2 size={22} />
          </div>
          <div>
            <div className="brand-name">
              DevPrep<span>.io</span>
            </div>
            <div className="brand-subtitle">INTERVIEW MASTERY HUB</div>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* GitHub Connection Badge */}
        <div className="repo-pill">
          <span className="status-dot pulse-dot" />
          <span className="truncate">krishnapawar/dev-notes</span>
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
            title="Open GitHub source repository"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Main Workspaces */}
        <div className="nav-label">STUDY MODES</div>
        <nav className="main-nav">
          <button
            className={view === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('dashboard')
              setMobileMenu(false)
            }}
          >
            <LayoutDashboard size={17} /> Overview
          </button>

          <button
            className={view === 'reader' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('reader')
              setMobileMenu(false)
            }}
          >
            <BookOpen size={17} /> Note Library
            <span className="nav-count">{notes.length}</span>
          </button>

          <button
            className={view === 'flashcards' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('flashcards')
              setMobileMenu(false)
            }}
          >
            <Zap size={17} /> Active Recall Flashcards
            <span className="nav-badge-hot">Interactive</span>
          </button>

          <button
            className={view === 'mock' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('mock')
              setMobileMenu(false)
            }}
          >
            <Trophy size={17} /> Mock Interview Round
            <span className="nav-badge-timer">Timed</span>
          </button>

          <button
            className={view === 'explorer' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('explorer')
              setMobileMenu(false)
            }}
          >
            <Layers size={17} /> Question Bank
            <span className="nav-count">{allQuestions.length}</span>
          </button>

          <button
            className={view === 'bookmarks' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('bookmarks')
              setMobileMenu(false)
            }}
          >
            <Bookmark size={17} /> Saved & Bookmarks
            <span className="nav-count">{saved.bookmarks?.length || 0}</span>
          </button>
        </nav>

        {/* Topic Quick Jump */}
        <div className="nav-label topics-label">TOPICS</div>
        <div className="topic-list custom-scrollbar">
          {notes.map(note => {
            const meta = getTopicMetadata(note.path)
            const isNoteActive = activeNote?.path === note.path && view === 'reader'
            return (
              <button
                key={note.path}
                className={`topic-item ${isNoteActive ? 'topic-active' : ''}`}
                onClick={() => openNote(note)}
              >
                <span className="topic-dot" style={{ background: meta.color }} />
                <span className="truncate">{meta.title}</span>
                {saved.completed.includes(note.path) && (
                  <Check size={12} className="text-emerald-400 ml-auto" />
                )}
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-bottom">
          <div className="progress-card">
            <div className="progress-top">
              <span>Interview Mastery</span>
              <span className="text-purple-300">{masteryPercentage}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(4, masteryPercentage)}%` }}
              />
            </div>
            <div className="progress-caption">
              {masteredCount} of {totalQuestionsCount} questions mastered
            </div>
          </div>

          <div className="sidebar-util-buttons">
            <button
              className="util-toggle-btn"
              onClick={() => {
                const nextTheme = saved.theme === 'dark' ? 'light' : 'dark'
                setSaved(s => ({ ...s, theme: nextTheme }))
              }}
              title="Toggle dark/light mode"
            >
              {saved.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{saved.theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
            </button>

            <button
              className="util-toggle-btn"
              onClick={() => setSaved(s => ({ ...s, sound: !s.sound }))}
              title="Toggle audio feedback"
            >
              {saved.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{saved.sound ? 'Sound on' : 'Sound muted'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenu && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="main-area">
        {/* Sticky Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>DevPrep</span>
              <ChevronRight size={14} />
              <strong>
                {view === 'dashboard' && 'Interview Dashboard'}
                {view === 'reader' && (activeNote?.name || 'Technical Note')}
                {view === 'flashcards' && 'Active Recall Flashcards'}
                {view === 'mock' && 'Mock Interview Simulator'}
                {view === 'explorer' && 'Question Bank'}
                {view === 'bookmarks' && 'Saved Questions & Notes'}
              </strong>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Quick Cmd+K Search Bar Button */}
            <button
              className="topbar-search-trigger"
              onClick={() => setCmdOpen(true)}
              aria-label="Open global search"
            >
              <Search size={14} />
              <span>Search notes & questions...</span>
              <kbd>⌘K</kbd>
            </button>

            {/* Sync Repository Button */}
            <button
              className="sync-button"
              onClick={loadNotes}
              disabled={loading}
              title="Sync notes from GitHub"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Sync notes'}</span>
            </button>

            {/* Profile Avatar */}
            <a
              className="avatar"
              href="https://github.com/krishnapawar"
              target="_blank"
              rel="noreferrer"
              title="GitHub Profile"
            >
              KP
            </a>
          </div>
        </header>

        {/* Notice Banner if Fallback/Rate Limit */}
        {notice && (
          <div className="notice-banner">
            <Sparkles size={16} />
            <span>{notice} All interview questions and guides are fully loaded and operational!</span>
          </div>
        )}

        {/* CONTENT CONTAINER */}
        <div className="content-wrap">
          {/* VIEW 1: DASHBOARD OVERVIEW */}
          {view === 'dashboard' && (
            <>
              {/* Hero Banner with Dynamic Glow and Action Buttons */}
              <section className="hero-card">
                <div className="hero-glow glow-one" />
                <div className="hero-glow glow-two" />
                <div className="hero-content">
                  <div className="hero-tag">
                    <Sparkles size={13} /> TECHNICAL INTERVIEW PREPARATION
                  </div>
                  <h2>
                    Speak Confidently.<br />
                    <span>Ace Every Round.</span>
                  </h2>
                  <p>
                    Curated technical interview notes, questions, and code architectures for fullstack engineers. Test your recall with interactive flashcards or timed mock rounds.
                  </p>

                  <div className="hero-buttons">
                    <button
                      className="primary-button"
                      onClick={() => setView('flashcards')}
                    >
                      <Zap size={16} /> Start Flashcard Practice <ChevronRight size={16} />
                    </button>
                    <button
                      className="hero-secondary"
                      onClick={() => setView('mock')}
                    >
                      <Trophy size={16} /> Mock Interview Round
                    </button>
                  </div>
                </div>

                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-a" />
                  <div className="orbit orbit-b" />
                  <div className="art-core">
                    <Code2 size={40} />
                  </div>
                  <div className="floating-chip chip-a">React</div>
                  <div className="floating-chip chip-b">Node</div>
                  <div className="floating-chip chip-c">SQL</div>
                </div>

                <div className="hero-foot">
                  <span>
                    <Github size={13} /> krishnapawar/dev-interview-notes
                  </span>
                  <span>
                    <span className="status-dot" /> Branch: {branch} • {totalQuestionsCount} Questions Loaded
                  </span>
                </div>
              </section>

              {/* High-Impact Stats Grid */}
              <section className="stats-grid">
                <div className="stat-card" onClick={() => setView('explorer')}>
                  <div className="stat-icon purple">
                    <Layers size={18} />
                  </div>
                  <div className="stat-label">TOTAL QUESTIONS</div>
                  <div className="stat-value">{totalQuestionsCount}</div>
                  <div className="stat-note">Across {totalNotesCount} technical domains</div>
                </div>

                <div className="stat-card" onClick={() => setView('flashcards')}>
                  <div className="stat-icon green">
                    <Award size={18} />
                  </div>
                  <div className="stat-label">MASTERED</div>
                  <div className="stat-value">
                    {masteredCount} <span className="stat-sub">({masteryPercentage}%)</span>
                  </div>
                  <div className="stat-note">Active recall verified</div>
                </div>

                <div className="stat-card" onClick={() => setView('bookmarks')}>
                  <div className="stat-icon blue">
                    <Bookmark size={18} />
                  </div>
                  <div className="stat-label">BOOKMARKED</div>
                  <div className="stat-value">{saved.bookmarks?.length || 0}</div>
                  <div className="stat-note">High priority questions</div>
                </div>

                <div className="stat-card" onClick={() => setView('reader')}>
                  <div className="stat-icon orange">
                    <BookOpen size={18} />
                  </div>
                  <div className="stat-label">TOPIC GUIDES</div>
                  <div className="stat-value">{completedNotesCount}/{totalNotesCount}</div>
                  <div className="stat-note">Guides marked reviewed</div>
                </div>
              </section>

              {/* Main Topics / Guides Grid */}
              <section className="section-block">
                <div className="section-head">
                  <div>
                    <h3>Technical Study Guides & Notes</h3>
                    <p>Select a guide to read in-depth explanations, code snippets, and architecture diagrams.</p>
                  </div>
                  <button
                    className="subtle-button"
                    onClick={() => {
                      setSelectedCategory('All')
                      setQuery('')
                    }}
                  >
                    <ListFilter size={14} /> Clear filters
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="filter-row">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={`filter-chip ${selectedCategory === cat ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Notes Grid */}
                <div className="notes-grid">
                  {filteredNotes.map(note => {
                    const meta = getTopicMetadata(note.path)
                    const isBookmarked = saved.bookmarks.includes(note.path)
                    const isCompleted = saved.completed.includes(note.path)
                    const noteQuestions = extractQuestionsFromNote(note)

                    return (
                      <article key={note.path} className="note-card">
                        <div className="note-card-top">
                          <div
                            className="file-icon"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            <FileCode2 size={20} />
                          </div>
                          <button
                            className={`bookmark-button ${isBookmarked ? 'is-bookmarked' : ''}`}
                            onClick={() => toggleBookmark(note.path)}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark guide'}
                          >
                            <Bookmark size={16} />
                          </button>
                        </div>

                        <div className="note-card-meta">
                          <span
                            className="note-category"
                            style={{ color: meta.color, background: `${meta.color}15` }}
                          >
                            {meta.category}
                          </span>
                          <span className="q-count-badge">
                            {noteQuestions.length} Questions
                          </span>
                          {isCompleted && (
                            <span className="reviewed-tag">
                              <Check size={11} /> Reviewed
                            </span>
                          )}
                        </div>

                        <button className="note-card-title" onClick={() => openNote(note)}>
                          {note.name}
                        </button>

                        <p className="note-excerpt">
                          {meta.description || 'Comprehensive technical interview questions and code references.'}
                        </p>

                        <div className="note-card-bottom">
                          <span className="read-time-tag">
                            <Clock size={12} /> ~{Math.max(3, Math.ceil(note.content.length / 1000))} min read
                          </span>
                          <button onClick={() => openNote(note)}>
                            Read guide <ChevronRight size={14} />
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          {/* VIEW 2: SUPERCHARGED READER */}
          {view === 'reader' && (
            <div className="reader-workspace">
              {/* Reader Top Toolbar */}
              <div className="reader-toolbar">
                <div className="reader-nav-actions">
                  <button className="back-button" onClick={() => setView('dashboard')}>
                    <ChevronLeft size={16} /> All guides
                  </button>

                  <div className="reader-mode-tabs">
                    <button
                      className={`mode-tab ${readerMode === 'document' ? 'active' : ''}`}
                      onClick={() => setReaderMode('document')}
                    >
                      <FileText size={14} /> Full Guide
                    </button>
                    <button
                      className={`mode-tab ${readerMode === 'qa_cards' ? 'active' : ''}`}
                      onClick={() => setReaderMode('qa_cards')}
                    >
                      <Layers size={14} /> Q&A Accordion ({activeNoteQuestions.length})
                    </button>
                  </div>
                </div>

                <div className="reader-controls-right">
                  {/* Font Size Adjuster */}
                  <div className="font-size-group">
                    <button
                      className={`font-btn ${saved.fontSize === 'normal' ? 'active' : ''}`}
                      onClick={() => setSaved(s => ({ ...s, fontSize: 'normal' }))}
                      title="Normal font size"
                    >
                      A
                    </button>
                    <button
                      className={`font-btn ${saved.fontSize === 'comfortable' ? 'active' : ''}`}
                      onClick={() => setSaved(s => ({ ...s, fontSize: 'comfortable' }))}
                      title="Comfortable font size"
                    >
                      A+
                    </button>
                    <button
                      className={`font-btn ${saved.fontSize === 'large' ? 'active' : ''}`}
                      onClick={() => setSaved(s => ({ ...s, fontSize: 'large' }))}
                      title="Large font size"
                    >
                      A++
                    </button>
                  </div>

                  {/* Personal Notes Scratchpad Button */}
                  <button
                    className="reader-action-pill"
                    onClick={() => setScratchpadOpen(true)}
                    title="Open study notes scratchpad"
                  >
                    <Edit3 size={15} />
                    <span className="hidden md:inline">My Notes</span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    className={`reader-icon ${activeNote && saved.bookmarks.includes(activeNote.path) ? 'saved' : ''}`}
                    onClick={() => activeNote && toggleBookmark(activeNote.path)}
                    title="Bookmark this note"
                  >
                    <Bookmark size={16} />
                  </button>

                  {/* Mark Completed Button */}
                  <button
                    className={`reader-icon ${activeNote && saved.completed.includes(activeNote.path) ? 'saved' : ''}`}
                    onClick={() => activeNote && toggleNoteCompleted(activeNote.path)}
                    title="Mark guide as reviewed"
                  >
                    <Check size={16} />
                  </button>

                  {/* Open GitHub Source */}
                  <a
                    className="reader-icon"
                    href={activeNote?.url || repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on GitHub"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Main Reader Layout with Outline */}
              <div className="reader-split-layout">
                {/* Outline / Table of Contents Sidebar */}
                <div className="reader-toc-column">
                  <TableOfContents
                    outline={activeOutline}
                    activeSlug={activeHeadingSlug}
                    onSelectHeading={handleSelectHeading}
                  />
                </div>

                {/* Article Content */}
                <div className="reader-main-column" ref={readerContentRef}>
                  {activeNote ? (
                    <article className="markdown-panel">
                      <div className="note-meta-header">
                        <span
                          className="note-category-tag"
                          style={{
                            color: selectedNoteMeta?.color || '#a89cff',
                            background: `${selectedNoteMeta?.color || '#a89cff'}18`,
                          }}
                        >
                          {selectedNoteMeta?.category || 'Technical Guide'}
                        </span>
                        <span>
                          <Clock size={13} /> ~{Math.max(3, Math.ceil(activeNote.content.length / 1000))} min read
                        </span>
                        <span>
                          <Layers size={13} /> {activeNoteQuestions.length} Questions
                        </span>
                      </div>

                      <h1 className="reader-title">{activeNote.name}</h1>
                      <div className="reader-filepath">{activeNote.path}</div>

                      {/* Continuous Markdown Mode */}
                      {readerMode === 'document' ? (
                        <div className="markdown-body">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: CodeBlock,
                            }}
                          >
                            {activeNote.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        /* Interactive Q&A Accordion Cards Mode */
                        <div className="reader-accordion-mode">
                          <div className="accordion-instructions">
                            <Sparkles size={16} />
                            <span>
                              Interactive Q&A Mode: Expand any question below to test yourself on individual questions and answers.
                            </span>
                          </div>
                          {activeNoteQuestions.map((q, idx) => {
                            const isMastered = saved.mastered?.includes(q.id)
                            return (
                              <details key={q.id} className="reader-q-card">
                                <summary className="reader-q-summary">
                                  <span className="q-badge">Q{idx + 1}</span>
                                  <span className="q-title">{q.question}</span>
                                  {isMastered && (
                                    <span className="mastered-pill">
                                      <Check size={11} /> Mastered
                                    </span>
                                  )}
                                </summary>
                                <div className="reader-q-content">
                                  <div className="markdown-body">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{ code: CodeBlock }}
                                    >
                                      {q.answer || 'No answer details.'}
                                    </ReactMarkdown>
                                  </div>
                                  <div className="reader-q-actions">
                                    <button
                                      className={`outline-button small-btn ${isMastered ? 'active-mastered' : ''}`}
                                      onClick={() => toggleMastered(q.id)}
                                    >
                                      <Check size={13} /> {isMastered ? 'Marked Mastered' : 'Mark Mastered'}
                                    </button>
                                  </div>
                                </div>
                              </details>
                            )
                          })}
                        </div>
                      )}

                      {/* Reader Footer Controls */}
                      <div className="reader-footer">
                        <button
                          className="outline-button"
                          onClick={() => toggleNoteCompleted(activeNote.path)}
                        >
                          <Check size={15} />{' '}
                          {saved.completed.includes(activeNote.path) ? 'Completed' : 'Mark as completed'}
                        </button>
                        <button
                          className="primary-button"
                          onClick={() => setView('flashcards')}
                        >
                          <Zap size={16} /> Practice with Flashcards
                        </button>
                      </div>
                    </article>
                  ) : (
                    <div className="empty-state">
                      <BookOpen size={28} />
                      <h3>No note selected</h3>
                      <button className="primary-button" onClick={() => setView('dashboard')}>
                        Return to overview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: ACTIVE RECALL FLASHCARDS */}
          {view === 'flashcards' && (
            <FlashcardDeck
              questions={allQuestions}
              saved={saved}
              onToggleBookmark={toggleBookmark}
              onToggleMastered={toggleMastered}
              onOpenNote={openNote}
              soundEnabled={saved.sound}
            />
          )}

          {/* VIEW 4: MOCK INTERVIEW SIMULATOR */}
          {view === 'mock' && (
            <MockInterview
              questions={allQuestions}
              onExit={() => setView('dashboard')}
              soundEnabled={saved.sound}
            />
          )}

          {/* VIEW 5: QUESTION BANK EXPLORER */}
          {view === 'explorer' && (
            <QuestionExplorer
              questions={allQuestions}
              saved={saved}
              onToggleBookmark={toggleBookmark}
              onToggleMastered={toggleMastered}
              onOpenNoteAtQuestion={openQuestionInReader}
              soundEnabled={saved.sound}
            />
          )}

          {/* VIEW 6: BOOKMARKS */}
          {view === 'bookmarks' && (
            <div className="bookmarks-view">
              <div className="section-head">
                <div>
                  <h2>Saved Questions & Guides</h2>
                  <p>Fast access to concepts and questions you flagged for review.</p>
                </div>
              </div>

              {/* Bookmarked Questions */}
              {bookmarkedQuestions.length > 0 && (
                <div className="bm-section">
                  <h3>Saved Questions ({bookmarkedQuestions.length})</h3>
                  <div className="bm-questions-grid">
                    {bookmarkedQuestions.map(q => (
                      <div key={q.id} className="bm-q-card">
                        <div className="bm-q-head">
                          <span className="topic-tag">{q.noteTitle}</span>
                          <button
                            className="bookmark-active-btn"
                            onClick={() => toggleBookmark(q.id)}
                            title="Remove bookmark"
                          >
                            <Bookmark size={15} />
                          </button>
                        </div>
                        <h4 className="bm-q-title">{q.question}</h4>
                        <div className="bm-q-foot">
                          <button
                            className="text-link"
                            onClick={() => openQuestionInReader(q)}
                          >
                            Read answer <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookmarked Guides */}
              {bookmarkedNotes.length > 0 && (
                <div className="bm-section">
                  <h3>Saved Guides ({bookmarkedNotes.length})</h3>
                  <div className="notes-grid">
                    {bookmarkedNotes.map(n => (
                      <article key={n.path} className="note-card">
                        <button className="note-card-title" onClick={() => openNote(n)}>
                          {n.name}
                        </button>
                        <p className="note-excerpt">{n.path}</p>
                        <div className="note-card-bottom">
                          <button onClick={() => openNote(n)}>
                            Open guide <ChevronRight size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {bookmarkedQuestions.length === 0 && bookmarkedNotes.length === 0 && (
                <div className="empty-state">
                  <Bookmark size={32} />
                  <h3>No bookmarks yet</h3>
                  <p>Click the bookmark icon on any guide or interview question to save it here.</p>
                  <button className="primary-button" onClick={() => setView('explorer')}>
                    Explore Question Bank
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <footer className="app-footer">
            <span>Built for developers preparing for high-impact technical interviews.</span>
            <span>
              Synced from{' '}
              <a href={repositoryUrl} target="_blank" rel="noreferrer">
                GitHub Repository <ExternalLink size={12} />
              </a>
            </span>
          </footer>
        </div>
      </main>

      {/* Global Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        notes={notes}
        questions={allQuestions}
        onSelectNote={openNote}
        onSelectQuestion={openQuestionInReader}
      />

      {/* Personal Notes Scratchpad Drawer */}
      <ScratchpadModal
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        topicTitle={activeNote?.name || 'General Notes'}
      />
    </div>
  )
}