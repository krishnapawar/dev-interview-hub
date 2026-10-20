import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, Code2, ExternalLink, FileText, Github, GraduationCap, LayoutDashboard,
  ListFilter, LoaderCircle, Menu, Moon, RefreshCw, Search, Sparkles, Star, Sun,
  X, Zap
} from 'lucide-react'
import { fetchRepositoryNotes, repositoryUrl } from './github'

const STORAGE_KEY = 'dev-interview-prep-v1'
const prettyName = path => path.split('/').pop().replace(/\.md$/i, '').replace(/[-_]/g, ' ')
const categoryFor = path => path.includes('/') ? path.split('/')[0].replace(/[-_]/g, ' ') : 'General'
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"bookmarks":[],"completed":[],"theme":"dark"}') }
  catch { return { bookmarks: [], completed: [], theme: 'dark' } }
}
const estimateMinutes = content => Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220))
const excerpt = content => content.replace(/```[\s\S]*?```/g, 'Code example').replace(/[#>*`_\-\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)

function App() {
  const [saved, setSaved] = useState(readSaved)
  const [notes, setNotes] = useState([])
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeNote, setActiveNote] = useState(null)
  const [view, setView] = useState('dashboard')
  const [category, setCategory] = useState('All topics')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [quizQueue, setQuizQueue] = useState([])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); document.documentElement.dataset.theme = saved.theme }, [saved])
  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    setLoading(true); setError('')
    try {
      const data = await fetchRepositoryNotes()
      setNotes(data.notes.sort((a, b) => a.path.localeCompare(b.path)))
      setBranch(data.branch)
      setActiveNote(current => current ? (data.notes.find(n => n.path === current.path) || data.notes[0] || null) : null)
    } catch (e) { setError(e.message || 'Could not load your notes.') }
    finally { setLoading(false) }
  }

  const categories = useMemo(() => ['All topics', ...new Set(notes.map(n => categoryFor(n.path)).sort())], [notes])
  const filtered = useMemo(() => notes.filter(n => {
    const matchesCategory = category === 'All topics' || categoryFor(n.path) === category
    const q = query.trim().toLowerCase()
    return matchesCategory && (!q || `${n.path} ${n.content}`.toLowerCase().includes(q))
  }), [notes, category, query])
  const bookmarkedNotes = useMemo(() => notes.filter(n => saved.bookmarks.includes(n.path)), [notes, saved.bookmarks])
  const selectedNote = activeNote && notes.find(n => n.path === activeNote.path)
  const totalWords = useMemo(() => notes.reduce((sum, n) => sum + n.content.split(/\s+/).filter(Boolean).length, 0), [notes])
  const completedCount = saved.completed.filter(path => notes.some(n => n.path === path)).length
  const progress = notes.length ? Math.round(completedCount / notes.length * 100) : 0

  function toggleBookmark(path) {
    setSaved(s => ({ ...s, bookmarks: s.bookmarks.includes(path) ? s.bookmarks.filter(p => p !== path) : [...s.bookmarks, path] }))
  }
  function toggleCompleted(path) {
    setSaved(s => ({ ...s, completed: s.completed.includes(path) ? s.completed.filter(p => p !== path) : [...s.completed, path] }))
  }
  function openNote(note) { setActiveNote(note); setView('reader'); setMobileMenu(false); setRevealed(false) }
  function startQuiz(source = notes) {
    const queue = [...source].sort(() => Math.random() - 0.5)
    setQuizQueue(queue); setQuizIndex(0); setRevealed(false); setView('quiz'); setMobileMenu(false)
  }
  function nextQuiz() { setQuizIndex(i => i + 1); setRevealed(false) }

  const currentQuizNote = quizQueue[quizIndex]
  const heading = view === 'reader' ? (selectedNote?.name || 'Notes') : view === 'quiz' ? 'Practice mode' : view === 'bookmarks' ? 'Saved notes' : 'Your preparation space'

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark"><Code2 size={21}/></div>
        <div><div className="brand-name">DevPrep<span>.</span></div><div className="brand-subtitle">INTERVIEW WORKSPACE</div></div>
        <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <div className="repo-pill"><span className="status-dot"/><span>Connected to GitHub</span><a href={repositoryUrl} target="_blank" rel="noreferrer" aria-label="Open GitHub repository"><ExternalLink size={13}/></a></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav">
        <button className={view === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('dashboard'); setMobileMenu(false) }}><LayoutDashboard size={17}/> Overview</button>
        <button className={view === 'reader' ? 'nav-item active' : 'nav-item'} onClick={() => { if (selectedNote) setView('reader'); else setView('dashboard'); setMobileMenu(false) }}><BookOpen size={17}/> Notes library <span className="nav-count">{notes.length}</span></button>
        <button className={view === 'bookmarks' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('bookmarks'); setMobileMenu(false) }}><Bookmark size={17}/> Bookmarks <span className="nav-count">{saved.bookmarks.length}</span></button>
        <button className={view === 'quiz' ? 'nav-item active' : 'nav-item'} onClick={() => startQuiz(notes)}><GraduationCap size={17}/> Quiz mode</button>
      </nav>
      <div className="nav-label topics-label">TOPICS</div>
      <div className="topic-list">
        {categories.filter(c => c !== 'All topics').slice(0, 8).map(c => <button key={c} className={category === c ? 'topic-item topic-active' : 'topic-item'} onClick={() => { setCategory(c); setView('dashboard'); setMobileMenu(false) }}><span className="topic-dot"/><span className="capitalize">{c}</span><span className="topic-number">{notes.filter(n => categoryFor(n.path) === c).length}</span></button>)}
        {!loading && categories.length <= 1 && <div className="sidebar-muted">Topics appear when notes load.</div>}
      </div>
      <div className="sidebar-bottom">
        <div className="progress-card">
          <div className="progress-top"><span>Revision progress</span><span>{progress}%</span></div>
          <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}/></div>
          <div className="progress-caption">{completedCount} of {notes.length} notes reviewed</div>
        </div>
        <button className="theme-toggle" onClick={() => setSaved(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))}>{saved.theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}<span>Switch to {saved.theme === 'dark' ? 'light' : 'dark'} mode</span></button>
        <a className="github-link" href={repositoryUrl} target="_blank" rel="noreferrer"><Github size={16}/> View source repository <ExternalLink size={13}/></a>
      </div>
    </aside>

    {mobileMenu && <button className="mobile-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{heading}</strong></div>
        </div>
        <div className="topbar-actions">
          <button className="sync-button" onClick={loadNotes} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/><span>{loading ? 'Syncing' : 'Sync notes'}</span></button>
          <a className="avatar" href="https://github.com/krishnapawar" target="_blank" rel="noreferrer" title="GitHub profile">KP</a>
        </div>
      </header>

      <div className="content-wrap">
        {view !== 'reader' && view !== 'quiz' && <div className="page-heading">
          <div><div className="eyebrow"><Sparkles size={13}/> YOUR PERSONAL TECH LIBRARY</div><h1>{view === 'bookmarks' ? 'Saved for later' : 'Prepare with confidence.'}</h1><p>{view === 'bookmarks' ? 'Your hand-picked notes for quick revision.' : 'One workspace for your technical interview journey.'}</p></div>
          <a href={repositoryUrl} target="_blank" rel="noreferrer" className="outline-button"><Github size={16}/> Open repository <ExternalLink size={13}/></a>
        </div>}

        {error && <div className="error-banner"><CircleHelp size={19}/><div><strong>Could not load GitHub notes</strong><p>{error}</p><button className="text-action" onClick={loadNotes}>Try again</button></div></div>}

        {view === 'dashboard' && <>
          <section className="hero-card">
            <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
            <div className="hero-content">
              <div className="hero-tag"><span className="hero-tag-dot"/> YOUR NEXT OPPORTUNITY STARTS HERE</div>
              <h2>Small revisions.<br/><span>Big confidence.</span></h2>
              <p>Your notes, organized and ready when you are. Keep learning, keep building, and walk into your next interview prepared.</p>
              <div className="hero-buttons"><button className="primary-button" onClick={() => openNote(filtered[0])} disabled={!filtered.length}><BookOpen size={16}/> Continue learning <ChevronRight size={16}/></button><button className="hero-secondary" onClick={() => startQuiz(notes)} disabled={!notes.length}><Zap size={15}/> Quick practice</button></div>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="art-core"><Code2 size={38}/></div><div className="floating-chip chip-a">{"{ }"}</div><div className="floating-chip chip-b"><Check size={18}/></div><div className="floating-chip chip-c">JS</div></div>
            <div className="hero-foot"><span><Github size={14}/> {repositoryUrl.replace('https://github.com/', '')}</span><span><span className="status-dot"/> Branch: {branch}</span></div>
          </section>

          <section className="stats-grid">
            <Stat icon={<FileText size={18}/>} label="TOTAL NOTES" value={loading ? '—' : notes.length} note="Markdown files discovered" tone="purple"/>
            <Stat icon={<Bookmark size={18}/>} label="BOOKMARKED" value={saved.bookmarks.length} note="Saved for quick access" tone="blue"/>
            <Stat icon={<Clock3 size={18}/>} label="READING TIME" value={`${Math.max(0, Math.ceil(totalWords / 220))}m`} note="Estimated across all notes" tone="green"/>
            <Stat icon={<GraduationCap size={18}/>} label="REVIEWED" value={`${completedCount}/${notes.length}`} note={`${progress}% revision progress`} tone="orange"/>
          </section>

          <section className="section-block">
            <div className="section-head"><div><h3>Explore your notes</h3><p>Pick a topic and get straight to the important stuff.</p></div><button className="subtle-button" onClick={() => {setCategory('All topics'); setQuery('')}}><ListFilter size={15}/> Clear filters</button></div>
            <SearchBar query={query} setQuery={setQuery}/>
            <div className="filter-row">{categories.map(c => <button key={c} className={category === c ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(c)}>{c === 'All topics' && <FileText size={13}/>}<span className="capitalize">{c}</span></button>)}</div>
            <div className="notes-grid">
              {loading && !notes.length ? <LoadingCards/> : filtered.map(note => <NoteCard key={note.path} note={note} bookmarked={saved.bookmarks.includes(note.path)} completed={saved.completed.includes(note.path)} onOpen={() => openNote(note)} onBookmark={() => toggleBookmark(note.path)}/>)}
            </div>
            {!loading && !filtered.length && <EmptyState title="No notes match your search" description="Try another keyword or clear the topic filter." onAction={() => {setQuery('');setCategory('All topics')}} action="Clear search"/>}
          </section>
        </>}

        {view === 'bookmarks' && <>
          <section className="section-block no-top">
            <div className="section-head"><div><h3>Your bookmarked notes</h3><p>Keep the most important concepts close at hand.</p></div></div>
            <SearchBar query={query} setQuery={setQuery}/>
            <div className="notes-grid">
              {loading && !notes.length ? <LoadingCards/> : bookmarkedNotes.filter(n => `${n.path} ${n.content}`.toLowerCase().includes(query.toLowerCase())).map(note => <NoteCard key={note.path} note={note} bookmarked completed={saved.completed.includes(note.path)} onOpen={() => openNote(note)} onBookmark={() => toggleBookmark(note.path)}/>)}
            </div>
            {!loading && !bookmarkedNotes.length && <EmptyState title="Nothing saved yet" description="Use the bookmark icon on any note to add it here." onAction={() => setView('dashboard')} action="Explore notes"/>}
          </section>
        </>}

        {view === 'reader' && <section className="reader-layout">
          <div className="reader-toolbar"><button className="back-button" onClick={() => setView('dashboard')}><ChevronLeft size={16}/> All notes</button><div className="reader-actions"><button className={selectedNote && saved.bookmarks.includes(selectedNote.path) ? 'reader-icon saved' : 'reader-icon'} onClick={() => selectedNote && toggleBookmark(selectedNote.path)} title="Bookmark note"><Bookmark size={16}/></button><button className={selectedNote && saved.completed.includes(selectedNote.path) ? 'reader-icon saved' : 'reader-icon'} onClick={() => selectedNote && toggleCompleted(selectedNote.path)} title="Mark reviewed"><Check size={16}/></button><a className="reader-icon" href={selectedNote?.url || repositoryUrl} target="_blank" rel="noreferrer" title="Open on GitHub"><ExternalLink size={16}/></a></div></div>
          {selectedNote ? <article className="markdown-panel">
            <div className="note-meta"><span className="note-category">{categoryFor(selectedNote.path)}</span><span><Clock3 size={13}/> {estimateMinutes(selectedNote.content)} min read</span><span><FileText size={13}/> Markdown</span></div>
            <h1 className="reader-title">{selectedNote.name.replace(/[-_]/g, ' ')}</h1>
            <div className="reader-path">{selectedNote.path}</div>
            <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNote.content}</ReactMarkdown></div>
            <div className="reader-footer"><button className="outline-button" onClick={() => toggleCompleted(selectedNote.path)}>{saved.completed.includes(selectedNote.path) ? <Check size={15}/> : <BookOpen size={15}/>} {saved.completed.includes(selectedNote.path) ? 'Reviewed' : 'Mark as reviewed'}</button><button className="primary-button" onClick={() => startQuiz([selectedNote])}><GraduationCap size={16}/> Practice this note</button></div>
          </article> : <EmptyState title="Select a note" description="Choose a Markdown file from the overview." onAction={() => setView('dashboard')} action="Go to overview"/>}
        </section>}

        {view === 'quiz' && <section className="quiz-page">
          <div className="quiz-topline"><button className="back-button" onClick={() => setView('dashboard')}><ChevronLeft size={16}/> Exit practice</button><span className="quiz-count">{quizQueue.length ? `${Math.min(quizIndex + 1, quizQueue.length)} / ${quizQueue.length}` : '0 questions'}</span></div>
          {currentQuizNote ? <div className="quiz-card">
            <div className="quiz-icon"><GraduationCap size={25}/></div><div className="eyebrow centered">ACTIVE RECALL SESSION</div>
            <h1>{revealed ? 'Review the key ideas' : 'Can you explain this topic?'}</h1>
            <p className="quiz-intro">Practice explaining a topic out loud before revealing your notes. This is active recall, not a multiple-choice test.</p>
            <div className="quiz-topic"><span className="note-category">{categoryFor(currentQuizNote.path)}</span><h2>{currentQuizNote.name.replace(/[-_]/g, ' ')}</h2><p>{currentQuizNote.path}</p></div>
            {revealed ? <div className="quiz-answer"><div className="answer-label"><Check size={15}/> YOUR REFERENCE NOTES</div><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQuizNote.content}</ReactMarkdown></div></div> : <div className="recall-prompt"><CircleHelp size={19}/><span>Explain the main concepts, trade-offs, and one practical example from memory. When you're ready, reveal the reference notes and check what you missed.</span></div>}
            <div className="quiz-controls">{!revealed ? <button className="primary-button" onClick={() => setRevealed(true)}>Reveal reference notes <ChevronRight size={16}/></button> : <button className="primary-button" onClick={() => {toggleCompleted(currentQuizNote.path); if (quizIndex + 1 >= quizQueue.length) { setView('dashboard') } else nextQuiz()}}><Check size={16}/> {quizIndex + 1 >= quizQueue.length ? 'Finish session' : 'Reviewed — next topic'} <ChevronRight size={16}/></button>}<button className="outline-button" onClick={() => startQuiz(notes)}><RefreshCw size={15}/> Shuffle topics</button></div>
          </div> : <EmptyState title="No notes available for practice" description="Load your GitHub notes first, then start a practice session." onAction={() => {loadNotes();setView('dashboard')}} action="Load notes"/>}
        </section>}
        <footer className="app-footer"><span>Built for consistent learning, one topic at a time.</span><span>Synced from <a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink size={11}/></a></span></footer>
      </div>
    </main>
  </div>
}

