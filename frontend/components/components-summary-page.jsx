'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Headphones, ArrowRight, MessageSquare } from 'lucide-react'

export function SummaryPage() {
  const searchParams = useSearchParams()
  const summary = searchParams.get('summary')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // This is a placeholder for the actual API call
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to summarize podcast')
      }

      const data = await response.json()
      // Redirect to the same page with new query params
      window.location.href = `/summary?summary=${encodeURIComponent(data.summary)}`
    } catch (err) {
      setError('Failed to summarize podcast. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatWithSummary = () => {
    // Placeholder function for chat functionality
    console.log('Chat with summary clicked')
  }

  return (
    (<div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link href="/" className="flex items-center">
                <Headphones className="h-8 w-8 text-purple-600" />
                <span className="ml-2 text-2xl font-bold text-purple-800">PodSum</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-10">
              <Link
                href="/"
                className="text-base font-medium text-gray-500 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/about"
                className="text-base font-medium text-gray-500 hover:text-gray-900">
                About
              </Link>
              <Link
                href="/pricing"
                className="text-base font-medium text-gray-500 hover:text-gray-900">
                Pricing
              </Link>
            </nav>
            
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {summary ? (
          <>
            <h1 className="text-3xl font-bold text-purple-800 mb-4">Podcast Summary</h1>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold text-purple-700 mb-2">Summary:</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/summary" className="inline-block">
                <Button className="bg-purple-600 text-white hover:bg-purple-700">
                  Summarize Another Podcast
                </Button>
              </Link>
              <Button
                onClick={handleChatWithSummary}
                className="bg-green-600 text-white hover:bg-green-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat with Summary
              </Button>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-purple-800 mb-4">Summarize a Podcast</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full" />
              </div>
              {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  'Summarize'
                )}
              </Button>
            </form>
          </div>
        )}
      </main>
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <Link href="/about" className="text-base text-gray-500 hover:text-gray-900">
                About
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/blog" className="text-base text-gray-500 hover:text-gray-900">
                Blog
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/jobs" className="text-base text-gray-500 hover:text-gray-900">
                Jobs
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/press" className="text-base text-gray-500 hover:text-gray-900">
                Press
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link
                href="/accessibility"
                className="text-base text-gray-500 hover:text-gray-900">
                Accessibility
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/partners" className="text-base text-gray-500 hover:text-gray-900">
                Partners
              </Link>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2023 PodSum, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>)
  );
}