import { 
    GAME_WIDTH, GAME_HEIGHT, BUBBLE_RADIUS, COLORS, 
    PROJECTILE_SPEED, MAX_COLS, MAX_ROWS, MISSES_UNTIL_NEW_ROW 
} from './Constants.ts';
import { BubbleData, Projectile, Particle, FallingBubble, Point, GridPos } from './Types.ts';
import { getGridPixelPos, distance, getNeighbors, getRandomColor } from './Utils.ts';

export class GameEngine {
    private ctx: CanvasRenderingContext2D;
    private grid: (BubbleData | null)[][];
    private rowOffset: number = 0; // How many rows have been added at the top
    
    private projectile: Projectile | null = null;
    private nextColor: string;
    private currentColor: string;
    
    private particles: Particle[] = [];
    private fallingBubbles: FallingBubble[] = [];
    
    private shooterAngle: number = Math.PI / 2; // Pointing straight up
    private shooterPos: Point = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - BUBBLE_RADIUS * 2 };
    
    private score: number = 0;
    private misses: number = 0;
    
    private onScoreChange: (score: number) => void;
    private onGameOver: (won: boolean) => void;
    
    private lastTime: number = 0;
    private animationFrameId: number = 0;
    private isRunning: boolean = false;

    constructor(
        canvas: HTMLCanvasElement, 
        onScoreChange: (score: number) => void,
        onGameOver: (won: boolean) => void
    ) {
        this.ctx = canvas.getContext('2d')!;
        this.onScoreChange = onScoreChange;
        this.onGameOver = onGameOver;
        
        this.grid = Array(MAX_ROWS).fill(null).map(() => Array(MAX_COLS).fill(null));
        this.currentColor = getRandomColor(COLORS);
        this.nextColor = getRandomColor(COLORS);
        
        this.initLevel();
    }

    private initLevel() {
        this.grid = Array(MAX_ROWS).fill(null).map(() => Array(MAX_COLS).fill(null));
        this.rowOffset = 0;
        this.score = 0;
        this.misses = 0;
        this.onScoreChange(this.score);

        // Fill top 5 rows
        for (let r = 0; r < 5; r++) {
            const colsInRow = (r % 2 !== 0) ? MAX_COLS - 1 : MAX_COLS;
            for (let c = 0; c < colsInRow; c++) {
                const pos = getGridPixelPos(r, c, this.rowOffset);
                this.grid[r][c] = {
                    row: r,
                    col: c,
                    color: getRandomColor(COLORS),
                    x: pos.x,
                    y: pos.y
                };
            }
        }
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    public setShooterAngle(x: number, y: number) {
        if (this.projectile) return; // Don't aim while firing
        const dx = x - this.shooterPos.x;
        const dy = y - this.shooterPos.y;
        this.shooterAngle = Math.atan2(dy, dx);
        
        // Clamp angle to prevent shooting downwards
        if (this.shooterAngle > -0.1) this.shooterAngle = -0.1;
        if (this.shooterAngle < -Math.PI + 0.1) this.shooterAngle = -Math.PI + 0.1;
    }

    public fire() {
        if (this.projectile || !this.isRunning) return;

        this.projectile = {
            x: this.shooterPos.x,
            y: this.shooterPos.y,
            vx: Math.cos(this.shooterAngle) * PROJECTILE_SPEED,
            vy: Math.sin(this.shooterAngle) * PROJECTILE_SPEED,
            color: this.currentColor,
            radius: BUBBLE_RADIUS
        };

        this.currentColor = this.nextColor;
        this.nextColor = getRandomColor(this.getAvailableColors());
    }

    private getAvailableColors(): string[] {
        const available = new Set<string>();
        for (let r = 0; r < MAX_ROWS; r++) {
            for (let c = 0; c < MAX_COLS; c++) {
                if (this.grid[r][c]) {
                    available.add(this.grid[r][c]!.color);
                }
            }
        }
        return available.size > 0 ? Array.from(available) : COLORS;
    }

    private loop = (time: number) => {
        if (!this.isRunning) return;
        
        const dt = (time - this.lastTime) / 1000; // seconds
        this.lastTime = time;

        this.update(dt);
        this.draw();

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    private update(dt: number) {
        this.updateProjectile(dt);
        this.updateAnimations(dt);
        this.checkWinLoss();
    }

    private updateProjectile(dt: number) {
        if (!this.projectile) return;

        const p = this.projectile;
        
        // Move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wall collision
        if (p.x - p.radius <= 0) {
            p.x = p.radius;
            p.vx *= -1;
        } else if (p.x + p.radius >= GAME_WIDTH) {
            p.x = GAME_WIDTH - p.radius;
            p.vx *= -1;
        }

        // Ceiling collision
        if (p.y - p.radius <= 0) {
            p.y = p.radius;
            this.snapProjectile();
            return;
        }

        // Bubble collision
        for (let r = 0; r < MAX_ROWS; r++) {
            for (let c = 0; c < MAX_COLS; c++) {
                const bubble = this.grid[r][c];
                if (bubble) {
                    const dist = distance(p, bubble);
                    if (dist < BUBBLE_RADIUS * 2 - 2) { // Slight tolerance
                        this.snapProjectile();
                        return;
                    }
                }
            }
        }
    }

    private snapProjectile() {
        if (!this.projectile) return;

        // Find closest empty grid slot
        let closestDist = Infinity;
        let bestR = -1;
        let bestC = -1;

        for (let r = 0; r < MAX_ROWS; r++) {
            const colsInRow = ((r + this.rowOffset) % 2 !== 0) ? MAX_COLS - 1 : MAX_COLS;
            for (let c = 0; c < colsInRow; c++) {
                if (!this.grid[r][c]) {
                    const pos = getGridPixelPos(r, c, this.rowOffset);
                    const dist = distance(this.projectile, pos);
                    if (dist < closestDist) {
                        closestDist = dist;
                        bestR = r;
                        bestC = c;
                    }
                }
            }
        }

        if (bestR !== -1 && bestC !== -1) {
            const pos = getGridPixelPos(bestR, bestC, this.rowOffset);
            this.grid[bestR][bestC] = {
                row: bestR,
                col: bestC,
                color: this.projectile.color,
                x: pos.x,
                y: pos.y
            };
            
            this.projectile = null;
            this.handleMatches(bestR, bestC);
        } else {
            // Failsafe, shouldn't happen unless board is completely full
            this.projectile = null;
        }
    }

    private handleMatches(startR: number, startC: number) {
        const startBubble = this.grid[startR][startC];
        if (!startBubble) return;

        const matchColor = startBubble.color;
        const matched = this.findConnected(startR, startC, matchColor);

        if (matched.length >= 3) {
            // Pop matches
            matched.forEach(pos => {
                const b = this.grid[pos.row][pos.col]!;
                this.createParticles(b.x, b.y, b.color);
                this.grid[pos.row][pos.col] = null;
            });
            
            this.score += matched.length * 10;
            this.onScoreChange(this.score);
            
            // Check for floating bubbles
            this.dropDisconnected();
            this.misses = 0; // Reset misses on hit
        } else {
            this.misses++;
            if (this.misses >= MISSES_UNTIL_NEW_ROW) {
                this.addRow();
                this.misses = 0;
            }
        }
    }

    private findConnected(startR: number, startC: number, targetColor: string): GridPos[] {
        const visited = new Set<string>();
        const queue: GridPos[] = [{ row: startR, col: startC }];
        const connected: GridPos[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = `${current.row},${current.col}`;

            if (visited.has(key)) continue;
            visited.add(key);

            const bubble = this.grid[current.row]?.[current.col];
            if (bubble && bubble.color === targetColor) {
                connected.push(current);
                const neighbors = getNeighbors(current.row, current.col, this.rowOffset);
                for (const n of neighbors) {
                    if (n.row >= 0 && n.row < MAX_ROWS && n.col >= 0 && n.col < MAX_COLS) {
                        queue.push(n);
                    }
                }
            }
        }
        return connected;
    }

    private dropDisconnected() {
        const connectedToCeiling = new Set<string>();
        const queue: GridPos[] = [];

        // Start BFS from top row
        for (let c = 0; c < MAX_COLS; c++) {
            if (this.grid[0][c]) {
                queue.push({ row: 0, col: c });
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = `${current.row},${current.col}`;

            if (connectedToCeiling.has(key)) continue;
            connectedToCeiling.add(key);

            const neighbors = getNeighbors(current.row, current.col, this.rowOffset);
            for (const n of neighbors) {
                if (n.row >= 0 && n.row < MAX_ROWS && n.col >= 0 && n.col < MAX_COLS) {
                    if (this.grid[n.row][n.col] && !connectedToCeiling.has(`${n.row},${n.col}`)) {
                        queue.push(n);
                    }
                }
            }
        }

        // Find bubbles not in connectedToCeiling
        let droppedCount = 0;
        for (let r = 0; r < MAX_ROWS; r++) {
            for (let c = 0; c < MAX_COLS; c++) {
                if (this.grid[r][c] && !connectedToCeiling.has(`${r},${c}`)) {
                    const b = this.grid[r][c]!;
                    this.fallingBubbles.push({
                        x: b.x,
                        y: b.y,
                        vy: 0,
                        color: b.color
                    });
                    this.grid[r][c] = null;
                    droppedCount++;
                }
            }
        }
        
        if (droppedCount > 0) {
            this.score += droppedCount * 20; // Bonus for dropping
            this.onScoreChange(this.score);
        }
    }

    private addRow() {
        this.rowOffset++;
        
        // Shift everything down
        for (let r = MAX_ROWS - 1; r > 0; r--) {
            for (let c = 0; c < MAX_COLS; c++) {
                this.grid[r][c] = this.grid[r - 1][c];
                if (this.grid[r][c]) {
                    this.grid[r][c]!.row = r;
                    const pos = getGridPixelPos(r, c, this.rowOffset);
                    this.grid[r][c]!.x = pos.x;
                    this.grid[r][c]!.y = pos.y;
                }
            }
        }

        // Add new top row
        const colsInRow = (this.rowOffset % 2 !== 0) ? MAX_COLS - 1 : MAX_COLS;
        for (let c = 0; c < MAX_COLS; c++) {
            if (c < colsInRow) {
                const pos = getGridPixelPos(0, c, this.rowOffset);
                this.grid[0][c] = {
                    row: 0,
                    col: c,
                    color: getRandomColor(this.getAvailableColors()),
                    x: pos.x,
                    y: pos.y
                };
            } else {
                this.grid[0][c] = null;
            }
        }
    }

    private createParticles(x: number, y: number, color: string) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 1,
                maxLife: 1,
                size: Math.random() * 4 + 2
            });
        }
    }

    private updateAnimations(dt: number) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 500 * dt; // gravity
            p.life -= dt * 2;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Falling bubbles
        for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
            const fb = this.fallingBubbles[i];
            fb.vy += 1000 * dt; // gravity
            fb.y += fb.vy * dt;
            if (fb.y > GAME_HEIGHT + BUBBLE_RADIUS) {
                this.fallingBubbles.splice(i, 1);
            }
        }
    }

    private checkWinLoss() {
        // Check Loss (bubbles reached bottom)
        const bottomLimit = this.shooterPos.y - BUBBLE_RADIUS * 2;
        for (let r = MAX_ROWS - 1; r >= 0; r--) {
            for (let c = 0; c < MAX_COLS; c++) {
                if (this.grid[r][c] && this.grid[r][c]!.y > bottomLimit) {
                    this.stop();
                    this.onGameOver(false);
                    return;
                }
            }
        }

        // Check Win (no bubbles left)
        let hasBubbles = false;
        for (let r = 0; r < MAX_ROWS; r++) {
            for (let c = 0; c < MAX_COLS; c++) {
                if (this.grid[r][c]) {
                    hasBubbles = true;
                    break;
                }
            }
            if (hasBubbles) break;
        }

        if (!hasBubbles) {
            this.stop();
            this.onGameOver(true);
        }
    }

    private draw() {
        // Clear
        this.ctx.fillStyle = '#1e293b'; // slate-800
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Grid Bubbles
        for (let r = 0; r < MAX_ROWS; r++) {
            for (let c = 0; c < MAX_COLS; c++) {
                const bubble = this.grid[r][c];
                if (bubble) {
                    this.drawBubble(bubble.x, bubble.y, bubble.color);
                }
            }
        }

        // Draw Falling Bubbles
        for (const fb of this.fallingBubbles) {
            this.drawBubble(fb.x, fb.y, fb.color);
        }

        // Draw Particles
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // Draw Shooter Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooterPos.x, this.shooterPos.y);
        this.ctx.lineTo(
            this.shooterPos.x + Math.cos(this.shooterAngle) * 200,
            this.shooterPos.y + Math.sin(this.shooterAngle) * 200
        );
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw Next Bubble Indicator
        this.drawBubble(this.shooterPos.x - 60, this.shooterPos.y + 20, this.nextColor, 0.5);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('NEXT', this.shooterPos.x - 75, this.shooterPos.y + 50);

        // Draw Current Shooter Bubble
        if (!this.projectile) {
            this.drawBubble(this.shooterPos.x, this.shooterPos.y, this.currentColor);
        }

        // Draw Projectile
        if (this.projectile) {
            this.drawBubble(this.projectile.x, this.projectile.y, this.projectile.color);
        }
        
        // Draw Danger Line
        const bottomLimit = this.shooterPos.y - BUBBLE_RADIUS * 2;
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'; // red-500 with opacity
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, bottomLimit + BUBBLE_RADIUS);
        this.ctx.lineTo(GAME_WIDTH, bottomLimit + BUBBLE_RADIUS);
        this.ctx.stroke();
    }

    private drawBubble(x: number, y: number, color: string, scale: number = 1) {
        const r = BUBBLE_RADIUS * scale;
        
        // Main circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();

        // Highlight (shiny effect)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}
