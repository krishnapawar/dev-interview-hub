const OWNER = 'krishnapawar'
const REPO = 'dev-interview-notes'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

function headers() {
  return { Accept: 'application/vnd.github+json' }
}

export async function fetchRepositoryNotes() {
  const metaResponse = await fetch(API, { headers: headers() })
  if (!metaResponse.ok) {
    if (metaResponse.status === 403 || metaResponse.status === 429) {
      throw new Error('GitHub API rate limit reached. Wait a minute and refresh, or try again later.')
    }
    if (metaResponse.status === 404) throw new Error('Repository was not found or is not public.')
    throw new Error(`GitHub repository request failed (${metaResponse.status}).`)
  }
  const meta = await metaResponse.json()
  const branch = meta.default_branch || 'main'
  const treeResponse = await fetch(`${API}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers: headers() })
  if (!treeResponse.ok) throw new Error(`Could not read repository tree (${treeResponse.status}).`)
  const treeData = await treeResponse.json()
  if (treeData.truncated) {
    throw new Error('This repository is too large for a single GitHub tree response. Add a smaller notes folder or use the GitHub contents API.')
  }

  const markdownFiles = (treeData.tree || []).filter(item =>
    item.type === 'blob' &&
    /\.md$/i.test(item.path) &&
    !/(^|\/)(node_modules|vendor|\.github)\//i.test(item.path)
  )

  const results = await Promise.allSettled(markdownFiles.map(async file => {
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${encodeURIComponent(branch)}/${file.path.split('/').map(encodeURIComponent).join('/')}`
    const response = await fetch(rawUrl)
    if (!response.ok) throw new Error(`Could not fetch ${file.path}`)
    const content = await response.text()
    return {
      path: file.path,
      name: file.path.split('/').pop().replace(/\.md$/i, ''),
      url: `https://github.com/${OWNER}/${REPO}/blob/${branch}/${file.path.split('/').map(encodeURIComponent).join('/')}`,
      content,
      size: file.size || content.length,
    }
  }))

  const notes = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  if (!notes.length && markdownFiles.length) throw new Error('Found Markdown files, but none could be loaded. Check GitHub availability.')
  return { notes, branch, repositoryUrl: meta.html_url, updatedAt: meta.updated_at }
}

export const repositoryUrl = `https://github.com/${OWNER}/${REPO}`