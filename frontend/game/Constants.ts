export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 800;
export const BUBBLE_RADIUS = 20;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);

export const MAX_COLS = Math.floor(GAME_WIDTH / BUBBLE_DIAMETER);
export const MAX_ROWS = Math.floor((GAME_HEIGHT - 100) / ROW_HEIGHT); // Leave space at bottom

export const PROJECTILE_SPEED = 1200; // pixels per second
export const ANIMATION_SPEED = 800;

export const COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#f97316'  // Orange
];

export const MISSES_UNTIL_NEW_ROW = 5;
