import { useEffect, useRef } from 'react'

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stars = useRef<{x: number, y: number, z: number, size: number, speed: number}[]>([])
  const floatingRef = useRef<{x: number, y: number, dx: number, dy: number, size: number, color: string}[]>([])
  const shootingStars = useRef<{x: number, y: number, length: number, speed: number, angle: number, brightness: number}[]>([])
  const rockets = useRef<{x: number, y: number, speed: number, angle: number, trail: {x: number, y: number}[]}[]>([])
  const mouse = useRef({ x: 0.5, y: 0.5 })

  // Config
  const STAR_COUNT = 200
  const FLOATING_COUNT = 5
  const SHOOTING_STAR_CHANCE = 0.001
  const ROCKET_CHANCE = 0.0005
  const COLORS = ['#F472B6', '#7C3AED', '#2563EB', '#FACC15', '#FF5CA7']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let width = window.innerWidth
    let height = window.innerHeight
    let animationId: number

    // Resize
    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    // Init stars
    stars.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1 + 0.5,
      size: Math.random() * 1.2 + 0.5,
      speed: Math.random() * 0.2 + 0.05
    }))

    // Init floating
    floatingRef.current = Array.from({ length: FLOATING_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.7 + 40,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 20 + 20,
      color: COLORS[i % COLORS.length]
    }))

    // // Mouse parallax
    // function onMouseMove(e: MouseEvent) {
    //   mouse.current.x = e.clientX / width
    //   mouse.current.y = e.clientY / height
    // }
    // window.addEventListener('mousemove', onMouseMove)

    // Create shooting star
    function createShootingStar() {
      const angle = Math.random() * Math.PI / 4 + Math.PI / 4 // 45-90 degrees
      shootingStars.current.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.3,
        length: Math.random() * 100 + 50,
        speed: Math.random() * 15 + 10,
        angle,
        brightness: 1
      })
    }

    // Create rocket
    function createRocket() {
      const angle = Math.random() * Math.PI / 4 + Math.PI / 4 // 45-90 degrees
      rockets.current.push({
        x: Math.random() * width * 0.2,
        y: height + 50,
        speed: Math.random() * 5 + 3,
        angle,
        trail: []
      })
    }

    // Animation
    function draw() {
      ctx.clearRect(0, 0, width, height)

      // Draw stars
      for (const s of stars.current) {
        ctx.save()
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.001 + s.x)
        ctx.beginPath()
        ctx.arc(
          s.x + (mouse.current.x - 0.5) * 20 * s.z,
          s.y + (mouse.current.y - 0.5) * 20 * s.z,
          s.size * s.z,
          0, 2 * Math.PI
        )
        ctx.fillStyle = '#fff'
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 8 * s.z
        ctx.fill()
        ctx.restore()
        // Move star
        s.x += s.speed * s.z
        if (s.x > width + 10) s.x = -10
      }

      // Draw floating elements
      for (const f of floatingRef.current) {
        ctx.save()
        ctx.globalAlpha = 0.15
        ctx.beginPath()
        ctx.arc(
          f.x,
          f.y,
          f.size,
          0, 2 * Math.PI
        )
        ctx.fillStyle = f.color
        ctx.shadowColor = f.color
        ctx.shadowBlur = 20
        ctx.fill()
        ctx.restore()
        // Move floating
        f.x += f.dx
        f.y += f.dy
        if (f.x < 0 || f.x > width) f.dx *= -1
        if (f.y < 0 || f.y > height) f.dy *= -1
      }

      // Draw shooting stars
      for (let i = shootingStars.current.length - 1; i >= 0; i--) {
        const star = shootingStars.current[i]
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        )
        ctx.strokeStyle = `rgba(255, 255, 255, ${star.brightness})`
        ctx.lineWidth = 2
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.restore()

        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed
        star.brightness -= 0.01

        if (star.brightness <= 0 || star.x < 0 || star.x > width || star.y < 0 || star.y > height) {
          shootingStars.current.splice(i, 1)
        }
      }

      // Draw rockets
      for (let i = rockets.current.length - 1; i >= 0; i--) {
        const rocket = rockets.current[i]
        
        // Draw trail
        ctx.save()
        ctx.beginPath()
        for (let j = 0; j < rocket.trail.length - 1; j++) {
          ctx.moveTo(rocket.trail[j].x, rocket.trail[j].y)
          ctx.lineTo(rocket.trail[j + 1].x, rocket.trail[j + 1].y)
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()

        // Draw rocket
        ctx.save()
        ctx.translate(rocket.x, rocket.y)
        ctx.rotate(-rocket.angle)
        ctx.fillStyle = '#FF5CA7'
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(5, 10)
        ctx.lineTo(-5, 10)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Update position
        rocket.x += Math.cos(rocket.angle) * rocket.speed
        rocket.y -= Math.sin(rocket.angle) * rocket.speed

        // Update trail
        rocket.trail.push({ x: rocket.x, y: rocket.y })
        if (rocket.trail.length > 20) rocket.trail.shift()

        // Remove if out of bounds
        if (rocket.x < 0 || rocket.x > width || rocket.y < -50) {
          rockets.current.splice(i, 1)
        }
      }

      // Random shooting star
      if (Math.random() < SHOOTING_STAR_CHANCE) {
        createShootingStar()
      }

      // Random rocket
      if (Math.random() < ROCKET_CHANCE) {
        createRocket()
      }

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      // window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
} 