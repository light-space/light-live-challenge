import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

const navItems = [
  { href: '/', label: 'Payments' },
  { href: '/approvals', label: 'Pending Approvals' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">Light Payments</span>
              </div>
              <div className="ml-10 flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      router.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
