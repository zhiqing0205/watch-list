import { User } from 'lucide-react'

interface UserAvatarProps {
  name?: string
  username?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ name, username, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  // Use username if available, otherwise fall back to name
  const displayName = username || name || 'Unknown User'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0`}>
        <User className={`${iconSizeClasses[size]} text-slate-600 dark:text-slate-400`} />
      </div>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
        {displayName}
      </span>
    </div>
  )
}