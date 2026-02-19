import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import { adminApi } from '@/services/api'

interface CouponEditorModalProps {
  coupon: any | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const CouponEditorModal: React.FC<CouponEditorModalProps> = ({ coupon, isOpen, onClose, onSaved }) => {
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && coupon) {
      setCode(coupon.code)
      setDiscountPercent(String(coupon.discountPercent || ''))
      setMaxRedemptions(String(coupon.maxRedemptions || ''))
      setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '')
      setIsActive(coupon.isActive)
    } else if (isOpen) {
      setCode('')
      setDiscountPercent('')
      setMaxRedemptions('')
      setExpiresAt('')
      setIsActive(true)
    }
  }, [isOpen, coupon])

  const handleSave = async () => {
    setIsSaving(true)
    const data = {
      code,
      discountPercent: discountPercent ? parseInt(discountPercent, 10) : null,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive,
    }
    try {
      if (coupon) {
        await adminApi.updateCoupon(coupon.id, data)
      } else {
        await adminApi.createCoupon(data)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save coupon:', err)
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
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {coupon ? '쿠폰 수정' : '새 쿠폰 생성'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="쿠폰 코드"
                placeholder="예: NEWYEAR2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={!!coupon}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="할인율 (%)"
                  type="number"
                  placeholder="0-100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
                <Input
                  label="최대 사용 횟수"
                  type="number"
                  placeholder="무제한 시 비움"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                />
              </div>

              <Input
                label="만료일"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300"
                />
                <label htmlFor="couponActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  쿠폰 활성화 상태
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isSaving || !code || !discountPercent}
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

export default CouponEditorModal
