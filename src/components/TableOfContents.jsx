import { useState } from 'react'
import { AlignLeft, ChevronRight, Hash, Search } from 'lucide-react'

export default function TableOfContents({ outline, activeSlug, onSelectHeading }) {
  const [filter, setFilter] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const filteredOutline = outline.filter(item =>
    item.title.toLowerCase().includes(filter.toLowerCase())
  )

  if (!outline.length) return null

  return (
    <aside className={`toc-container ${collapsed ? 'toc-collapsed' : ''}`}>
      <div className="toc-header">
        <div className="toc-title">
          <AlignLeft size={15} />
          <span>Table of Contents</span>
          <span className="toc-badge">{outline.length}</span>
        </div>
        <button
          className="toc-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand outline' : 'Collapse outline'}
          aria-label="Toggle Table of Contents"
        >
          <ChevronRight size={14} className={collapsed ? '' : 'rotate-90'} />
        </button>
      </div>

      {!collapsed && (
        <>
          {outline.length > 8 && (
            <div className="toc-search-wrap">
              <Search size={13} />
              <input
                type="text"
                placeholder="Filter sections..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          )}

          <nav className="toc-nav custom-scrollbar">
            {filteredOutline.map(item => {
              const isActive = activeSlug === item.slug
              return (
                <button
                  key={item.slug}
                  className={`toc-item level-${item.level} ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectHeading(item)}
                  title={item.title}
                >
                  <Hash size={11} className="toc-hash" />
                  <span className="toc-text">{item.title}</span>
                </button>
              )
            })}
            {filteredOutline.length === 0 && (
              <div className="toc-empty">No matching sections found</div>
            )}
          </nav>
        </>
      )}
    </aside>
  )
}
