import React, { useCallback, useEffect, useRef } from 'react'
import './App.css'
import { render } from './render'
import { SquareShape, TriangleShape, HexagonShape, FatRhombusShape, SkinnyRhombusShape, TrapezoidShape, Shape, reviver } from './Shape'

function getPaletteShapes() {
  return [
    new SquareShape({ x: 120, y: 100 }, 0),
    new TriangleShape({ x: 120, y: 220 }, 0),
    new HexagonShape({ x: 120, y: 400 }, 0),
    new FatRhombusShape({ x: 120, y: 580 }, 0),
    new SkinnyRhombusShape({ x: 120, y: 700 }, 0),
    new TrapezoidShape({ x: 120, y: 820 }, 0),
  ]
}

function App() {
  const refCanvas = useRef<HTMLCanvasElement>(null)

  const mousePosition = useRef<null | { x: number, y: number }>(null)

  const mouseDownPosition = useRef<null | { x: number, y: number }>(null)
  const mouseDownShape = useRef<null | Shape>(null)

  const isDragging = useRef(false)
  const draggingShape = useRef<null | Shape>(null)
  const draggingShapeOriginalPosition = useRef<null | { x: number, y: number }>(null)

  const paletteShapes = useRef<Shape[]>(getPaletteShapes())
  const shapes = useRef<Shape[]>(localStorage.getItem('shapes') ? JSON.parse(localStorage.getItem('shapes')!, reviver) : [])

  const hoverShape = useRef<Shape | null>(null)

  const doRender = useCallback(() => {
    if (refCanvas.current) {
      const ctx = refCanvas.current.getContext('2d')
      if (ctx) {
        render({
          ctx,
          paletteShapes: paletteShapes.current,
          shapes: shapes.current,
          hoverShape: draggingShape.current ? null : hoverShape.current,
          draggingShape: draggingShape.current,
          draggingOntoPalette:
            draggingShape.current != null
            && shapes.current.includes(draggingShape.current)
            && mousePosition.current != null
            && mousePosition.current.x < 240,
        })
      }
    }
  }, [paletteShapes])

  const saveShapes = useCallback(() => {
    localStorage.setItem('shapes', JSON.stringify(shapes.current))
  }, [])

  useEffect(() => {
    doRender()
  }, [doRender])

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

  const performHitTest = useCallback(({ x, y }: { x: number, y: number }) => {
    let hitShape: null | Shape = null
    let shapesToCheck = x > 240 ? shapes.current : paletteShapes.current
    for (let i = shapesToCheck.length - 1; i >= 0; i--) {
      let shape = shapesToCheck[i]
      if (shape.hitTest({ x, y })) {
        hitShape = shape
        break
      }
    }
    return hitShape
  }, [])

  const handleBeginDrag = useCallback(() => {
    isDragging.current = true
    let shape = paletteShapes.current.find(shape => shape === mouseDownShape.current)
    let shapeIndex = -1
    if (!shape) {
      shapeIndex = shapes.current.findIndex(shape => shape === mouseDownShape.current)
      shape = shapes.current[shapeIndex]
    }
    if (shape) {
      draggingShape.current = shape
      draggingShapeOriginalPosition.current = { ...shape.position }
      if (shapeIndex !== -1) {
        // Move shape to end of array so it renders on top
        shapes.current.push(...shapes.current.splice(shapeIndex, 1))
      }
    }

    // console.log('handleBeginDrag')

  }, [])

  const handleDrag = useCallback(() => {
    if (!mouseDownPosition.current || !mousePosition.current) {
      throw new Error('mouseDownPosition or mousePosition is null')
    }
    let needsRender = false
    if (isDragging.current && draggingShape.current && draggingShapeOriginalPosition.current) {
      // console.log('Dragging a shape')
      draggingShape.current.position.x = draggingShapeOriginalPosition.current.x + mousePosition.current.x - mouseDownPosition.current.x
      draggingShape.current.position.y = draggingShapeOriginalPosition.current.y + mousePosition.current.y - mouseDownPosition.current.y
      needsRender = true
    }

    if (needsRender) {
      requestAnimationFrame(doRender)
    }
  }, [])

  const handleEndDrag = useCallback(() => {
    // console.log('handleEndDrag')

    if (draggingShape.current && mousePosition.current) {
      // If a shape was dragged onto the palette, remove it from the shapes array
      let shape = shapes.current.find(shape => shape === draggingShape.current)
      if (shape && mousePosition.current.x < 240) {
        shapes.current = shapes.current.filter(shape => shape !== draggingShape.current)
      }

      // If a palette shape was dragged onto the drawing area, add it to shapes
      let paletteShape = paletteShapes.current.find(shape => shape === draggingShape.current)
      if (paletteShape && mousePosition.current.x > 240) {
        let newShape = paletteShape.clone()
        shapes.current.push(newShape)
        hoverShape.current = newShape
      }

      saveShapes()
    }

    // Reset palette shapes
    paletteShapes.current = getPaletteShapes()

    // Reset dragging shape
    isDragging.current = false
    draggingShape.current = null
    draggingShapeOriginalPosition.current = null

    requestAnimationFrame(doRender)
  }, [])


  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    mousePosition.current = { x: e.clientX, y: e.clientY }
    // console.log('mousemove', mousePosition.current)

    let needsRender = false

    // See if the hover shape has changed. Iterate in reverse order so that topmost shapes are hit first.
    let newHoverShape = performHitTest(mousePosition.current)
    if (newHoverShape !== hoverShape.current) {
      hoverShape.current = newHoverShape
      needsRender = true
    }

    // Determine if the mouse is dragging
    if (mouseDownPosition.current) {
      if (isDragging.current) {
        handleDrag()
      } else {
        let dx = mousePosition.current.x - mouseDownPosition.current.x
        let dy = mousePosition.current.y - mouseDownPosition.current.y
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          handleBeginDrag()
        }
      }
    }

    // Render if needed
    if (needsRender) {
      requestAnimationFrame(doRender)
    }

  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = e.nativeEvent
    mouseDownPosition.current = { x, y }

    // Determine if the mouse down occurred on a shape
    mouseDownShape.current = performHitTest(mouseDownPosition.current)
    // console.log('mousedown', mouseDownPosition.current)
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseDownPosition.current = null
    mouseDownShape.current = null
    if (isDragging.current) {
      handleEndDrag()
    }
    // console.log('mouseup')
  }, [])


  return (
    <div className="App">
      <canvas
        ref={refCanvas}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </div>
  )
}

export default App
