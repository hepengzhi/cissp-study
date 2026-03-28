'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
