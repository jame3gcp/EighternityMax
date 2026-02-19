import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import GuideEditorModal from './components/GuideEditorModal'
import SpotEditorModal from './components/SpotEditorModal'
import SiteContentEditorModal from './components/SiteContentEditorModal'
import { adminApi } from '@/services/api'

const AdminContentCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'spots' | 'legal'>('guides')
  const [guides, setGuides] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [legalDocs, setLegalDocs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)

  useEffect(() => {
    if (activeTab === 'guides') {
      fetchGuides()
    } else if (activeTab === 'spots') {
      fetchSpots()
    } else {
      fetchLegalDocs()
    }
  }, [activeTab])

  const fetchGuides = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getGuides()
      setGuides(data)
    } catch (err) {
      console.error('Failed to fetch guides:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSpots = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getSpots()
      setSpots(data)
    } catch (err) {
      console.error('Failed to fetch spots:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLegalDocs = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getSiteContentVersions()
      setLegalDocs(data)
    } catch (err) {
      console.error('Failed to fetch legal docs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedId(null)
    if (activeTab === 'guides') setIsGuideModalOpen(true)
    else if (activeTab === 'spots') setIsSpotModalOpen(true)
    else setIsLegalModalOpen(true)
  }

  const handleEdit = (id: string) => {
    setSelectedId(id)
    if (activeTab === 'guides') setIsGuideModalOpen(true)
    else if (activeTab === 'spots') setIsSpotModalOpen(true)
    else setIsLegalModalOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">콘텐츠 관리 (CMS)</h1>
        <Button variant="primary" onClick={handleCreate}>
          {activeTab === 'guides' ? '새 가이드 작성' : activeTab === 'spots' ? '새 장소 추가' : '새 약관/정책 작성'}
        </Button>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('guides')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all \${
            activeTab === 'guides' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          가이드 아티클
        </button>
        <button
          onClick={() => setActiveTab('spots')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all \${
            activeTab === 'spots' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          에너지 스팟 (지도)
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all \${
            activeTab === 'legal' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          약관 및 정책
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'guides' ? (
          <Card title="가이드 목록">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">제목</th>
                      <th className="px-6 py-4">카테고리</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4">최종 수정일</th>
                      <th className="px-6 py-4">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {guides.map((guide) => (
                      <tr key={guide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{guide.title}</td>
                        <td className="px-6 py-4 text-gray-500">{guide.category}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase \${
                            guide.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {guide.isPublished ? 'Live' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(guide.updatedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(guide.id)}>편집</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : activeTab === 'spots' ? (
          <Card title="에너지 스팟 목록">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">장소명</th>
                      <th className="px-6 py-4">용도</th>
                      <th className="px-6 py-4">위치 (Lat/Lng)</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {spots.map((spot) => (
                      <tr key={spot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{spot.name}</td>
                        <td className="px-6 py-4 capitalize">{spot.purpose}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                          {parseFloat(spot.lat).toFixed(4)}, {parseFloat(spot.lng).toFixed(4)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase \${
                            spot.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {spot.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(spot.id)}>편집</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <Card title="약관 및 정책 버전 관리">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">구분</th>
                      <th className="px-6 py-4">제목</th>
                      <th className="px-6 py-4">버전</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4">최종 수정일</th>
                      <th className="px-6 py-4">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {legalDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-primary uppercase">
                          {doc.contentKey.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 font-medium">{doc.title}</td>
                        <td className="px-6 py-4 font-mono text-xs">{doc.version}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase \${
                            doc.status === 'active' ? 'bg-green-100 text-green-700' : 
                            doc.status === 'archived' ? 'bg-gray-100 text-gray-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(doc.id)}>편집</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      <GuideEditorModal
        isOpen={isGuideModalOpen}
        guideId={selectedId}
        onClose={() => setIsGuideModalOpen(false)}
        onSaved={fetchGuides}
      />

      <SpotEditorModal
        isOpen={isSpotModalOpen}
        spotId={selectedId}
        onClose={() => setIsSpotModalOpen(false)}
        onSaved={fetchSpots}
      />

      <SiteContentEditorModal
        isOpen={isLegalModalOpen}
        contentId={selectedId}
        onClose={() => setIsLegalModalOpen(false)}
        onSaved={fetchLegalDocs}
      />
    </div>
  )
}

export default AdminContentCMS
