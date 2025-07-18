'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedGradientBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function AnimatedGradientBackground({
  className,
  children
}: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 检测设备性能
    const isLowPerformance = window.innerWidth < 768 || // 移动设备
                            window.navigator.hardwareConcurrency < 4 || // 低核心数设备
                            window.devicePixelRatio < 2 // 低像素密度设备

    // 优化：启用硬件加速和更好的渲染质量
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 根据设备性能调整粒子数量
    const particleCount = isLowPerformance ? 15 : 30
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      opacity: number
      life: number
      maxLife: number
    }> = []

    // 创建粒子
    const createParticle = (x?: number, y?: number) => {
      const colors = [
        'rgba(59, 130, 246, ',   // blue
        'rgba(147, 51, 234, ',   // purple
        'rgba(236, 72, 153, ',   // pink
        'rgba(16, 185, 129, ',   // emerald
        'rgba(245, 158, 11, ',   // amber
      ]

      return {
        x: x ?? Math.random() * canvas.width / (window.devicePixelRatio || 1),
        y: y ?? Math.random() * canvas.height / (window.devicePixelRatio || 1),
        vx: (Math.random() - 0.5) * (isLowPerformance ? 0.2 : 0.3),
        vy: (Math.random() - 0.5) * (isLowPerformance ? 0.2 : 0.3),
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.2,
        life: 0,
        maxLife: Math.random() * 300 + 200
      }
    }

    // 初始化粒子
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle())
    }

    // 波浪系统 - 低性能设备减少波浪数量
    const waveCount = isLowPerformance ? 2 : 3
    const waves = [
      { amplitude: 30, frequency: 0.015, speed: 0.008, offset: 0, color: 'rgba(59, 130, 246, 0.08)' },
      { amplitude: 20, frequency: 0.02, speed: 0.012, offset: Math.PI / 2, color: 'rgba(147, 51, 234, 0.06)' },
      { amplitude: 25, frequency: 0.018, speed: 0.006, offset: Math.PI, color: 'rgba(236, 72, 153, 0.04)' },
    ].slice(0, waveCount)

    let time = 0
    let lastTime = 0
    const targetFPS = isLowPerformance ? 30 : 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      if (currentTime - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      lastTime = currentTime
      
      const canvasWidth = canvas.width / (window.devicePixelRatio || 1)
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1)
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      
      // 绘制基础渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)')
      gradient.addColorStop(0.3, 'rgba(147, 51, 234, 0.02)')
      gradient.addColorStop(0.7, 'rgba(236, 72, 153, 0.025)')
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.015)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 绘制优化的波浪
      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.moveTo(0, canvasHeight / 2)
        
        // 低性能设备增加更大的步进
        const step = isLowPerformance ? 8 : 4
        for (let x = 0; x <= canvasWidth; x += step) {
          const y = canvasHeight / 2 + 
                   Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude +
                   Math.sin(x * wave.frequency * 1.5 + time * wave.speed * 1.2 + wave.offset) * wave.amplitude * 0.3
          ctx.lineTo(x, y)
        }
        
        ctx.lineTo(canvasWidth, canvasHeight)
        ctx.lineTo(0, canvasHeight)
        ctx.closePath()
        
        ctx.fillStyle = wave.color
        ctx.fill()
      })

      // 更新和绘制粒子
      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // 边界检查
        if (particle.x < 0 || particle.x > canvasWidth || 
            particle.y < 0 || particle.y > canvasHeight ||
            particle.life > particle.maxLife) {
          particles[index] = createParticle()
          return
        }

        // 绘制粒子
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + particle.opacity + ')'
        ctx.fill()

        // 优化：低性能设备减少或跳过连线计算
        if (!isLowPerformance && index % 3 === 0) {
          particles.slice(index + 1, index + 6).forEach((otherParticle) => {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 80) {
              const opacity = (80 - distance) / 80 * 0.15
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          })
        }
      })

      // 绘制浮动的几何图形 - 低性能设备减少数量
      const numShapes = isLowPerformance ? 3 : 5
      for (let i = 0; i < numShapes; i++) {
        const x = (canvasWidth / numShapes) * i + Math.sin(time * 0.008 + i) * 30
        const y = canvasHeight / 2 + Math.cos(time * 0.006 + i) * 60
        const size = 15 + Math.sin(time * 0.015 + i) * 8
        const rotation = time * 0.003 + i
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotation)
        
        // 绘制六边形
        ctx.beginPath()
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2
          const px = Math.cos(angle) * size
          const py = Math.sin(angle) * size
          if (j === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        
        const shapeOpacity = 0.02 + Math.sin(time * 0.008 + i) * 0.015
        ctx.fillStyle = `rgba(59, 130, 246, ${shapeOpacity})`
        ctx.fill()
        ctx.strokeStyle = `rgba(147, 51, 234, ${shapeOpacity * 1.5})`
        ctx.lineWidth = 0.5
        ctx.stroke()
        
        ctx.restore()
      }

      // 绘制流动的光线 - 低性能设备减少数量
      const lightCount = isLowPerformance ? 1 : 2
      for (let i = 0; i < lightCount; i++) {
        const progress = (time * 0.001 + i * 0.5) % 1
        const x = progress * canvasWidth
        const y = canvasHeight / 2 + Math.sin(progress * Math.PI * 3) * 120
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 60)
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0.2)')
        gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.08)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        
        ctx.beginPath()
        ctx.arc(x, y, 40, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      time += isLowPerformance ? 0.3 : 0.5
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Canvas 动画背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'multiply' }}
      />
      
      {/* 静态渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent dark:via-slate-900/30"></div>
      </div>
      
      {/* 额外的装饰性元素 */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-radial from-blue-400/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-radial from-purple-400/30 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-gradient-radial from-pink-400/30 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>
      
      {/* 内容区域 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}