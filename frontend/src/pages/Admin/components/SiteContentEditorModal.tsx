import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import RichTextEditor from '@/components/RichTextEditor/RichTextEditor'
import { adminApi } from '@/services/api'

interface SiteContentEditorModalProps {
  contentId: string | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const SiteContentEditorModal: React.FC<SiteContentEditorModalProps> = ({ contentId, isOpen, onClose, onSaved }) => {
  const [contentKey, setContentKey] = useState('terms_of_service')
  const [title, setTitle] = useState('')
  const [contentMarkdown, setContentMarkdown] = useState('')
  const [version, setVersion] = useState('')
  const [status, setStatus] = useState('draft')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && contentId) {
      fetchContent()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, contentId])

  const resetForm = () => {
    setContentKey('terms_of_service')
    setTitle('')
    setContentMarkdown('')
    setVersion('')
    setStatus('draft')
  }

  const fetchContent = async () => {
    if (!contentId) return
    setIsLoading(true)
    try {
      const allVersions = await adminApi.getSiteContentVersions()
      const content = allVersions.find((c: any) => c.id === contentId)
      if (content) {
        setContentKey(content.contentKey)
        setTitle(content.title)
        setContentMarkdown(content.contentMarkdown)
        setVersion(content.version)
        setStatus(content.status)
      }
    } catch (err) {
      console.error('Failed to fetch site content detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const data = {
      contentKey,
      title,
      contentMarkdown,
      version,
      status,
    }
    try {
      if (contentId) {
        await adminApi.updateSiteContent(contentId, data)
      } else {
        await adminApi.createSiteContent(data)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      console.error('Failed to save site content:', err)
      alert(err.message || '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const isPublishing = status === 'active'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {contentId ? '약관/정책 수정' : '새 약관/정책 작성'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문서 종류</label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        value={contentKey}
                        onChange={(e) => setContentKey(e.target.value)}
                        disabled={!!contentId}
                      >
                        <option value="terms_of_service">서비스 이용약관</option>
                        <option value="privacy_policy">개인정보 처리방침</option>
                      </select>
                    </div>
                    <Input
                      label="버전 (예: 1.0.0)"
                      placeholder="버전을 입력하세요"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      disabled={status === 'active'}
                    />
                  </div>

                  <Input
                    label="제목"
                    placeholder="문서 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">내용 (Markdown)</label>
                    <RichTextEditor 
                      value={contentMarkdown} 
                      onChange={setContentMarkdown} 
                      placeholder="약관 내용을 입력하세요..." 
                    />
                    {status === 'active' && (
                      <p className="mt-2 text-xs text-amber-600">
                        * 활성화된 문서는 직접 수정할 수 없습니다. 새로운 드래프트를 작성해 주세요.
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">상태 관리</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={status === 'draft'}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                          disabled={status === 'archived'}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Draft (준비중)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={status === 'active'}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                          disabled={status === 'archived'}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-bold text-green-600">Active (현재 적용중)</span>
                      </label>
                      {status === 'archived' && (
                        <span className="text-sm text-gray-400 italic">Archived (과거 버전)</span>
                      )}
                    </div>
                    {isPublishing && status !== 'active' && (
                      <p className="text-xs text-red-500">
                        * 'Active'로 변경 시 현재 적용 중인 다른 버전은 자동으로 'Archived' 처리됩니다.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
              <Button
                variant={status === 'active' ? 'primary' : 'secondary'}
                className="flex-1"
                disabled={isSaving || !title || !contentMarkdown || !version || (status === 'active' && contentId && status === 'active' && false /* disable logic if needed */)}
                onClick={handleSave}
              >
                {isSaving ? '저장 중...' : status === 'active' && contentId && status !== 'active' ? '업데이트 및 게시' : '저장하기'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default SiteContentEditorModal
