import Link from 'next/link'
import React from 'react'

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
        403 - Forbidden
      </h1>
      <p className="text-base text-gray-700 dark:text-gray-400 sm:text-lg">
        You do not have permission to access this page.
      </p>
        <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          Back to Home Page
        </Link>
    </div>
  )
}
