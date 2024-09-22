'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Headphones, FileText, Clock, Zap, Share2, Bookmark } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import axios from 'axios'

export function PodcastSummarizerLanding() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:3001/summarize', { url })
      router.push(`/summary?title=${encodeURIComponent(response.data.title)}&summary=${encodeURIComponent(response.data.summary)}`)
    } catch (err) {
      setError('An error occurred while summarizing the podcast. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    (<div className="min-h-screen bg-white text-gray-800">
      <header
        className="px-4 lg:px-6 h-14 flex items-center border-b border-purple-100">
        <Link className="flex items-center justify-center" href="#">
          <Headphones className="h-6 w-6 text-purple-600" />
          <span className="ml-2 text-2xl font-bold text-purple-800">Podlyze</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:text-purple-600 transition-colors"
            href="#">
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:text-purple-600 transition-colors"
            href="#">
            Pricing
          </Link>
          <Link
            className="text-sm font-medium hover:text-purple-600 transition-colors"
            href="#">
            About
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-purple-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}>
                <h1
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-purple-800">
                  Summarize Podcasts in Seconds
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
                Turn hours of podcast content into concise summaries. Save time and stay informed with Podlyze.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full max-w-sm space-y-2">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                  <Label htmlFor="url" className="sr-only">YouTube URL</Label>
                  <Input
                    id="url"
                    className="border-purple-200 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Paste YouTube podcast URL"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required />
                  <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-700">
                    Summarize Now
                  </Button>
                </form>
                {isLoading && <p className="text-sm text-purple-600">Summarizing podcast...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-gray-500">
                  Try it now - No sign-up required for your first summary!
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2
              className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-purple-800">
              Why Choose Podlyze?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Clock className="h-10 w-10 text-purple-600" />}
                title="Save Time"
                description="Get the key points of hour-long podcasts in just minutes." />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-purple-600" />}
                title="AI-Powered Summaries"
                description="Our advanced AI extracts the most important information accurately." />
              <FeatureCard
                icon={<FileText className="h-10 w-10 text-purple-600" />}
                title="Customizable Output"
                description="Choose between bullet points, short paragraphs, or detailed summaries." />
              <FeatureCard
                icon={<Share2 className="h-10 w-10 text-purple-600" />}
                title="Easy Sharing"
                description="Share summaries with friends or on social media with one click." />
              <FeatureCard
                icon={<Bookmark className="h-10 w-10 text-purple-600" />}
                title="Save Summaries"
                description="Build a personal library of podcast summaries for future reference." />
              <FeatureCard
                icon={<Headphones className="h-10 w-10 text-purple-600" />}
                title="Wide Compatibility"
                description="Works with any YouTube podcast URL, regardless of channel or topic." />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-purple-100">
          <div className="container px-4 md:px-6">
            <div
              className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2
                className="text-3xl font-bold tracking-tighter sm:text-5xl text-purple-800">
                Ready to Save Time on Podcasts?
              </h2>
              <p
                className="max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who are maximizing their podcast consumption with Podlyze.
              </p>
              <Button className="bg-purple-600 text-white hover:bg-purple-700">
                Get Started for Free
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer
        className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-purple-100">
        <p className="text-xs text-gray-600">© 2024 Podlyze. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4 text-gray-600"
            href="#">
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4 text-gray-600"
            href="#">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>)
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    (<motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-purple-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>)
  );
}