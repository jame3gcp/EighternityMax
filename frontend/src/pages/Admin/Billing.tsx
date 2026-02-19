import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import CouponEditorModal from './components/CouponEditorModal'
import { adminApi } from '@/services/api'

const AdminBilling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'payments'>('payments')
  const [coupons, setCoupons] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons()
    } else {
      fetchPayments()
    }
  }, [activeTab, page])

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getCoupons()
      setCoupons(data)
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayments = async () => {
    setIsLoading(true)
    try {
      const res = await adminApi.getPayments(page)
      setPayments(res.payments)
      setTotalPages(res.pages)
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async (paymentId: string) => {
    if (!confirm('정말 환불 처리하시겠습니까? 이 작업은 되돌릴 수 없으며 시스템 상태만 변경됩니다.')) return
    try {
      await adminApi.refundPayment(paymentId, 'Admin Manual Refund')
      alert('환불 상태로 변경되었습니다.')
      fetchPayments()
    } catch (err) {
      alert('환불 처리에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">결제 및 프로모션</h1>
        {activeTab === 'coupons' && (
          <Button variant="primary" onClick={() => { setSelectedCoupon(null); setIsCouponModalOpen(true); }}>
            쿠폰 생성
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('payments'); setPage(1); }}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'payments' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          결제 내역
        </button>
        <button
          onClick={() => { setActiveTab('coupons'); setPage(1); }}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'coupons' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          프로모션 쿠폰
        </button>
      </div>

      {activeTab === 'payments' ? (
        <Card title="최근 결제 내역">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">일시</th>
                  <th className="px-6 py-4">사용자</th>
                  <th className="px-6 py-4">금액</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">방법</th>
                  <th className="px-6 py-4">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.user?.displayName || '사용자'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{p.userId}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {(p.amountCents / 100).toLocaleString()} {p.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'succeeded' ? 'bg-green-100 text-green-700' : 
                        p.status === 'refunded' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase text-xs text-gray-500">{p.provider}</td>
                    <td className="px-6 py-4">
                      {p.status === 'succeeded' && (
                        <Button variant="ghost" size="sm" onClick={() => handleRefund(p.id)} className="text-red-600 hover:text-red-700">
                          환불 처리
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>이전</Button>
            <span className="text-xs text-gray-500">페이지 {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
          </div>
        </Card>
      ) : (
        <Card title="쿠폰 목록">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">코드</th>
                  <th className="px-6 py-4">할인율</th>
                  <th className="px-6 py-4">사용 현황</th>
                  <th className="px-6 py-4">만료일</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{c.code}</td>
                    <td className="px-6 py-4 font-bold">{c.discountPercent}%</td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.timesRedeemed} / {c.maxRedemptions || '∞'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '없음'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCoupon(c); setIsCouponModalOpen(true); }}>
                        편집
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CouponEditorModal
        isOpen={isCouponModalOpen}
        coupon={selectedCoupon}
        onClose={() => setIsCouponModalOpen(false)}
        onSaved={fetchCoupons}
      />
    </div>
  )
}

export default AdminBilling
