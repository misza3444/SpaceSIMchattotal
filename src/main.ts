import './style.css';
import { Simulation, FIXED_DT } from './sim/simulation';
import { FixedStepClock } from './sim/clock';
import { SpaceView } from './render/scene';
import { Dashboard } from './ui/dashboard';
import { loadCatalog } from './data/catalog';
import { loadWorld, saveWorld } from './storage/saves';
loadCatalog();
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('App root missing');
root.innerHTML = '<div id="viewport"></div><div id="panel"></div>';
const viewport = root.querySelector<HTMLDivElement>('#viewport')!;
const view = new SpaceView(viewport);
let sim = new Simulation(42);
const clock = new FixedStepClock(FIXED_DT);
const hud = new Dashboard(root.querySelector<HTMLDivElement>('#panel')!, {
  save: () => { void saveWorld(sim.snapshot()).then(() => hud.message('saved')).catch(e => hud.error(e)); },
  load: () => { void loadWorld().then(state => {
    if (!state) { hud.error('Empty save slot'); return; }
    sim = new Simulation(state.seed, state); clock.reset(); hud.message('loaded');
  }).catch(e => hud.error(e)); },
  fresh: () => { sim = new Simulation(42); clock.reset(); hud.message('newWorld'); },
  probe: () => { sim.commands.enqueue({ type: 'spawnProbe' }); hud.message('probed'); },
  language: () => hud.setLanguage(hud.getLanguage() === 'pl' ? 'en' : 'pl')
});
window.addEventListener('resize', () => view.resize(viewport.clientWidth, viewport.clientHeight));
let frameCount = 0, fps = 0, measureStart = 0;
function frame(timestampMs: number): void {
  const now = timestampMs / 1000;
  const alpha = clock.advance(now, () => sim.step());
  view.draw(alpha);
  frameCount++;
  if (now - measureStart >= 1) { fps = frameCount / Math.max(0.01, now - measureStart); frameCount = 0; measureStart = now; }
  hud.update(sim.snapshot(), fps);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
