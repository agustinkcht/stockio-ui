"use client"

interface LoadingBarProps {
  className?: string
}

export function LoadingBar({ className = "" }: LoadingBarProps) {
  return (
    <div className={`w-full h-1 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-loading-bar" />
    </div>
  )
}
