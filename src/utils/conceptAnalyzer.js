// Utility for analyzing spoken or written answers against benchmark technical concepts

const COMMON_STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'that', 'to', 'for', 'it', 'of',
  'with', 'as', 'this', 'by', 'from', 'or', 'be', 'are', 'was', 'were', 'been', 'have',
  'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'we', 'you',
  'they', 'he', 'she', 'i', 'me', 'my', 'your', 'their', 'our', 'what', 'how', 'why', 'when',
  'where', 'who', 'so', 'if', 'then', 'else', 'but', 'not', 'no', 'yes', 'such', 'into',
  'than', 'more', 'also', 'just', 'some', 'any', 'all', 'both', 'each', 'other', 'very',
])

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'literally']

/**
 * Extract 5-10 key technical terms from benchmark question and answer
 */
export function extractKeyConcepts(questionText = '', answerText = '') {
  const combined = `${questionText} ${answerText}`
  // Clean markdown and symbols
  const cleaned = combined
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[^\w\s-]/g, ' ')
    .toLowerCase()

  const words = cleaned.split(/\s+/).filter(w => w.length > 3 && !COMMON_STOP_WORDS.has(w))

  // Count frequencies
  const freq = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })

  // Sort by frequency, take top distinct terms
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term)

  return sorted.length ? sorted : ['architecture', 'performance', 'implementation', 'memory', 'execution']
}

/**
 * Analyze candidate transcript against benchmark concepts and filler words
 */
export function analyzeSpeech(transcript = '', benchmarkQuestion = '', benchmarkAnswer = '', elapsedSeconds = 60) {
  const userText = transcript.trim().toLowerCase()
  const keyConcepts = extractKeyConcepts(benchmarkQuestion, benchmarkAnswer)

  // 1. Concept Coverage
  const matched = []
  const missing = []

  keyConcepts.forEach(concept => {
    if (userText.includes(concept)) {
      matched.push(concept)
    } else {
      missing.push(concept)
    }
  })

  const coveragePercent = Math.round((matched.length / Math.max(1, keyConcepts.length)) * 100)

  // 2. Word count & WPM
  const words = userText ? userText.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length
  const minutes = Math.max(0.2, elapsedSeconds / 60)
  const wpm = Math.round(wordCount / minutes)

  // 3. Filler words detection
  const detectedFillers = {}
  let totalFillers = 0

  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = userText.match(regex)
    if (matches && matches.length > 0) {
      detectedFillers[filler] = matches.length
      totalFillers += matches.length
    }
  })

  // 4. Clarity Rating
  let rating = 'Needs Practice'
  if (coveragePercent >= 75) rating = 'Excellent'
  else if (coveragePercent >= 50) rating = 'Proficient'
  else if (coveragePercent >= 30) rating = 'Partial'

  return {
    wordCount,
    wpm,
    coveragePercent,
    keyConcepts,
    matchedConcepts: matched,
    missingConcepts: missing,
    detectedFillers,
    totalFillers,
    rating,
  }
}
