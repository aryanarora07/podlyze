'use client';
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Headphones, Languages } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function TranslateSummary() {
  const [summary, setSummary] = useState('')
  const [translation, setTranslation] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const summaryParam = searchParams.get('summary')
    if (summaryParam) {
      setSummary(summaryParam)
    }
  }, [searchParams])

  const handleTranslate = async () => {
    if (!targetLanguage) {
      alert('Please select a target language')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('https://podlyze.onrender.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: summary, targetLanguage }),
      })

      if (!response.ok) {
        throw new Error('Failed to translate')
      }

      const data = await response.json()
      setTranslation(data.translation)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to translate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <Headphones className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-2xl font-bold text-purple-800">Podlyze</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Original Summary</h2>
          <ScrollArea className="h-48">
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </ScrollArea>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Translate Summary</h2>
          <div className="flex space-x-4 mb-4">
            <Select onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-[180px] text-black">
                <SelectValue className='text-black' placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spanish" className="text-black">Spanish</SelectItem>
                <SelectItem value="French" className="text-black">French</SelectItem>
                <SelectItem value="German" className="text-black">German</SelectItem>
                <SelectItem value="Italian" className="text-black">Italian</SelectItem>
                <SelectItem value="Portuguese" className="text-black">Portuguese</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleTranslate}
              disabled={isLoading}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Languages className="h-4 w-4 mr-2" />
              {isLoading ? 'Translating...' : 'Translate'}
            </Button>
          </div>
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {translation && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Translated Summary:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{translation}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
      <footer className="bg-white shadow-md mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Podlyze. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}