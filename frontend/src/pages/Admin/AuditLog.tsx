import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { adminApi } from '@/services/api'

const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const res = await adminApi.getAuditLogs(page)
      setLogs(res.logs)
      setTotalPages(res.pages)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">관리자 감사 로그</h1>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">일시</th>
                <th className="px-6 py-4">관리자 ID</th>
                <th className="px-6 py-4">액션</th>
                <th className="px-6 py-4">대상</th>
                <th className="px-6 py-4">사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px]">{log.adminId}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">{log.targetType}</div>
                    <div className="font-mono text-[10px]">{log.targetId}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic">{log.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >이전</Button>
          <span className="text-xs text-gray-500">페이지 {page} / {totalPages}</span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >다음</Button>
        </div>
      </Card>
    </div>
  )
}

export default AdminAuditLog
