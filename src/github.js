import fallbackData from './fallbackNotes.json'
import { decodeBuffer, getTopicMetadata } from './utils/markdownParser'

const OWNER = 'krishnapawar'
const REPO = 'dev-interview-notes'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

function headers() {
  return { Accept: 'application/vnd.github+json' }
}

export async function fetchRepositoryNotes() {
  try {
    const metaResponse = await fetch(API, { headers: headers() })
    if (!metaResponse.ok) {
      console.warn(`GitHub API notice: ${metaResponse.status}. Using cached repository notes.`)
      return {
        notes: fallbackData.notes,
        branch: fallbackData.branch || 'main',
        repositoryUrl: `https://github.com/${OWNER}/${REPO}`,
        updatedAt: fallbackData.updatedAt || new Date().toISOString(),
        isFallback: true,
        notice: metaResponse.status === 403 || metaResponse.status === 429
          ? 'GitHub API rate limit reached. Using fast cached repository notes.'
          : 'Using cached notes.',
      }
    }

    const meta = await metaResponse.json()
    const branch = meta.default_branch || 'main'
    const treeResponse = await fetch(
      `${API}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers: headers() }
    )

    if (!treeResponse.ok) {
      return {
        notes: fallbackData.notes,
        branch,
        repositoryUrl: meta.html_url,
        updatedAt: meta.updated_at,
        isFallback: true,
      }
    }

    const treeData = await treeResponse.json()
    const markdownFiles = (treeData.tree || []).filter(
      item =>
        item.type === 'blob' &&
        /\.md$/i.test(item.path) &&
        !/(^|\/)(node_modules|vendor|\.github)\//i.test(item.path)
    )

    const results = await Promise.allSettled(
      markdownFiles.map(async file => {
        const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${encodeURIComponent(
          branch
        )}/${file.path.split('/').map(encodeURIComponent).join('/')}`
        const response = await fetch(rawUrl)
        if (!response.ok) throw new Error(`Could not fetch ${file.path}`)
        const arrayBuf = await response.arrayBuffer()
        const content = decodeBuffer(arrayBuf)

        // Extract title from first H1 if available
        const lines = content.split(/\r?\n/)
        const h1Line = lines.find(l => l.startsWith('# '))
        let title = ''
        if (h1Line) {
          title = h1Line
            .replace(/^#\s+/, '')
            .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF&—\-–]/g, '')
            .trim()
        }
        if (!title) {
          const meta = getTopicMetadata(file.path)
          title = meta.title
        }

        return {
          path: file.path,
          name: title,
          url: `https://github.com/${OWNER}/${REPO}/blob/${branch}/${file.path
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`,
          content,
          size: file.size || content.length,
        }
      })
    )

    const notes = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    if (!notes.length) {
      return {
        notes: fallbackData.notes,
        branch,
        repositoryUrl: meta.html_url,
        updatedAt: meta.updated_at,
        isFallback: true,
      }
    }

    return {
      notes,
      branch,
      repositoryUrl: meta.html_url,
      updatedAt: meta.updated_at,
      isFallback: false,
    }
  } catch (err) {
    console.warn('Network error fetching GitHub notes, serving cached notes:', err)
    return {
      notes: fallbackData.notes,
      branch: 'main',
      repositoryUrl: `https://github.com/${OWNER}/${REPO}`,
      updatedAt: fallbackData.updatedAt || new Date().toISOString(),
      isFallback: true,
      notice: 'Serving offline cached notes.',
    }
  }
}

export const repositoryUrl = `https://github.com/${OWNER}/${REPO}`