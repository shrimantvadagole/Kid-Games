import { BUBBLE_RADIUS, BUBBLE_DIAMETER, ROW_HEIGHT, GAME_WIDTH } from './Constants.ts';
import { Point, GridPos } from './Types.ts';

export function getGridPixelPos(row: number, col: number, rowOffset: number = 0): Point {
    // rowOffset is used when the whole board shifts down
    const isOddRow = (row + rowOffset) % 2 !== 0;
    const startX = isOddRow ? BUBBLE_DIAMETER : BUBBLE_RADIUS;
    
    return {
        x: startX + col * BUBBLE_DIAMETER,
        y: BUBBLE_RADIUS + row * ROW_HEIGHT
    };
}

export function distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getNeighbors(row: number, col: number, rowOffset: number = 0): GridPos[] {
    const isOddRow = (row + rowOffset) % 2 !== 0;
    const neighbors: GridPos[] = [];

    // Left and Right
    neighbors.push({ row, col: col - 1 });
    neighbors.push({ row, col: col + 1 });

    if (isOddRow) {
        // Top
        neighbors.push({ row: row - 1, col });
        neighbors.push({ row: row - 1, col: col + 1 });
        // Bottom
        neighbors.push({ row: row + 1, col });
        neighbors.push({ row: row + 1, col: col + 1 });
    } else {
        // Top
        neighbors.push({ row: row - 1, col: col - 1 });
        neighbors.push({ row: row - 1, col });
        // Bottom
        neighbors.push({ row: row + 1, col: col - 1 });
        neighbors.push({ row: row + 1, col });
    }

    return neighbors;
}

export function getRandomColor(colors: string[]): string {
    return colors[Math.floor(Math.random() * colors.length)];
}
