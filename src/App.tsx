import React, { useCallback, useEffect, useRef } from 'react'
import './App.css'
import { render } from './render'
import { SquareShape, TriangleShape, HexagonShape, FatRhombusShape, SkinnyRhombusShape, TrapezoidShape, Shape, reviver } from './Shape'

type Match = {
  fixed: {
    shape: Shape,
    point: { x: number, y: number },
    normal: { x: number, y: number }
  },
  moving: {
    shape: Shape,
    point: { x: number, y: number },
    normal: { x: number, y: number }
  }
}

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
  const draggingShapeGrabLocal = useRef<null | { x: number, y: number }>(null)

  const paletteShapes = useRef<Shape[]>(getPaletteShapes())
  const shapes = useRef<Shape[]>(localStorage.getItem('shapes') ? JSON.parse(localStorage.getItem('shapes')!, reviver) : [])

  const closestMatch = useRef<null | Match>(null)

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
            && mousePosition.current.x < 240
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
    if (shape && mouseDownPosition.current) {
      draggingShape.current = shape

      draggingShapeGrabLocal.current = shape.toLocalPoint(mouseDownPosition.current)
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
    if (isDragging.current && draggingShape.current && draggingShapeGrabLocal.current) {
      // console.log('Dragging a shape')

      // Move shape to follow mouse

      let grabWorld = draggingShape.current.toWorldPoint(draggingShapeGrabLocal.current)
      let deltaWorld = {
        x: mousePosition.current.x - grabWorld.x,
        y: mousePosition.current.y - grabWorld.y
      }
      let grabMoment = {
        x: grabWorld.x - draggingShape.current.position.x,
        y: grabWorld.y - draggingShape.current.position.y
      }
      // delta cross grabMoment
      let cross = (deltaWorld.x * grabMoment.y - deltaWorld.y * grabMoment.x) / draggingShape.current.maxDistanceSquaredFromCenter
      draggingShape.current.rotation += -cross

      // After adjusting rotation, update deltaWorld
      grabWorld = draggingShape.current.toWorldPoint(draggingShapeGrabLocal.current)
      deltaWorld = {
        x: mousePosition.current.x - grabWorld.x,
        y: mousePosition.current.y - grabWorld.y
      }

      draggingShape.current.position.x += deltaWorld.x
      draggingShape.current.position.y += deltaWorld.y

      closestMatch.current = getClosestMatch(draggingShape.current, shapes.current)

      needsRender = true
    }

    if (needsRender) {
      requestAnimationFrame(doRender)
    }
  }, [])

  const handleEndDrag = useCallback(() => {
    // console.log('handleEndDrag')

    if (draggingShape.current && mousePosition.current) {

      if (closestMatch.current) {
        applyMatchTransform(closestMatch.current)
      }

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
    draggingShapeGrabLocal.current = null

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


export function applyMatchTransform(match: Match) {

  let fixedAngle = Math.atan2(match.fixed.normal.y, match.fixed.normal.x)
  let movingAngle = Math.atan2(-match.moving.normal.y, -match.moving.normal.x)
  let angleDiff = fixedAngle - movingAngle

  let movingPointLocal = match.moving.shape.toLocalPoint(match.moving.point)
  match.moving.shape.rotation += angleDiff
  let movingPointWorld = match.moving.shape.toWorldPoint(movingPointLocal)
  let fixedPointWorld = match.fixed.point

  let delta = {
    x: fixedPointWorld.x - movingPointWorld.x,
    y: fixedPointWorld.y - movingPointWorld.y
  }

  match.moving.shape.position.x += delta.x
  match.moving.shape.position.y += delta.y

}

/**
 * Returns the point and normal of two edges that are closest to each other, in world coordinates.
 * @param subject 
 * @param targets 
 * @returns 
 */
function getClosestMatch(subject: Shape, targets: Shape[]) {
  // Compute closest edge between the shape we are dragging and all other shapes
  let closestEdgeDistance = Infinity
  let closest: null | Match = null
  for (let shape2 of targets) {
    if (subject === shape2) {
      continue
    }
    for (let i1 = 0; i1 < subject.vertexList.length; i1++) {
      let p11 = subject.vertexList[i1]
      let p12 = subject.vertexList[(i1 + 1) % subject.vertexList.length]
      let p1mid = { x: (p11.x + p12.x) / 2, y: (p11.y + p12.y) / 2 }
      let p1norm = { x: p12.y - p11.y, y: p11.x - p12.x }
      let cos1 = Math.cos(subject.rotation)
      let sin1 = Math.sin(subject.rotation)
      p1mid = {
        x: p1mid.x * cos1 - p1mid.y * sin1 + subject.position.x,
        y: p1mid.x * sin1 + p1mid.y * cos1 + subject.position.y,
      }
      p1norm = {
        x: p1norm.x * cos1 - p1norm.y * sin1,
        y: p1norm.x * sin1 + p1norm.y * cos1,
      }
      let p1normAngle = Math.atan2(p1norm.y, p1norm.x)

      for (let i2 = 0; i2 < shape2.vertexList.length; i2++) {
        let p21 = shape2.vertexList[i2]
        let p22 = shape2.vertexList[(i2 + 1) % shape2.vertexList.length]
        let p2mid = { x: (p21.x + p22.x) / 2, y: (p21.y + p22.y) / 2 }
        let p2norm = { x: p22.y - p21.y, y: p21.x - p22.x }
        let cos2 = Math.cos(shape2.rotation)
        let sin2 = Math.sin(shape2.rotation)
        p2mid = {
          x: p2mid.x * cos2 - p2mid.y * sin2 + shape2.position.x,
          y: p2mid.x * sin2 + p2mid.y * cos2 + shape2.position.y
        }
        p2norm = {
          x: p2norm.x * cos2 - p2norm.y * sin2,
          y: p2norm.x * sin2 + p2norm.y * cos2,
        }
        let p2normAngle = Math.atan2(p2norm.y, p2norm.x)

        let angleDiff = p1normAngle - p2normAngle
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2


        let d2 = (p1mid.x - p2mid.x) ** 2 + (p1mid.y - p2mid.y) ** 2
        if (d2 < closestEdgeDistance && Math.abs(angleDiff) > 3 * Math.PI / 4) {
          closestEdgeDistance = d2
          closest = {
            fixed: {
              shape: shape2,
              point: p2mid,
              normal: p2norm
            },
            moving: {
              shape: subject,
              point: p1mid,
              normal: p1norm
            }
          }
        }
      }
    }
  }

  if (closestEdgeDistance < 50 ** 2) {
    return closest
  } else {
    return null
  }
}

export default App
