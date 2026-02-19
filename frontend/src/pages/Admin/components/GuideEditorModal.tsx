import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import RichTextEditor from '@/components/RichTextEditor/RichTextEditor'
import { adminApi } from '@/services/api'

interface GuideEditorModalProps {
  guideId: string | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const GuideEditorModal: React.FC<GuideEditorModalProps> = ({ guideId, isOpen, onClose, onSaved }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('기초')
  const [tags, setTags] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && guideId) {
      fetchGuide()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, guideId])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('기초')
    setTags('')
    setIsPublished(false)
  }

  const fetchGuide = async () => {
    if (!guideId) return
    setIsLoading(true)
    try {
      const allGuides = await adminApi.getGuides()
      const guide = allGuides.find((g: any) => g.id === guideId)
      if (guide) {
        setTitle(guide.title)
        setContent(guide.content)
        setCategory(guide.category)
        setTags(guide.tags?.join(', ') || '')
        setIsPublished(guide.isPublished)
      }
    } catch (err) {
      console.error('Failed to fetch guide detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const data = {
      title,
      content,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublished,
    }
    try {
      if (guideId) {
        await adminApi.updateGuide(guideId, data)
      } else {
        await adminApi.createGuide(data)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save guide:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

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
                {guideId ? '가이드 수정' : '새 가이드 작성'}
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
                    <Input
                      label="제목"
                      placeholder="가이드 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">카테고리</label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="기초">기초</option>
                        <option value="관리">관리</option>
                        <option value="팁">팁</option>
                        <option value="FAQ">FAQ</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="태그 (쉼표로 구분)"
                    placeholder="예: 기초, 명리학, 에너지"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">내용</label>
                    <RichTextEditor value={content} onChange={setContent} placeholder="가이드 내용을 상세히 입력하세요..." />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      즉시 공개 (Live)
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isSaving || !title || !content}
                onClick={handleSave}
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default GuideEditorModal
