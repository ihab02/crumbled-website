import Image from "next/image"

interface LoadingLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
}

export function LoadingLogo({ size = "md", text = "Loading...", className = "" }: LoadingLogoProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src="/images/logo-no-background.png"
          alt="Crumbled Logo"
          fill
          className="object-contain animate-pulse"
          priority
        />
        {/* Rotating ring around the logo */}
        <div className="absolute inset-0 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin"></div>
      </div>
      {text && (
        <p className="mt-4 text-pink-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Alternative version with bounce animation
export function LoadingLogoBounce({ size = "md", text = "Loading...", className = "" }: LoadingLogoProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]} animate-bounce`}>
        <Image
          src="/images/logo-no-background.png"
          alt="Crumbled Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {text && (
        <p className="mt-4 text-pink-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Version with scaling animation
export function LoadingLogoScale({ size = "md", text = "Loading...", className = "" }: LoadingLogoProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]} animate-pulse`}>
        <Image
          src="/images/logo-no-background.png"
          alt="Crumbled Logo"
          fill
          className="object-contain transition-transform duration-1000 hover:scale-110"
          priority
        />
      </div>
      {text && (
        <p className="mt-4 text-pink-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Full screen loading overlay
export function LoadingOverlay({ text = "Loading...", show = true }: { text?: string, show?: boolean }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingLogo size="lg" text={text} />
    </div>
  )
} 