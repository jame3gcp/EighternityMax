import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import MarkdownContent from '@/components/MarkdownContent/MarkdownContent'
import { siteContentApi } from '@/services/api'

const PrivacyPolicy: React.FC = () => {
  const [content, setContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPolicy()
  }, [])

  const fetchPolicy = async () => {
    try {
      const data = await siteContentApi.getActive('privacy_policy')
      setContent(data)
    } catch (err) {
      console.error('Failed to fetch policy:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {content?.title || '개인정보 처리방침'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          최종 수정일: {content ? new Date(content.updatedAt).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')}
          {content?.version && ` (v${content.version})`}
        </p>
      </div>

      {content ? (
        <Card className="prose dark:prose-invert max-w-none p-8">
          <MarkdownContent content={(content as any).contentMarkdown ?? (content as any).content_markdown ?? ''} className="prose dark:prose-invert max-w-none" />
        </Card>
      ) : (
        <Card className="p-8 text-center text-gray-500">
          개인정보 처리방침 내용을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
        </Card>
      )}
    </div>
  )
}

export default PrivacyPolicy