function Stat({icon,label,value,note,tone}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>
}
function SearchBar({query,setQuery}) {
  return <div className="search-wrap"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics, concepts, or keywords..." aria-label="Search notes"/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}<kbd>⌘ K</kbd></div>
}
function NoteCard({note,bookmarked,completed,onOpen,onBookmark}) {
  return <article className="note-card">
    <div className="note-card-top"><div className="file-icon"><FileText size={18}/></div><button className={bookmarked ? 'bookmark-button is-bookmarked' : 'bookmark-button'} onClick={onBookmark} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark note'}><Bookmark size={16}/></button></div>
    <div className="note-card-meta"><span className="note-category">{categoryFor(note.path)}</span>{completed && <span className="reviewed-tag"><Check size={11}/> Reviewed</span>}</div>
    <button className="note-card-title" onClick={onOpen}>{prettyName(note.path)}</button>
    <p className="note-excerpt">{excerpt(note.content) || 'Open this note to review the topic and its details.'}</p>
    <div className="note-card-bottom"><span><Clock3 size={13}/>{estimateMinutes(note.content)} min read</span><button onClick={onOpen}>Read note <ChevronRight size={14}/></button></div>
  </article>
}
function LoadingCards() {
  return <>{[1,2,3,4].map(i => <div className="skeleton-card" key={i}><div className="skeleton-line short"/><div className="skeleton-line title"/><div className="skeleton-line"/><div className="skeleton-line"/></div>)}</>
}
function EmptyState({title,description,action,onAction}) {
  return <div className="empty-state"><div className="empty-icon"><BookOpen size={22}/></div><h3>{title}</h3><p>{description}</p>{action && <button className="outline-button" onClick={onAction}>{action}</button>}</div>
}

export default App