import { FatRhombusShape, HexagonShape, Shape, SkinnyRhombusShape, SquareShape, TrapezoidShape, TriangleShape } from "./Shape";

type PropType = {
  ctx: CanvasRenderingContext2D,
  paletteShapes: Shape[],
  shapes: Shape[],
  hoverShape: Shape | null,
  draggingShape: Shape | null,
  draggingOntoPalette: boolean,
}

export function render({
  ctx,
  paletteShapes,
  shapes,
  hoverShape,
  draggingShape,
  draggingOntoPalette
}: PropType) {
  // console.log('rendering')

  let width = ctx.canvas.width;
  let height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ddd'
  // const gradient = ctx.createLinearGradient(0, 0, 0, height);
  // gradient.addColorStop(0, '#bbb');
  // gradient.addColorStop(1, '#eee');
  ctx.fillStyle = '#ddd';
  ctx.fillRect(0, 0, width, height);


  // Draw shapes
  shapes.forEach(shape => {
    if (shape === draggingShape) return // This will be rendered separately below
    let hit = hoverShape?.id === shape.id
    shape.render(ctx, hit)
  })

  // Draw shape palette
  ctx.fillStyle = '#aaa'
  ctx.fillRect(0, 0, 240, height)
  ctx.beginPath()
  ctx.moveTo(240, 0)
  ctx.lineTo(240, height)
  if (draggingOntoPalette) {
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 4
  } else {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
  }
  ctx.stroke()

  // Draw palette shapes last, so that if we are dragging one it appears on top
  paletteShapes.forEach(shape => {
    let hit = hoverShape?.id === shape.id || draggingShape?.id === shape.id
    shape.render(ctx, hit)
  })

  // Draw the dragging shape last, so that it appears on top of everything, even the palette
  draggingShape?.render(ctx, true)
}