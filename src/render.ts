import { FatRhombusShape, HexagonShape, SkinnyRhombusShape, SquareShape, TrapezoidShape, TriangleShape } from "./Shape";

export function render(ctx: CanvasRenderingContext2D, mousePosition: null | { x: number, y: number }) {
  let width = ctx.canvas.width;
  let height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ddd'
  // const gradient = ctx.createLinearGradient(0, 0, 0, height);
  // gradient.addColorStop(0, '#bbb');
  // gradient.addColorStop(1, '#eee');
  ctx.fillStyle = '#ddd';
  ctx.fillRect(0, 0, width, height);

  // Draw shape palette

  ctx.fillStyle = '#aaa'
  ctx.fillRect(0, 0, 240, height)
  ctx.beginPath()
  ctx.moveTo(240, 0)
  ctx.lineTo(240, height)
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 2
  ctx.stroke()

  let paletteShapes = [
    new SquareShape({ x: 120, y: 100 }, 0),
    new TriangleShape({ x: 120, y: 220 }, 0),
    new HexagonShape({ x: 120, y: 400 }, 0),
    new FatRhombusShape({ x: 120, y: 580 }, 0),
    new SkinnyRhombusShape({ x: 120, y: 700 }, 0),
    new TrapezoidShape({ x: 120, y: 820 }, 0),
  ]

  paletteShapes.forEach(shape => {
    let hit = mousePosition ? shape.hitTest(mousePosition) : false
    shape.render(ctx, hit)
  })



}