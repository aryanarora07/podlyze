'use client';
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Headphones, Send, User, Bot, Home, Info, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function ChatWithSummary2() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [summary, setSummary] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const summaryParam = searchParams.get('summary')
    if (summaryParam) {
      setSummary(summaryParam)
    }
  }, [searchParams])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { content: input, isUser: true }]);
      setInput('');
      setIsStreaming(true);

      try {
        const response = await fetch('http://localhost:3001/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: input, summary }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.start) {
                setMessages(prev => [...prev, { content: '', isUser: false }]);
              } else if (data.content) {
                aiResponse += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = aiResponse;
                  return newMessages;
                });
              } else if (data.done) {
                setIsStreaming(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setMessages(
          prev => [...prev, { content: "Sorry, I couldn't process your request. Please try again.", isUser: false }]
        );
        setIsStreaming(false);
      }
    }
  };

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-purple-100 to-white flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <Headphones className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-2xl font-bold text-purple-800">PodSum</span>
            </Link>
            <nav className="hidden md:flex space-x-10">
              <Link
                href="/"
                className="text-base font-medium text-gray-500 hover:text-gray-900 flex items-center">
                <Home className="h-5 w-5 mr-1" />
                Home
              </Link>
              <Link
                href="/about"
                className="text-base font-medium text-gray-500 hover:text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-1" />
                About
              </Link>
              <Link
                href="/pricing"
                className="text-base font-medium text-gray-500 hover:text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-1" />
                Pricing
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Podcast Summary</h2>
          <ScrollArea className="h-48">
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </ScrollArea>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Chat with AI about the Summary</h2>
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${message.isUser ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    <div className="flex items-center mb-1">
                      {message.isUser ? <User className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                      <span className="font-semibold">{message.isUser ? 'You' : 'AI'}</span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the summary..."
              onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
              className="flex-1 text-black"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={isStreaming}
            >
              <Send className="h-4 w-4 mr-2" />
              {isStreaming ? 'Streaming...' : 'Send'}
            </Button>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow-md mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2023 PodSum. All rights reserved.
          </p>
        </div>
      </footer>
    </div>)
  );
}