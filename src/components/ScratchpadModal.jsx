import { useEffect, useState } from 'react'
import { Check, Copy, Download, Edit3, Sparkles, X } from 'lucide-react'

export default function ScratchpadModal({ isOpen, onClose, topicTitle = 'General Notes' }) {
  const storageKey = `devprep_scratchpad_${topicTitle.replace(/[^a-zA-Z0-9]/g, '_')}`
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedStatus, setSavedStatus] = useState('')

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(storageKey) || ''
      setNotes(saved)
    }
  }, [isOpen, storageKey])

  function handleChange(e) {
    const val = e.target.value
    setNotes(val)
    localStorage.setItem(storageKey, val)
    setSavedStatus('Saved')
    setTimeout(() => setSavedStatus(''), 2000)
  }

  function handleCopy() {
    navigator.clipboard.writeText(notes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topicTitle.replace(/[^a-zA-Z0-9]/g, '_')}_interview_notes.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="scratchpad-overlay" onClick={onClose}>
      <div className="scratchpad-drawer" onClick={e => e.stopPropagation()}>
        <div className="scratchpad-header">
          <div className="s-head-left">
            <Edit3 size={18} className="text-purple-400" />
            <div>
              <h3>My Study Notes: {topicTitle}</h3>
              <span className="s-status">
                {savedStatus ? (
                  <span className="text-emerald-400 font-medium">{savedStatus} to browser</span>
                ) : (
                  'Auto-saved in browser'
                )}
              </span>
            </div>
          </div>

          <div className="s-head-actions">
            <button
              className="s-icon-btn"
              onClick={handleCopy}
              title="Copy notes"
              aria-label="Copy notes"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button
              className="s-icon-btn"
              onClick={handleDownload}
              title="Download markdown file"
              aria-label="Download notes"
            >
              <Download size={16} />
            </button>
            <button
              className="s-icon-btn close-btn"
              onClick={onClose}
              title="Close notes drawer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="scratchpad-body">
          <p className="scratchpad-prompt">
            <Sparkles size={13} /> Jot down your personal talking points, previous company interview questions, or cheat sheet bullets for <strong>{topicTitle}</strong>.
          </p>
          <textarea
            className="scratchpad-textarea custom-scrollbar"
            placeholder={`### Key concepts for ${topicTitle}:\n- In my last interview, they asked about...\n- My personal answer structure:\n- Code snippet / trick:`}
            value={notes}
            onChange={handleChange}
          />
        </div>

        <div className="scratchpad-footer">
          <span>Markdown formatting supported</span>
          <button className="primary-button small-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
