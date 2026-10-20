import { useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import { Check, Copy } from 'lucide-react'

export default function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1].toLowerCase() : ''
  const codeString = String(children).replace(/\n$/, '')

  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    )
  }

  function handleCopy() {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  let highlightedHtml = ''
  try {
    const prismLang = Prism.languages[language] || Prism.languages.javascript
    if (prismLang) {
      highlightedHtml = Prism.highlight(codeString, prismLang, language || 'javascript')
    }
  } catch {
    highlightedHtml = ''
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <div className="code-lang-badge">
          <span className="code-lang-dot" />
          <span>{language || 'code'}</span>
        </div>
        <button
          className={`code-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        {highlightedHtml ? (
          <code
            className={`prism-code ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className={`prism-code ${className || ''}`}>{codeString}</code>
        )}
      </pre>
    </div>
  )
}
