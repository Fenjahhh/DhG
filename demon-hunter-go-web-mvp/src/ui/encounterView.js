import { RITUALS } from '../data/rituals.js';
import { RARITY_LABELS } from '../data/demons.js';
import { getActiveEncounterDetails, useRitual, attemptBind } from '../services/demonService.js';

export function createEncounterView(store, { toast, onClose } = {}) {
  const dialog = document.querySelector('#encounter-dialog');

  function open() {
    const details = getActiveEncounterDetails(store.getState());
    if (!details) return;
    render(details);
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
    onClose?.();
  }

  function render({ encounter, demon }) {
    const used = new Set(encounter.ritualsUsed.map((ritual) => ritual.ritualId));
    const chance = Math.round((demon.baseBindChance + encounter.bonusChance + (used.has(demon.preferredRitual) ? 0.12 : 0)) * 100);

    dialog.innerHTML = `
      <article class="encounter-card">
        <div class="demon-art">${demonArtwork(demon)}</div>
        <h2>${demon.name}</h2>
        <p>${demon.title}</p>
        <div class="badges">
          <span class="badge">${RARITY_LABELS[demon.rarity]}</span>
          <span class="badge">Biom: ${demon.biome}</span>
          ${encounter.ringId ? `<span class="badge">Ring: ${encounter.ringId}</span>` : ''}
          ${encounter.specialPlace?.typeLabel ? `<span class="badge">${encounter.specialPlace.typeLabel}</span>` : ''}
          <span class="badge">Chance: ${Math.min(96, chance)}%</span>
        </div>
        <p>${demon.flavor}</p>
        <span class="meta">Lieblingsritual: ${ritualName(demon.preferredRitual)}</span>

        <div class="ritual-list">
          ${RITUALS.map((ritual) => `
            <button class="ritual-option ghost-button" data-use-ritual="${ritual.id}" ${used.has(ritual.id) ? 'disabled' : ''}>
              <strong>${ritual.name}</strong><br />
              <span>${ritual.description}</span><br />
              <span class="meta">+${Math.round(ritual.chanceBonus * 100)}% Bindung ${ritual.xpCost ? `· ${ritual.xpCost} EXP` : ''}</span>
            </button>
          `).join('')}
        </div>

        <div class="form-row wrap">
          <button id="bind-demon-button" class="primary-button">Dämon binden</button>
          <button id="close-encounter-button" class="ghost-button">Später</button>
        </div>
      </article>
    `;

    dialog.querySelectorAll('[data-use-ritual]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = useRitual(store, button.dataset.useRitual);
        toast(result.reason ?? `${result.ritual.name} gewirkt.`, result.ok ? 'ok' : 'error');
        const nextDetails = getActiveEncounterDetails(store.getState());
        if (nextDetails) render(nextDetails);
      });
    });

    dialog.querySelector('#bind-demon-button')?.addEventListener('click', () => {
      const result = attemptBind(store);
      if (!result.ok) {
        toast(result.reason, 'error');
        return;
      }
      if (result.success) {
        toast(`${result.demon.name} wurde gebunden. Neue Karte im Album!`, 'ok');
      } else {
        toast(`${result.demon.name} ist entkommen. Der Kreis bleibt offen.`, 'error');
      }
      close();
    });

    dialog.querySelector('#close-encounter-button')?.addEventListener('click', close);
  }

  function ritualName(id) {
    return RITUALS.find((ritual) => ritual.id === id)?.name ?? id;
  }

  return { open, close };
}

function demonArtwork(demon) {
  if (demon.artworkUrl) {
    return `<img src="${escapeHtml(demon.artworkUrl)}" alt="${escapeHtml(demon.name)}" loading="lazy" />`;
  }
  return demon.art;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
