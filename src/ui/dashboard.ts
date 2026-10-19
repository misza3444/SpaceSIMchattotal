import { translate, type Language, type TranslationKey } from '../i18n';
import type { WorldState } from '../sim/types';
export interface UIActions { save: () => void; load: () => void; fresh: () => void; probe: () => void; language: () => void }
export class Dashboard {
  private language: Language = 'pl';
  private readonly stats: HTMLElement;
  private readonly status: HTMLElement;
  private readonly buttons: Record<'save' | 'load' | 'new' | 'probe' | 'language', HTMLButtonElement>;
  private readonly header: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly stage: HTMLElement;
  constructor(host: HTMLElement, actions: UIActions) {
    host.innerHTML = `<div class="dashboard"><div class="masthead"><div class="overline" id="stage"></div><h1 id="title"></h1><p id="subtitle"></p></div><div class="stats" id="stats"></div><div class="actions" id="actions"></div><p id="status" aria-live="polite"></p><div class="footer">SPACE SIM / WEB 0.0.1 <span>●</span> FOUNDATION</div></div>`;
    this.stats = host.querySelector('#stats')!;
    this.status = host.querySelector('#status')!;
    this.header = host.querySelector('#title')!;
    this.subtitle = host.querySelector('#subtitle')!;
    this.stage = host.querySelector('#stage')!;
    const actionsElement = host.querySelector('#actions')!;
    const config = [['save', actions.save], ['load', actions.load], ['new', actions.fresh], ['probe', actions.probe], ['language', actions.language]] as const;
    this.buttons = {} as typeof this.buttons;
    for (const [key, handler] of config) {
      const button = document.createElement('button');
      button.addEventListener('click', handler);
      actionsElement.append(button);
      this.buttons[key] = button;
    }
    this.setLanguage('pl');
  }
  setLanguage(language: Language): void {
    this.language = language;
    const t = (key: TranslationKey) => translate(language, key);
    this.header.textContent = t('title');
    this.subtitle.textContent = t('subtitle');
    this.stage.textContent = t('stage');
    for (const key of ['save', 'load', 'new', 'probe', 'language'] as const) this.buttons[key].textContent = t(key);
    this.message('ready');
  }
  getLanguage(): Language { return this.language; }
  message(key: TranslationKey): void { this.status.textContent = translate(this.language, key); }
  error(error: unknown): void { this.status.textContent = translate(this.language, 'error') + ': ' + String(error); }
  update(state: WorldState, fps: number): void {
    this.stats.replaceChildren();
    for (const [key, value] of [
      ['seed', state.seed.toString()], ['tick', state.tick.toLocaleString()],
      ['entities', state.entities.length.toString()], ['fps', Math.round(fps).toString()]
    ] as const) {
      const item = document.createElement('div'); item.className = 'stat';
      const label = document.createElement('small'); label.textContent = translate(this.language, key);
      const count = document.createElement('strong'); count.textContent = value;
      item.append(label, count); this.stats.append(item);
    }
  }
}
