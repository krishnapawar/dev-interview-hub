// Utility to parse markdown, headings, questions, and metadata

export function decodeBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  // Check UTF-16LE BOM
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.slice(2))
  }
  // Check UTF-16BE BOM
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.slice(2))
  }
  // Check UTF-8 BOM
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.slice(3))
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export function cleanQuestionText(raw) {
  if (!raw) return ''
  return raw
    .replace(/^#{1,6}\s+/, '')
    .replace(/^(?:Q\d*[:.]?|Question\s*\d*[:.]?)\s*/i, '')
    .replace(/^[0-9]+[️⃣.]*\s*/, '')
    .replace(/^[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]+\s*/, '')
    .replace(/^[0-9]+[️⃣.]*\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getTopicMetadata(path, defaultName) {
  const lower = path.toLowerCase()
  if (lower.includes('react')) {
    return {
      title: 'React',
      category: 'Frontend',
      icon: 'react',
      color: '#00d8ff',
      tag: 'UI Library',
      description: 'Virtual DOM, Reconciliation, Hooks, Performance, and Architecture'
    }
  }
  if (lower.includes('javascript')) {
    return {
      title: 'JavaScript',
      category: 'Frontend',
      icon: 'javascript',
      color: '#facc15',
      tag: 'Core Language',
      description: 'Event Loop, Closures, Prototypes, TDZ, Async/Await, and ES6+'
    }
  }
  if (lower.includes('nodejs') || lower.includes('node')) {
    return {
      title: 'Node.js & Express',
      category: 'Backend',
      icon: 'nodejs',
      color: '#22c55e',
      tag: 'Runtime & APIs',
      description: 'Event loop, Libuv, Streams, Clustering, Concurrency, and REST'
    }
  }
  if (lower.includes('mongodb')) {
    return {
      title: 'MongoDB & Systems',
      category: 'Databases',
      icon: 'mongodb',
      color: '#10b981',
      tag: 'NoSQL Database',
      description: 'Aggregation, Indexing, Sharding, Replica Sets, and Modeling'
    }
  }
  if (lower.includes('sql')) {
    return {
      title: 'SQL & Database',
      category: 'Databases',
      icon: 'database',
      color: '#3b82f6',
      tag: 'Relational DB',
      description: 'Joins, Indexing, Transactions, ACID, Optimization, and Normalization'
    }
  }
  if (lower.includes('git')) {
    return {
      title: 'Git & Version Control',
      category: 'DevOps & Tools',
      icon: 'git',
      color: '#f97316',
      tag: 'VCS & Workflow',
      description: 'Fetch vs Pull, Rebase vs Merge, Cherry-pick, Conflict Resolution'
    }
  }
  if (lower.includes('websocket')) {
    return {
      title: 'WebSockets & Real-Time',
      category: 'Backend',
      icon: 'websocket',
      color: '#a855f7',
      tag: 'Real-Time Protocol',
      description: 'Full-duplex, Long Polling, Scaling with Redis, Heartbeats, Recovery'
    }
  }
  if (lower.includes('laravel')) {
    return {
      title: 'Laravel',
      category: 'Backend',
      icon: 'laravel',
      color: '#ef4444',
      tag: 'PHP Framework',
      description: 'Service Container, Eloquent, Queues, Middleware, and Architecture'
    }
  }
  if (lower.includes('php')) {
    return {
      title: 'Core PHP',
      category: 'Backend',
      icon: 'php',
      color: '#818cf8',
      tag: 'Server Language',
      description: 'OOP, Superglobals, Memory Management, Security, and Arrays'
    }
  }
  if (lower.includes('mern')) {
    return {
      title: 'MERN Stack Guide',
      category: 'Fullstack',
      icon: 'layers',
      color: '#ec4899',
      tag: 'Roadmap & Specs',
      description: 'Complete end-to-end fullstack interview roadmap & best practices'
    }
  }

  return {
    title: defaultName || 'Interview Guide',
    category: 'General',
    icon: 'file',
    color: '#8b7cf6',
    tag: 'Guide',
    description: 'Technical notes and revision materials'
  }
}

export function parseNoteOutline(markdown) {
  if (!markdown) return []
  const lines = markdown.split(/\r?\n/)
  const outline = []

  lines.forEach((line, index) => {
    const match = line.match(/^(#{2,4})\s+(.+)$/)
    if (match && !line.includes('Table of Contents')) {
      const level = match[1].length
      const rawText = match[2].trim()
      const title = cleanQuestionText(rawText) || rawText
      const slug = 'heading-' + index + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 35)
      outline.push({
        lineIndex: index,
        level,
        title,
        rawText,
        slug
      })
    }
  })

  return outline
}

export function extractQuestionsFromNote(note) {
  if (!note || !note.content) return []
  const lines = note.content.split(/\r?\n/)
  const questions = []
  let currentHeader = null
  let currentLines = []

  const isQuestionHeading = text => {
    if (/Table of Contents/i.test(text)) return false
    return (
      /(?:\?|What is|Difference|How|Explain|Why|When to|Which|Definition|Overview|\d+[️⃣.])/i.test(text)
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hMatch = line.match(/^(#{2,4})\s+(.+)$/)

    if (hMatch && isQuestionHeading(hMatch[2])) {
      if (currentHeader && currentLines.length) {
        const cleaned = cleanQuestionText(currentHeader)
        if (cleaned.length > 3) {
          questions.push({
            id: `${note.path}#q-${questions.length}`,
            notePath: note.path,
            noteTitle: note.name,
            question: cleaned,
            rawQuestion: currentHeader,
            answer: currentLines.join('\n').trim(),
            lineIndex: i
          })
        }
      }
      currentHeader = hMatch[2].trim()
      currentLines = []
    } else if (currentHeader) {
      currentLines.push(line)
    }
  }

  if (currentHeader && currentLines.length) {
    const cleaned = cleanQuestionText(currentHeader)
    if (cleaned.length > 3) {
      questions.push({
        id: `${note.path}#q-${questions.length}`,
        notePath: note.path,
        noteTitle: note.name,
        question: cleaned,
        rawQuestion: currentHeader,
        answer: currentLines.join('\n').trim(),
        lineIndex: lines.length
      })
    }
  }

  return questions
}
