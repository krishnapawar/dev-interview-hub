import { useState, useEffect } from 'react'
import {
  Users,
  Server,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Copy,
  Check,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Layers,
  Cpu,
  Database,
  ArrowRight,
  Edit3,
  Trash2,
} from 'lucide-react'
import { BEHAVIORAL_PROMPTS, SYSTEM_DESIGN_TOPICS } from '../data/behavioralAndSystemDesign'
import { playSound } from '../utils/audio'

const STORAGE_KEY_STAR = 'devprep_star_stories_v1'

function getSavedStories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAR)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function BehavioralDesignHub({ soundEnabled = true }) {
  const [activeTab, setActiveTab] = useState('star') // 'star' | 'system_design'
  const [selectedPromptId, setSelectedPromptId] = useState(BEHAVIORAL_PROMPTS[0].id)
  const [savedStories, setSavedStories] = useState(getSavedStories)
  const [copiedId, setCopiedId] = useState(null)

  const activePrompt = BEHAVIORAL_PROMPTS.find(p => p.id === selectedPromptId) || BEHAVIORAL_PROMPTS[0]

  // Form state for current prompt
  const [storyForm, setStoryForm] = useState({
    situation: '',
    task: '',
    action: '',
    result: '',
  })

  // Load existing story if saved
  useEffect(() => {
    if (savedStories[activePrompt.id]) {
      setStoryForm(savedStories[activePrompt.id])
    } else {
      setStoryForm({ situation: '', task: '', action: '', result: '' })
    }
  }, [activePrompt.id, savedStories])

  // Save story to local storage
  function handleSaveStory() {
    playSound('success', soundEnabled)
    const updated = {
      ...savedStories,
      [activePrompt.id]: {
        ...storyForm,
        promptTitle: activePrompt.title,
        updatedAt: new Date().toLocaleDateString(),
      },
    }
    setSavedStories(updated)
    try {
      localStorage.setItem(STORAGE_KEY_STAR, JSON.stringify(updated))
    } catch {}
  }

  // Load sample guidance into inputs
  function handleLoadSample() {
    playSound('click', soundEnabled)
    setStoryForm(activePrompt.sampleGuidance)
  }

  // Delete saved story
  function handleDeleteStory(id) {
    playSound('click', soundEnabled)
    const updated = { ...savedStories }
    delete updated[id]
    setSavedStories(updated)
    try {
      localStorage.setItem(STORAGE_KEY_STAR, JSON.stringify(updated))
    } catch {}
    if (activePrompt.id === id) {
      setStoryForm({ situation: '', task: '', action: '', result: '' })
    }
  }

  // Copy full story
  function handleCopyStory(story) {
    playSound('click', soundEnabled)
    const text = `STAR Interview Story: ${story.promptTitle || activePrompt.title}\n\n[Situation]\n${story.situation}\n\n[Task]\n${story.task}\n\n[Action]\n${story.action}\n\n[Result]\n${story.result}`
    navigator.clipboard.writeText(text)
    setCopiedId(activePrompt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="hub-wrapper">
      {/* Top Header */}
      <div className="hub-header">
        <div className="hub-title-area">
          <div className="hub-badge">
            <Users size={14} /> COMPLETE INTERVIEW PREPARATION
          </div>
          <h2>STAR Behavioral & System Design Simulator</h2>
          <p>
            Master the other two pillars of senior engineering interviews: articulate your career impact using the STAR framework and review core distributed system design architectures.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="hub-tabs">
          <button
            className={`hub-tab ${activeTab === 'star' ? 'active' : ''}`}
            onClick={() => setActiveTab('star')}
          >
            <Users size={15} /> STAR Behavioral Method
          </button>
          <button
            className={`hub-tab ${activeTab === 'system_design' ? 'active' : ''}`}
            onClick={() => setActiveTab('system_design')}
          >
            <Server size={15} /> System Design Matrix
          </button>
        </div>
      </div>

      {/* TAB 1: STAR BEHAVIORAL METHOD */}
      {activeTab === 'star' && (
        <div className="star-grid">
          {/* Left Column: Prompt Selector & Saved Stories */}
          <div className="star-prompts-column">
            <div className="prompts-card">
              <h4>Behavioral Interview Prompts</h4>
              <div className="prompts-list">
                {BEHAVIORAL_PROMPTS.map(p => {
                  const hasSaved = Boolean(savedStories[p.id])
                  const isSelected = p.id === activePrompt.id
                  return (
                    <button
                      key={p.id}
                      className={`prompt-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPromptId(p.id)}
                    >
                      <div className="prompt-item-cat">{p.category}</div>
                      <div className="prompt-item-title">{p.title}</div>
                      {hasSaved && (
                        <span className="saved-story-indicator">
                          <CheckCircle2 size={12} /> Story Drafted
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Saved Stories Quick Drawer */}
            {Object.keys(savedStories).length > 0 && (
              <div className="saved-bank-card">
                <h4>My Story Bank ({Object.keys(savedStories).length})</h4>
                <div className="saved-bank-list">
                  {Object.entries(savedStories).map(([id, story]) => (
                    <div key={id} className="saved-story-chip">
                      <span className="story-chip-title">{story.promptTitle || id}</span>
                      <button
                        className="story-chip-del"
                        onClick={() => handleDeleteStory(id)}
                        title="Delete story"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive STAR Builder */}
          <div className="star-builder-column">
            <div className="active-prompt-banner">
              <div className="prompt-top-row">
                <span className="cat-pill">{activePrompt.category}</span>
                <button className="sample-btn" onClick={handleLoadSample}>
                  <Sparkles size={13} /> Load Sample FAANG Story
                </button>
              </div>
              <h3 className="prompt-question">"{activePrompt.prompt}"</h3>
              <div className="interviewer-expectation">
                <Lightbulb size={14} className="text-amber-400" />
                <span><strong>Interviewer Expectation:</strong> {activePrompt.interviewerLookingFor}</span>
              </div>
            </div>

            {/* 4-Step STAR Form */}
            <div className="star-form">
              {/* S - Situation */}
              <div className="star-field">
                <label>
                  <span className="star-letter s">S</span>
                  <strong>Situation</strong> — What was the project context, scale, and problem?
                </label>
                <textarea
                  placeholder="Set the scene: Describe the project, business context, tech stack, and challenge..."
                  value={storyForm.situation}
                  onChange={e => setStoryForm({ ...storyForm, situation: e.target.value })}
                  rows={3}
                />
              </div>

              {/* T - Task */}
              <div className="star-field">
                <label>
                  <span className="star-letter t">T</span>
                  <strong>Task</strong> — What was your specific responsibility or goal?
                </label>
                <textarea
                  placeholder="What needed to be done? What constraints, SLAs, or deadlines did you face?..."
                  value={storyForm.task}
                  onChange={e => setStoryForm({ ...storyForm, task: e.target.value })}
                  rows={2}
                />
              </div>

              {/* A - Action */}
              <div className="star-field">
                <label>
                  <span className="star-letter a">A</span>
                  <strong>Action</strong> — What specific technical & team actions did YOU take?
                </label>
                <textarea
                  placeholder="The most important part: Detail your architectural decisions, trade-offs, coding, or communication..."
                  value={storyForm.action}
                  onChange={e => setStoryForm({ ...storyForm, action: e.target.value })}
                  rows={4}
                />
              </div>

              {/* R - Result */}
              <div className="star-field">
                <label>
                  <span className="star-letter r">R</span>
                  <strong>Result</strong> — What were the quantifiable outcomes and learnings?
                </label>
                <textarea
                  placeholder="Quantify the impact: Latency drop, bug reduction, revenue saved, on-time launch, and lessons learned..."
                  value={storyForm.result}
                  onChange={e => setStoryForm({ ...storyForm, result: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Actions Row */}
              <div className="star-actions-bar">
                <button
                  className="star-copy-btn"
                  onClick={() => handleCopyStory(storyForm)}
                  disabled={!storyForm.situation && !storyForm.action}
                >
                  {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedId ? 'Copied Full Story!' : 'Copy Formatted Story'}</span>
                </button>

                <button className="primary-button ml-auto" onClick={handleSaveStory}>
                  <CheckCircle2 size={16} /> Save to Story Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM DESIGN MATRIX */}
      {activeTab === 'system_design' && (
        <div className="system-design-grid">
          {SYSTEM_DESIGN_TOPICS.map(topic => (
            <article key={topic.id} className="sd-card">
              <div className="sd-card-head">
                <div className="sd-icon-wrap">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="sd-title">{topic.title}</h3>
                  <p className="sd-summary">{topic.summary}</p>
                </div>
              </div>

              <div className="sd-concepts-grid">
                {topic.details.map((item, idx) => (
                  <div key={idx} className="sd-concept-box">
                    <strong className="sd-concept-name">{item.concept}</strong>
                    <div className="sd-examples">
                      <span>Stack / Examples:</span> <code>{item.examples}</code>
                    </div>
                    <p className="sd-tradeoff">{item.tradeoff}</p>
                  </div>
                ))}
              </div>

              <div className="sd-rule-thumb">
                <Lightbulb size={15} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Architect's Rule of Thumb:</strong> {topic.ruleOfThumb}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
