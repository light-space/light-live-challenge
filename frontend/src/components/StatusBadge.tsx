type Status = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PENDING'

const statusStyles: Record<Status, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<Status, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  )
}
