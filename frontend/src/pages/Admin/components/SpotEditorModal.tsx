import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import NaverMap from '@/components/NaverMap/NaverMap'
import { adminApi } from '@/services/api'

interface SpotEditorModalProps {
  spotId: string | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const SpotEditorModal: React.FC<SpotEditorModalProps> = ({ spotId, isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('37.5665')
  const [lng, setLng] = useState('126.9780')
  const [purpose, setPurpose] = useState('rest')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && spotId) {
      fetchSpot()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, spotId])

  const resetForm = () => {
    setName('')
    setDescription('')
    setLat('37.5665')
    setLng('126.9780')
    setPurpose('rest')
    setAddress('')
    setIsActive(true)
  }

  const fetchSpot = async () => {
    if (!spotId) return
    setIsLoading(true)
    try {
      const allSpots = await adminApi.getSpots()
      const spot = allSpots.find((s: any) => s.id === spotId)
      if (spot) {
        setName(spot.name)
        setDescription(spot.description || '')
        setLat(String(spot.lat))
        setLng(String(spot.lng))
        setPurpose(spot.purpose)
        setAddress(spot.address || '')
        setIsActive(spot.isActive ?? true)
      }
    } catch (err) {
      console.error('Failed to fetch spot detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMapClick = (newLat: number, newLng: number) => {
    setLat(newLat.toFixed(6))
    setLng(newLng.toFixed(6))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const data = {
      name,
      description,
      lat,
      lng,
      purpose,
      address,
      isActive,
    }
    try {
      if (spotId) {
        await adminApi.updateSpot(spotId, data)
      } else {
        await adminApi.createSpot(data)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save spot:', err)
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
            className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {spotId ? '장소 수정' : '새 장소 추가'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Input
                  label="장소명"
                  placeholder="예: 고요한 숲 카페"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">용도</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    >
                      <option value="rest">회복 (Rest)</option>
                      <option value="focus">집중 (Focus)</option>
                      <option value="meet">소통 (Meet)</option>
                      <option value="energy">활력 (Energy)</option>
                    </select>
                  </div>
                  <div className="flex items-end h-full pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">활성화 상태</span>
                    </label>
                  </div>
                </div>

                <Input
                  label="주소"
                  placeholder="도로명 주소 등"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                    placeholder="장소에 대한 설명을 입력하세요"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="위도 (Lat)" value={lat} readOnly />
                  <Input label="경도 (Lng)" value={lng} readOnly />
                </div>
                <p className="text-[10px] text-gray-400 italic mt-1">* 지도를 클릭하여 위치를 선택하세요.</p>
              </div>

              <div className="flex flex-col h-full min-h-[400px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">위치 선택</label>
                <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
                  <NaverMap
                    center={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                    height="100%"
                    onMapClick={handleMapClick}
                    spots={[{ 
                      id: 'preview', 
                      name, 
                      lat: parseFloat(lat), 
                      lng: parseFloat(lng), 
                      purpose: purpose as any,
                      type: 'cafe',
                      score: 100,
                      description,
                      address,
                      tags: []
                    }]}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isSaving || !name || !lat || !lng}
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

export default SpotEditorModal
