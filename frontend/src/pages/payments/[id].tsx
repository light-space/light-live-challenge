import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'

interface Payment {
  id: string
  amount: number
  currency: string
  department: string
  vendor: string
  description: string
  submittedBy: string
  status: string
  createdAt: string
}

interface ApprovalRequest {
  id: string
  paymentId: string
  approverEmail: string
  approverName: string
  status: string
  createdAt: string
  decidedAt: string | null
  comment: string | null
}

export default function PaymentDetail() {
  const router = useRouter()
  const { id } = router.query
  const [payment, setPayment] = useState<Payment | null>(null)
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deciding, setDeciding] = useState<string | null>(null)

  const fetchPayment = () => {
    if (!id) return
    fetch(`/api/payments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Payment not found')
        return res.json()
      })
      .then((data) => {
        setPayment(data.payment)
        setApprovals(data.approvals)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPayment()
  }, [id])

  const handleDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setDeciding(approvalId)
    try {
      const comment = decision === 'REJECTED' ? prompt('Reason for rejection:') : null

      const res = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process decision')
      }

      fetchPayment()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeciding(null)
    }
  }

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>
  if (error || !payment) return <Layout><p className="text-red-500">Error: {error || 'Not found'}</p></Layout>

  return (
    <Layout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{payment.description}</h1>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Vendor</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.vendor}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Amount</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.currency} {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Department</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.department}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1"><StatusBadge status={payment.status as any} /></dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Submitted By</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.submittedBy}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(payment.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {approvals.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Approvals</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {approvals.map((approval) => (
              <li key={approval.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{approval.approverName}</p>
                    <p className="text-sm text-gray-500">{approval.approverEmail}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={approval.status as any} />
                    {approval.decidedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(approval.decidedAt).toLocaleString()}
                      </p>
                    )}
                    {approval.status === 'PENDING' && (
                      <div className="flex space-x-2 mt-2 justify-end">
                        <button
                          onClick={() => handleDecision(approval.id, 'APPROVED')}
                          disabled={deciding === approval.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(approval.id, 'REJECTED')}
                          disabled={deciding === approval.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {approval.comment && (
                  <p className="mt-2 text-sm text-gray-600 italic">"{approval.comment}"</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  )
}
