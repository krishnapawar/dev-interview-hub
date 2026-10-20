import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, CornerDownLeft, FileText, HelpCircle, Search, X } from 'lucide-react'

export default function CommandPalette({
  isOpen,
  onClose,
  notes = [],
  questions = [],
  onSelectNote,
  onSelectQuestion,
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter notes and questions
  const filteredNotes = notes
    .filter(n => n.name.toLowerCase().includes(query.toLowerCase()) || n.path.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)

  const filteredQuestions = questions
    .filter(q => q.question.toLowerCase().includes(query.toLowerCase()) || q.answer.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)

  const combinedResults = [
    ...filteredNotes.map(n => ({ type: 'note', item: n })),
    ...filteredQuestions.map(q => ({ type: 'question', item: q })),
  ]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, combinedResults.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + combinedResults.length) % Math.max(1, combinedResults.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = combinedResults[selectedIndex]
        if (selected) {
          if (selected.type === 'note') {
            onSelectNote(selected.item)
          } else {
            onSelectQuestion(selected.item)
          }
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, combinedResults, onClose, onSelectNote, onSelectQuestion])

  if (!isOpen) return null

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a topic, question, or keyword (e.g. React, TDZ, Indexing, WebSocket)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="cmd-clear-btn" onClick={() => setQuery('')} aria-label="Clear query">
              <X size={15} />
            </button>
          )}
          <span className="cmd-esc-tag">ESC</span>
        </div>

        <div className="cmd-results custom-scrollbar">
          {combinedResults.length === 0 ? (
            <div className="cmd-no-results">
              <HelpCircle size={24} />
              <p>No matching notes or questions found for "{query}"</p>
            </div>
          ) : (
            <>
              {filteredNotes.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">TOPICS & GUIDES</div>
                  {filteredNotes.map((note, idx) => {
                    const isSelected = selectedIndex === idx
                    return (
                      <button
                        key={note.path}
                        className={`cmd-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectNote(note)
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="cmd-item-icon note-icon">
                          <BookOpen size={15} />
                        </div>
                        <div className="cmd-item-text">
                          <span className="cmd-item-title">{note.name}</span>
                          <span className="cmd-item-subtitle">{note.path}</span>
                        </div>
                        <span className="cmd-enter-tag">
                          <CornerDownLeft size={11} /> Select
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {filteredQuestions.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">INTERVIEW QUESTIONS ({filteredQuestions.length})</div>
                  {filteredQuestions.map((q, idx) => {
                    const actualIdx = filteredNotes.length + idx
                    const isSelected = selectedIndex === actualIdx
                    return (
                      <button
                        key={q.id}
                        className={`cmd-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectQuestion(q)
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(actualIdx)}
                      >
                        <div className="cmd-item-icon question-icon">
                          <FileText size={15} />
                        </div>
                        <div className="cmd-item-text">
                          <span className="cmd-item-title">{q.question}</span>
                          <span className="cmd-item-subtitle">{q.noteTitle || q.notePath}</span>
                        </div>
                        <span className="cmd-enter-tag">
                          <CornerDownLeft size={11} /> View
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigate: <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select: <kbd>↵ Enter</kbd></span>
          <span>Close: <kbd>Esc</kbd></span>
        </div>
      </div>
    </div>
  )
}
