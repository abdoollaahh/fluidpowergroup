import React from 'react'
import Link from 'next/link'

const Navigation = (): JSX.Element => {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" passHref>
                <a className="text-xl font-bold">
                  Fluid Power Group
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" passHref>
                <a className="px-3 py-2 hover:text-blue-600">
                  Home
                </a>
              </Link>
              <Link href="/hosebuilder" passHref>
                <a className="px-3 py-2 hover:text-blue-600">
                  Hose Builder
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
