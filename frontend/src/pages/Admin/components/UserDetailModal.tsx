import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { adminApi } from '@/services/api'

interface UserDetailModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
  onRoleUpdated: (userId: string, newRole: string) => void
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, isOpen, onClose, onRoleUpdated }) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetail()
    } else {
      setData(null)
      setError(null)
    }
  }, [isOpen, userId])

  const fetchUserDetail = async () => {
    if (!userId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminApi.getUserById(userId)
      setData(res)
      setSelectedRole(res.user.role)
    } catch (err: any) {
      setError(err.message || '사용자 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRole = async () => {
    if (!userId || !selectedRole || selectedRole === data?.user.role) return
    setIsSaving(true)
    setError(null)
    try {
      await adminApi.updateUserRole(userId, selectedRole)
      onRoleUpdated(userId, selectedRole)
      onClose()
    } catch (err: any) {
      setError(err.message || '역할 변경에 실패했습니다.')
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">사용자 상세 정보</h2>
                {data?.user && (
                  <p className="text-sm text-gray-500 mt-1">{data.user.email}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              ) : data ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card title="기본 정보" className="bg-gray-50 dark:bg-gray-700/30">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">ID</span>
                          <span className="font-mono text-xs">{data.user.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">이름</span>
                          <span>{data.user.display_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">가입 채널</span>
                          <span className="uppercase">{data.user.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">가입일</span>
                          <span>{new Date(data.user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Card>

                    <Card title="구독 상태" className="bg-gray-50 dark:bg-gray-700/30">
                      {data.subscription ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">상태</span>
                            <span className="font-bold text-green-600 uppercase">{data.subscription.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">플랜</span>
                            <span>{data.subscription.plan_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">만료일</span>
                            <span>{new Date(data.subscription.current_period_end).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-2">구독 정보가 없습니다.</p>
                      )}
                    </Card>
                  </div>

                  <Card title="역할 설정" className="border-red-100 dark:border-red-900/30">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        {['user', 'admin'].map((role) => (
                          <label
                            key={role}
                            className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedRole === role
                                ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              className="hidden"
                              name="role"
                              value={role}
                              checked={selectedRole === role}
                              onChange={(e) => setSelectedRole(e.target.value)}
                            />
                            <div className="text-center">
                              <div className={`text-sm font-bold uppercase ${selectedRole === role ? 'text-red-600' : 'text-gray-500'}`}>
                                {role}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {role === 'admin' ? '관리 권한 부여' : '일반 사용자'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {data.payment_history?.length > 0 && (
                    <Card title="최근 결제 내역">
                      <div className="text-sm space-y-2 max-h-32 overflow-y-auto pr-2">
                        {data.payment_history.slice(0, 5).map((p: any) => (
                          <div key={p.id} className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <span className="text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</span>
                            <span className="font-medium">{(p.amount_cents / 100).toLocaleString()} {p.currency}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isSaving || !data || selectedRole === data?.user.role}
                onClick={handleSaveRole}
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

export default UserDetailModal
