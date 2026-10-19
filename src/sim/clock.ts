export class FixedStepClock {
  private accumulator = 0;
  private previous: number | null = null;
  constructor(private readonly dt: number, private readonly maxSteps = 5) {}
  advance(timeSeconds: number, step: () => void): number {
    if (this.previous === null) { this.previous = timeSeconds; return 0; }
    const frame = Math.max(0, Math.min(0.25, timeSeconds - this.previous));
    this.previous = timeSeconds;
    this.accumulator += frame;
    let steps = 0;
    while (this.accumulator >= this.dt && steps < this.maxSteps) {
      step(); this.accumulator -= this.dt; steps++;
    }
    if (steps === this.maxSteps && this.accumulator >= this.dt) this.accumulator = this.accumulator % this.dt;
    return this.accumulator / this.dt;
  }
  reset(): void { this.previous = null; this.accumulator = 0; }
}
