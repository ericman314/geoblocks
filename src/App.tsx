import { useCallback, useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { render } from './render'

function App() {
  const refCanvas = useRef<HTMLCanvasElement>(null)

  const refMousePosition = useRef<null | { x: number, y: number }>(null)

  const doRender = useCallback(() => {
    if (refCanvas.current) {
      const ctx = refCanvas.current.getContext('2d')
      if (ctx) {
        render(ctx, refMousePosition.current)
      }
    }
  }, [])

  // Resize canvas to fit window
  useEffect(() => {
    const resizeCanvas = () => {
      if (refCanvas.current) {
        refCanvas.current.width = window.innerWidth
        refCanvas.current.height = window.innerHeight
      }
      requestAnimationFrame(doRender)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Render if mouse moves, and pass mouse position to the render function
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      refMousePosition.current = { x: e.clientX, y: e.clientY }
      requestAnimationFrame(doRender)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Render if mouse leaves the window
  useEffect(() => {
    const handleMouseLeave = () => {
      refMousePosition.current = null
      requestAnimationFrame(doRender)
    }
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => window.removeEventListener('mouseleave', handleMouseLeave)
  }, [])


  return (
    <div className="App">
      <canvas ref={refCanvas}>

      </canvas>
    </div>
  )
}

export default App
