import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface ApprovalRequest {
  id: string
  paymentId: string
  approverEmail: string
  approverName: string
  status: string
  createdAt: string
  amount: number
  currency: string
  description: string
  vendor: string
}

export default function Approvals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deciding, setDeciding] = useState<string | null>(null)

  const fetchApprovals = () => {
    fetch('/api/approvals/pending')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch approvals')
        return res.json()
      })
      .then((data) => {
        setApprovals(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  const handleDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setDeciding(approvalId)
    try {
      const comment = decision === 'REJECTED'
        ? prompt('Reason for rejection:')
        : null

      const res = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process decision')
      }

      fetchApprovals()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeciding(null)
    }
  }

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>
  if (error) return <Layout><p className="text-red-500">Error: {error}</p></Layout>

  // One pending payment can need several approvers (rules stack), so group the
  // approval requests by payment to show a single card per payment.
  const groups = approvals.reduce<Record<string, { paymentId: string; amount: number; currency: string; description: string; vendor: string; approvers: ApprovalRequest[] }>>((acc, a) => {
    const group = acc[a.paymentId] ??= {
      paymentId: a.paymentId,
      amount: a.amount,
      currency: a.currency,
      description: a.description,
      vendor: a.vendor,
      approvers: [],
    }
    group.approvers.push(a)
    return acc
  }, {})
  const groupList = Object.values(groups)

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Pending Approvals</h1>

      {groupList.length === 0 ? (
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupList.map((group) => (
            <div key={group.paymentId} className="bg-white shadow sm:rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {group.currency} {Number(group.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">{group.description} &middot; {group.vendor}</p>
                </div>
                <Link
                  href={`/payments/${group.paymentId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  View payment details
                </Link>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                  Waiting on {group.approvers.length} approver{group.approvers.length > 1 ? 's' : ''}
                </p>
                <ul className="divide-y divide-gray-100">
                  {group.approvers.map((approval) => (
                    <li key={approval.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{approval.approverName}</p>
                        <p className="text-sm text-gray-500">{approval.approverEmail}</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDecision(approval.id, 'APPROVED')}
                          disabled={deciding === approval.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(approval.id, 'REJECTED')}
                          disabled={deciding === approval.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
