import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import {
  PlusCircle,
  FileCode2,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Building2,
  Award,
  Layers,
  CheckCircle2,
  Eye,
  Edit3,
  Bookmark,
  ChevronRight,
} from 'lucide-react'
import { playSound } from '../utils/audio'

const COMPANIES = [
  'Google',
  'Amazon',
  'Meta',
  'Microsoft',
  'Apple',
  'Netflix',
  'Stripe',
  'Uber',
  'Startups',
  'General',
]

const CATEGORIES = [
  'Frontend',
  'Backend',
  'Databases',
  'System Design',
  'JavaScript',
  'DevOps',
  'Fullstack',
]

const DIFFICULTIES = ['Junior', 'Mid', 'Senior', 'Staff']

export default function CustomQuestionStudio({
  customQuestions = [],
  onAddQuestion,
  onDeleteQuestion,
  onImportQuestions,
  soundEnabled = true,
}) {
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'Frontend',
    company: 'General',
    difficulty: 'Mid',
  })
  const [previewTab, setPreviewTab] = useState('write') // 'write' | 'preview'
  const [selectedFilterCompany, setSelectedFilterCompany] = useState('All')

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return

    playSound('success', soundEnabled)
    const newQ = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      notePath: `custom/${form.category.toLowerCase()}`,
      noteTitle: `Custom: ${form.category}`,
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      company: form.company,
      difficulty: form.difficulty,
      isCustom: true,
      createdAt: new Date().toISOString(),
    }

    if (onAddQuestion) onAddQuestion(newQ)
    setForm({
      question: '',
      answer: '',
      category: 'Frontend',
      company: 'General',
      difficulty: 'Mid',
    })
    setPreviewTab('write')
  }

  // Export JSON
  function handleExportJSON() {
    playSound('click', soundEnabled)
    const jsonStr = JSON.stringify(customQuestions, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devprep-custom-questions-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import JSON
  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (Array.isArray(parsed)) {
          playSound('success', soundEnabled)
          if (onImportQuestions) onImportQuestions(parsed)
        }
      } catch (err) {
        alert('Invalid JSON file format.')
      }
    }
    reader.readAsText(file)
  }

  const filteredCustom = customQuestions.filter(
    q => selectedFilterCompany === 'All' || q.company === selectedFilterCompany
  )

  return (
    <div className="studio-wrapper">
      {/* Header */}
      <div className="studio-header">
        <div className="studio-title-area">
          <div className="studio-badge">
            <PlusCircle size={14} /> PERSONAL QUESTION STUDIO
          </div>
          <h2>Custom Question Creator & Company Tagging</h2>
          <p>
            Add real interview questions you faced during interviews, tag them by target company and seniority level, and include markdown answers with code examples.
          </p>
        </div>

        <div className="studio-actions">
          <label className="studio-btn">
            <Upload size={14} /> Import JSON
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            className="studio-btn"
            onClick={handleExportJSON}
            disabled={!customQuestions.length}
            title="Backup questions as JSON"
          >
            <Download size={14} /> Export ({customQuestions.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div className="studio-grid">
        {/* Left Column: Creator Form */}
        <div className="studio-form-column">
          <form className="studio-card" onSubmit={handleSubmit}>
            <div className="studio-card-head">
              <PlusCircle size={18} className="text-purple-400" />
              <h3>Add New Interview Question</h3>
            </div>

            {/* Selects Row: Category, Company, Difficulty */}
            <div className="studio-meta-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Target Company</label>
                <select
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                >
                  {COMPANIES.map(comp => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={e => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Title */}
            <div className="form-group">
              <label>Interview Question</label>
              <input
                type="text"
                placeholder="e.g. How does garbage collection work in V8 engine?"
                value={form.question}
                onChange={e => setForm({ ...form, question: e.target.value })}
                required
              />
            </div>

            {/* Answer Editor with Preview Tab */}
            <div className="form-group">
              <div className="answer-tab-row">
                <label>Benchmark Explanation & Code (Markdown)</label>
                <div className="sub-tabs">
                  <button
                    type="button"
                    className={`sub-tab ${previewTab === 'write' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('write')}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    className={`sub-tab ${previewTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {previewTab === 'write' ? (
                <textarea
                  className="studio-textarea custom-scrollbar"
                  rows={8}
                  placeholder="Explain the core mechanism, complexity trade-offs, and paste code examples..."
                  value={form.answer}
                  onChange={e => setForm({ ...form, answer: e.target.value })}
                  required
                />
              ) : (
                <div className="studio-preview-box custom-scrollbar">
                  {form.answer ? (
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ code: CodeBlock }}
                      >
                        {form.answer}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-muted text-xs">Nothing to preview yet.</span>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="primary-button studio-submit">
              <PlusCircle size={16} /> Save Question to Library
            </button>
          </form>
        </div>

        {/* Right Column: Custom Questions Directory */}
        <div className="studio-list-column">
          <div className="studio-list-card">
            <div className="list-card-head">
              <div>
                <h3>Personal Question Bank ({customQuestions.length})</h3>
                <p>Questions created here are instantly integrated into Flashcards and Practice.</p>
              </div>

              {/* Company Filter */}
              <select
                className="filter-select"
                value={selectedFilterCompany}
                onChange={e => setSelectedFilterCompany(e.target.value)}
              >
                <option value="All">All Companies</option>
                {COMPANIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="custom-items-list custom-scrollbar">
              {filteredCustom.map(q => (
                <article key={q.id} className="custom-q-card">
                  <div className="custom-q-meta">
                    <span className="company-pill">
                      <Building2 size={11} /> {q.company || 'General'}
                    </span>
                    <span className="diff-pill-sm">{q.difficulty || 'Mid'}</span>
                    <span className="cat-pill-sm">{q.category}</span>

                    <button
                      className="del-q-btn"
                      onClick={() => onDeleteQuestion(q.id)}
                      title="Delete question"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h4 className="custom-q-title">{q.question}</h4>

                  <details className="custom-q-details">
                    <summary>View Answer Details</summary>
                    <div className="markdown-body custom-details-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ code: CodeBlock }}
                      >
                        {q.answer}
                      </ReactMarkdown>
                    </div>
                  </details>
                </article>
              ))}

              {customQuestions.length === 0 && (
                <div className="studio-empty">
                  <PlusCircle size={32} />
                  <h4>No custom questions added yet</h4>
                  <p>
                    Use the form on the left to add your first custom interview question or import an existing JSON bank.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
