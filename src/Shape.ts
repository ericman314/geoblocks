const SIDE = 100;

const vertexListSquare = [
  { x: -SIDE / 2, y: -SIDE / 2 },
  { x: SIDE / 2, y: -SIDE / 2 },
  { x: SIDE / 2, y: SIDE / 2 },
  { x: -SIDE / 2, y: SIDE / 2 }
]

const triangleVertexList = [
  { x: -SIDE / 2, y: -SIDE * Math.sqrt(3) / 6 },
  { x: SIDE / 2, y: -SIDE * Math.sqrt(3) / 6 },
  { x: 0, y: SIDE * Math.sqrt(3) / 3 }
]

const hexagonVertexList = [
  { x: SIDE, y: 0 },
  { x: SIDE / 2, y: SIDE * Math.sqrt(3) / 2 },
  { x: -SIDE / 2, y: SIDE * Math.sqrt(3) / 2 },
  { x: -SIDE, y: 0 },
  { x: -SIDE / 2, y: -SIDE * Math.sqrt(3) / 2 },
  { x: SIDE / 2, y: -SIDE * Math.sqrt(3) / 2 }
]

const FatRhombusVertexList = [
  { x: SIDE * Math.sqrt(3) / 2, y: 0 },
  { x: 0, y: SIDE / 2 },
  { x: -SIDE * Math.sqrt(3) / 2, y: 0 },
  { x: 0, y: -SIDE / 2 }
]

const SkinnyRhombusVertexList = [
  { x: SIDE * Math.cos(Math.PI / 12), y: 0 },
  { x: 0, y: SIDE * Math.sin(Math.PI / 12) },
  { x: -SIDE * Math.cos(Math.PI / 12), y: 0 },
  { x: 0, y: -SIDE * Math.sin(Math.PI / 12) }
]

const TrapezoidVertexList = [
  { x: -SIDE, y: SIDE * Math.sqrt(3) / 4 },
  { x: -SIDE / 2, y: -SIDE * Math.sqrt(3) / 4 },
  { x: SIDE / 2, y: -SIDE * Math.sqrt(3) / 4 },
  { x: SIDE, y: SIDE * Math.sqrt(3) / 4 }
]

class Shape {
  type: string
  id: string
  color: string
  position: { x: number, y: number }
  rotation: number

  vertexList: { x: number, y: number }[]
  maxDistanceSquaredFromCenter: number

  constructor(position: { x: number, y: number }, rotation: number) {
    if (new.target === Shape) {
      throw new Error('Shape is an abstract class and cannot be instantiated directly.');
    }
    this.id = 'shape-' + Math.random().toString(36).substring(2)
    this.position = position
    this.rotation = rotation
    this.type = 'shape'
    this.color = 'black'
    this.vertexList = []
    this.maxDistanceSquaredFromCenter = 0
  }

  computeMaxDistanceFromCenter() {
    this.maxDistanceSquaredFromCenter = 0
    this.vertexList.forEach(vertex => {
      let distance = vertex.x * vertex.x + vertex.y * vertex.y
      if (distance > this.maxDistanceSquaredFromCenter) {
        this.maxDistanceSquaredFromCenter = distance
      }
    })
  }

  hitTest(point: { x: number, y: number }) {
    if (this.maxDistanceSquaredFromCenter === 0) {
      this.computeMaxDistanceFromCenter()
    }
    let dx = point.x - this.position.x
    let dy = point.y - this.position.y
    let distanceSquared = dx * dx + dy * dy
    if (distanceSquared > this.maxDistanceSquaredFromCenter) {
      return false
    }
    // Transform the point into the shape's local coordinate system
    let cos = Math.cos(this.rotation)
    let sin = Math.sin(this.rotation)
    let localPoint = {
      x: dx * cos + dy * sin,
      y: -dx * sin + dy * cos
    }
    // Because each shape is convex, we can just verify that the point is on the same side of each segment.
    let inside = true
    for (let i = 0; i < this.vertexList.length; i++) {
      let vertex1 = this.vertexList[i]
      let vertex2 = this.vertexList[(i + 1) % this.vertexList.length]
      let crossProduct = (vertex2.x - vertex1.x) * (localPoint.y - vertex1.y) - (vertex2.y - vertex1.y) * (localPoint.x - vertex1.x)
      if (crossProduct < 0) {
        inside = false
        break
      }
    }
    return inside
  }


  render(ctx: CanvasRenderingContext2D, hover?: boolean) {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)
    ctx.fillStyle = this.color
    ctx.strokeStyle = hover ? 'white' : 'black'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(this.vertexList[0].x, this.vertexList[0].y)
    this.vertexList.slice(1).forEach(vertex => {
      ctx.lineTo(vertex.x, vertex.y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

export class SquareShape extends Shape {
  type = 'square' as const
  color = '#f70'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    this.vertexList = vertexListSquare
  }

}

export class TriangleShape extends Shape {
  type = 'triangle' as const
  color = '#0a0'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    // Equilateral triangle with origin at center
    this.vertexList = triangleVertexList
  }
}

export class HexagonShape extends Shape {
  type = 'hexagon' as const
  color = '#ff0'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    // Equilateral hexagon with origin at center
    this.vertexList = hexagonVertexList
  }
}

export class FatRhombusShape extends Shape {
  type = 'fatRhombus' as const
  color = '#02f'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    // Equilateral hexagon with origin at center
    this.vertexList = FatRhombusVertexList
  }
}

export class SkinnyRhombusShape extends Shape {
  type = 'skinnyRhombus' as const
  color = '#ec8'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    // Equilateral hexagon with origin at center
    this.vertexList = SkinnyRhombusVertexList
  }
}

export class TrapezoidShape extends Shape {
  type = 'trapezoid' as const
  color = '#f00'

  constructor(position: { x: number, y: number }, rotation: number) {
    super(position, rotation);

    // Equilateral hexagon with origin at center
    this.vertexList = TrapezoidVertexList
  }
}