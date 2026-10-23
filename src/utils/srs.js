// Spaced Repetition System (SRS) based on the Leitner Box & SM-2 interval algorithm

export const SRS_INTERVALS_DAYS = {
  1: 1,   // Box 1: 1 day
  2: 3,   // Box 2: 3 days
  3: 7,   // Box 3: 7 days
  4: 14,  // Box 4: 14 days
  5: 30,  // Box 5: 30 days (Mastered)
}

export function getTodayKey() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const nextY = dt.getFullYear()
  const nextM = String(dt.getMonth() + 1).padStart(2, '0')
  const nextD = String(dt.getDate()).padStart(2, '0')
  return `${nextY}-${nextM}-${nextD}`
}

export function initCardSRS(questionId) {
  const today = getTodayKey()
  return {
    id: questionId,
    level: 1,
    nextReviewDate: today,
    lastReviewedDate: null,
    reviewCount: 0,
    streak: 0,
  }
}

/**
 * Process card response rating
 * @param {Object} cardSRS Current card SRS state or null
 * @param {'struggled'|'good'|'easy'} rating
 * @param {string} today
 */
export function rateCardSRS(cardSRS, rating, today = getTodayKey()) {
  const current = cardSRS || initCardSRS('temp')
  let nextLevel = current.level
  let streak = current.streak || 0

  if (rating === 'struggled') {
    nextLevel = 1
    streak = 0
  } else if (rating === 'good') {
    nextLevel = Math.min(5, current.level + 1)
    streak += 1
  } else if (rating === 'easy') {
    nextLevel = Math.min(5, current.level + 2)
    streak += 2
  }

  const intervalDays = SRS_INTERVALS_DAYS[nextLevel] || 1
  const nextReviewDate = addDays(today, intervalDays)

  return {
    ...current,
    level: nextLevel,
    nextReviewDate,
    lastReviewedDate: today,
    reviewCount: (current.reviewCount || 0) + 1,
    streak,
  }
}

/**
 * Filter questions that are due for review today
 */
export function getDueQuestions(allQuestions, srsCards = {}, limit = 15) {
  const today = getTodayKey()
  const due = []
  const unstarted = []

  for (const q of allQuestions) {
    const card = srsCards[q.id]
    if (card) {
      if (card.nextReviewDate <= today) {
        due.push({ ...q, srs: card, isNew: false })
      }
    } else {
      unstarted.push({ ...q, srs: null, isNew: true })
    }
  }

  // If we have fewer than limit due cards, fill up with unstarted to ensure daily practice
  const result = [...due]
  const needed = limit - result.length
  if (needed > 0 && unstarted.length > 0) {
    result.push(...unstarted.slice(0, needed))
  }

  return result
}

/**
 * Calculate user's consecutive day streak from activity log
 * @param {Object} activityLog { '2026-10-23': 5, '2026-10-22': 10 }
 */
export function calculateStreak(activityLog = {}) {
  const today = getTodayKey()
  const dates = Object.keys(activityLog).filter(k => activityLog[k] > 0)
  if (!dates.length) return { currentStreak: 0, bestStreak: 0, totalReviews: 0 }

  const totalReviews = Object.values(activityLog).reduce((acc, v) => acc + (Number(v) || 0), 0)

  // Check if active today or yesterday
  const yesterday = addDays(today, -1)
  const isActiveToday = Boolean(activityLog[today])
  const isActiveYesterday = Boolean(activityLog[yesterday])

  if (!isActiveToday && !isActiveYesterday) {
    return { currentStreak: 0, bestStreak: 0, totalReviews }
  }

  let streak = 0
  let checkDate = isActiveToday ? today : yesterday

  while (activityLog[checkDate] && activityLog[checkDate] > 0) {
    streak++
    checkDate = addDays(checkDate, -1)
  }

  return {
    currentStreak: streak,
    bestStreak: streak,
    totalReviews,
  }
}

/**
 * Generate 30-day heatmap squares
 */
export function generateHeatmapData(activityLog = {}, days = 30) {
  const today = getTodayKey()
  const squares = []

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const count = activityLog[date] || 0
    let intensity = 0
    if (count > 0 && count <= 3) intensity = 1
    else if (count > 3 && count <= 7) intensity = 2
    else if (count > 7 && count <= 12) intensity = 3
    else if (count > 12) intensity = 4

    squares.push({
      date,
      count,
      intensity,
      isToday: date === today,
    })
  }

  return squares
}
