'use client'

import { useEffect, useState } from 'react'

export function UserGreeting() {
  const [username, setUsername] = useState<string>('管理员')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUsername(payload.username || '管理员')
      } catch (error) {
        console.error('Failed to parse token:', error)
      }
    }
  }, [])

  return (
    <p className="text-slate-600 dark:text-slate-400">欢迎回来，{username}</p>
  )
}