'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TimerProps {
  initialSeconds: number
  onExpire?: () => void
  onPause?: () => void
}

export function Timer({ initialSeconds, onExpire, onPause }: TimerProps) {
  const t = useTranslations('timer')
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(true)

  // Store the onExpire callback in a ref to avoid unnecessary re-renders
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const togglePause = () => {
    setIsRunning(!isRunning)
    if (isRunning) {
      onPause?.()
    }
  }

  const isWarning = seconds < 1800 // Less than 30 minutes

  return (
    <div className={`flex items-center gap-4 ${isWarning ? 'text-destructive' : ''}`}>
      <span className={`text-2xl font-mono font-bold ${isWarning ? 'animate-pulse' : ''}`}>
        {formatTime(seconds)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={togglePause}
        aria-label={isRunning ? t('pause') : t('resume')}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  )
}
