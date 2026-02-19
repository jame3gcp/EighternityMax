import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  /** Markdown 또는 HTML 문자열. HTML이면 그대로 렌더, 아니면 마크다운 파싱 */
  content: string
  /** 루트에 적용할 className (예: prose) */
  className?: string
}

/** 콘텐츠에 HTML 태그가 포함돼 있는지 검사 (앞뒤 공백·줄바꿈에 강건하게) */
function looksLikeHtml(raw: string): boolean {
  const s = (raw || '').trim()
  return s.length > 0 && (s.startsWith('<') || /<\w[\s>]/.test(s) || s.includes('</'))
}

/** 약관/정책 평문에서 "제N조 (제목)" 패턴을 마크다운 제목(##)으로 변환 */
function plainTextToMarkdown(text: string): string {
  return text
    .replace(/(\n|^)\s*제(\d+)조\s*(\([^)]*\))?/g, '\n\n## 제$2조$3')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * CMS 등에서 내려온 contentMarkdown을 마크다운 형태로 적용해 표시.
 * - HTML이면 그대로 렌더 (시드/레거시 호환)
 * - 마크다운·평문이면 파싱 후 렌더 (제목, 목록 등 적용). "제N조" 패턴은 ## 제목으로 변환
 */
const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const raw = content ?? ''

  if (looksLikeHtml(raw)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    )
  }

  const markdown = raw.trim() ? plainTextToMarkdown(raw) : raw

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={className}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export default MarkdownContent
