export interface Point {
    x: number;
    y: number;
}

export interface GridPos {
    row: number;
    col: number;
}

export interface BubbleData {
    color: string;
    row: number;
    col: number;
    x: number;
    y: number;
}

export interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
}

export interface FallingBubble {
    x: number;
    y: number;
    vy: number;
    color: string;
}

export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
