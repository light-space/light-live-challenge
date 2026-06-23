import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

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

const departments = ['ENGINEERING', 'MARKETING', 'FINANCE', 'OPERATIONS', 'SALES', 'CUSTOMER_SUCCESS', 'HR']

const formatDepartment = (dept: string) => dept.replace(/_/g, ' ')

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [outcome, setOutcome] = useState<{ title: string; detail: string; auto: boolean } | null>(null)

  // Form fields
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [department, setDepartment] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')

  const fetchPayments = () => {
    fetch('/api/payments')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch payments')
        return res.json()
      })
      .then((data) => {
        setPayments(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const resetForm = () => {
    setDescription('')
    setVendor('')
    setAmount('')
    setCurrency('USD')
    setDepartment('')
    setSubmittedBy('')
    setFormError(null)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCategorize = async () => {
    if (!description.trim()) return
    setCategorizing(true)
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (res.ok) {
        const data = await res.json()
        const filled: string[] = []
        const parts: string[] = []
        if (data.vendor) { setVendor(data.vendor); filled.push('vendor'); parts.push(data.vendor) }
        if (data.department) { setDepartment(data.department); filled.push('department'); parts.push(data.department) }
        // don't overwrite the user's description
        if (filled.length > 0) {
          setHighlighted(new Set(filled))
          setTimeout(() => setHighlighted(new Set()), 2000)
          showToast(parts.join(' / '), 'success')
        } else {
          showToast('No suggestions available', 'error')
        }
      } else {
        showToast('Failed to get suggestions', 'error')
      }
    } catch (err) {
      showToast('Could not reach categorization service', 'error')
    } finally {
      setCategorizing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          vendor,
          amount: parseFloat(amount),
          currency,
          department,
          submittedBy: 'user@light.inc',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit payment')
      }

      const data = await res.json()
      const approvers: string[] = (data.approvals || []).map((a: { approverName: string }) => a.approverName)
      if (approvers.length === 0) {
        setOutcome({
          title: 'Auto-approved',
          detail: 'Under $1,000, so no approval was needed.',
          auto: true,
        })
      } else {
        const names =
          approvers.length === 1
            ? approvers[0]
            : `${approvers.slice(0, -1).join(', ')} and ${approvers[approvers.length - 1]}`
        setOutcome({
          title: 'Sent for approval',
          detail: `This payment needs sign-off from ${names}. Track it under Pending Approvals.`,
          auto: false,
        })
      }

      resetForm()
      fetchPayments()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>
  if (error) return <Layout><p className="text-red-500">Error: {error}</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Payments</h1>
      <p className="text-sm text-gray-500 mb-6">Submit a payment and it's automatically routed to the right approver.</p>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-blue-900 mb-3">How this works</h2>
        <ol className="space-y-1.5 text-sm text-blue-900/80 list-decimal list-inside mb-4">
          <li>Describe the payment, then hit <span className="font-medium">Suggest</span> and a small local AI model fills in the vendor and department for you. It's lightweight and runs on your machine, so it's fast but not always perfect; the more detail you give, the better it does.</li>
          <li>Submit it. Based on the amount and department, we route it to whoever needs to approve.</li>
          <li>Approvers sign off (or reject) under <span className="font-medium">Pending Approvals</span>. You can track status here anytime.</li>
        </ol>
        <div className="text-xs text-blue-900/70">
          <span className="font-medium">Who approves:</span>{' '}
          every rule a payment matches adds an approver, and they all have to sign off.
          By amount: under $1,000 auto-approves · $1k–$10k Team Lead · $10k–$50k Finance Manager · $50k+ CFO.
          Plus, by department: Engineering vendor spend $5k–$25k also needs the Engineering Director, and Marketing $5k–$30k also needs the CMO.
          <span className="text-blue-900/50"> So a $12k Engineering payment needs both the Finance Manager and the Engineering Director.</span>
        </div>
      </div>

      {/* Outcome of the last submission */}
      {outcome && (
        <div className={`flex items-start justify-between gap-4 rounded-lg p-4 mb-6 border ${
          outcome.auto
            ? 'bg-green-50 border-green-200 text-green-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div>
            <p className="text-sm font-semibold">{outcome.title}</p>
            <p className="text-sm opacity-80">{outcome.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setOutcome(null)}
            className="text-lg leading-none opacity-50 hover:opacity-100"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {/* New payment form */}
      <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">New Payment</h2>
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <div className="flex">
                <span className="inline-flex items-center border border-r-0 border-gray-300 rounded-l-md bg-gray-50 px-3 text-sm text-gray-500">
                  USD
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="block w-full border border-gray-300 rounded-r-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <div className="flex">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What is this payment for?"
                />
                <button
                  type="button"
                  onClick={handleCategorize}
                  disabled={categorizing || !description.trim()}
                  className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap"
                >
                  {categorizing ? '...' : 'Suggest'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                required
                className={`block w-full border rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-500 ${highlighted.has('vendor') ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                placeholder="Who are you paying?"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className={`block w-full border rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-500 ${highlighted.has('department') ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
              >
                <option value="">Select...</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{formatDepartment(dept)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>

      {/* Payments table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/payments/${payment.id}`} className="text-blue-600 hover:text-blue-800">
                    {payment.description}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDepartment(payment.department)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.currency} {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payment.status as any} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}
    </Layout>
  )
}
