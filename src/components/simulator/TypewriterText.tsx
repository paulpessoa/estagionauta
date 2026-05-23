import React, { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export function TypewriterText({ text, speed = 25, onComplete }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('')
    setIsTyping(true)

    let i = 0
    let timeout: NodeJS.Timeout

    const typeWriter = () => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i))
        i++
        timeout = setTimeout(typeWriter, speed)
      } else {
        setIsTyping(false)
        if (onComplete) onComplete()
      }
    }

    timeout = setTimeout(typeWriter, speed)

    return () => clearTimeout(timeout)
  }, [text, speed])

  // If we unmount or need to force complete, maybe we shouldn't show half text, but for now this is great.
  return (
    <span className="whitespace-pre-line leading-relaxed">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-violet-500 animate-pulse align-middle" />
      )}
    </span>
  )
}
