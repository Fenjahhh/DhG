import { DEMONS, RARITY_LABELS } from '../data/demons.js';
import { RITUALS } from '../data/rituals.js';
import { addXp } from '../core/rewards.js';
import { createPhotoAttachment, normalizeNotePhotos } from '../services/photoService.js';
import { runDefense, getDefenseSummary, getTowerStats } from '../services/towerDefenseService.js';

export function renderRitualsPanel(root) {
  root.innerHTML = `
    <article class="card">
      <h2>Rituale</h2>
      <p>Rituale erhöhen deine Bindungschance, ohne das Spiel hektisch zu machen.</p>
      <div class="ritual-list">
        ${RITUALS.map((ritual) => `
          <div class="list-item">
            <div>
              <strong>${ritual.name}</strong>
              <span class="meta">${ritual.description}</span>
              <span class="meta">Bonus: +${Math.round(ritual.chanceBonus * 100)}% ${ritual.xpCost ? `· Kosten: ${ritual.xpCost} EXP` : ''}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

export function bindHabitsPanel(store, root, toast) {
  function render(state) {
    root.innerHTML = `
      <article class="form-card">
        <h2>Habits</h2>
        <p>Positive Habits geben EXP fürs Tun. Negative Habits geben EXP, wenn du ihnen heute widerstehst.</p>
        <form id="habit-form" class="form-row wrap">
          <input name="name" placeholder="z.B. 10 Minuten spazieren" required />
          <select name="type" aria-label="Habit Typ">
            <option value="positive">positiv</option>
            <option value="negative">negativ / widerstehen</option>
          </select>
          <button class="primary-button" type="submit">Habit hinzufügen</button>
        </form>
      </article>
      <div class="list">
        ${state.habits.map((habit) => habitTemplate(habit)).join('') || emptyTemplate('Noch keine Habits. Ein Mini-Habit reicht.')}
      </div>
    `;

    root.querySelector('#habit-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      store.setState((draft) => {
        draft.habits.unshift({
          id: crypto.randomUUID(),
          name: data.get('name').toString().trim(),
          type: data.get('type'),
          streak: 0,
          completedDate: null,
          createdAt: new Date().toISOString()
        });
        return draft;
      }, 'habit:add');
      toast('Habit in den Kreis aufgenommen.');
    });

    root.querySelectorAll('[data-complete-habit]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.completeHabit;
        const today = new Date().toISOString().slice(0, 10);
        store.setState((draft) => {
          const habit = draft.habits.find((item) => item.id === id);
          if (!habit || habit.completedDate === today) return draft;
          habit.completedDate = today;
          habit.streak += 1;
          return draft;
        }, 'habit:complete');
        addXp(store, 10, 'Habit');
        toast('+10 EXP für dein Habit-Ritual.');
      });
    });

    root.querySelectorAll('[data-delete-habit]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteHabit;
        store.setState((draft) => {
          draft.habits = draft.habits.filter((item) => item.id !== id);
          return draft;
        }, 'habit:delete');
      });
    });
  }

  subscribePanel(store, render, ['habit:']);
}

export function bindTodosPanel(store, root, toast) {
  function render(state) {
    root.innerHTML = `
      <article class="form-card">
        <h2>To-dos</h2>
        <p>Normale Aufgaben. Kein Druck. Ein erledigter Krümel ist auch Magie.</p>
        <form id="todo-form" class="form-row">
          <input name="text" placeholder="z.B. Wäsche anstellen" required />
          <button class="primary-button" type="submit">+</button>
        </form>
      </article>
      <div class="list">
        ${state.todos.map((todo) => todoTemplate(todo)).join('') || emptyTemplate('Keine offenen To-dos.')}
      </div>
    `;

    root.querySelector('#todo-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      store.setState((draft) => {
        draft.todos.unshift({
          id: crypto.randomUUID(),
          text: data.get('text').toString().trim(),
          done: false,
          createdAt: new Date().toISOString(),
          completedAt: null
        });
        return draft;
      }, 'todo:add');
    });

    root.querySelectorAll('[data-complete-todo]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.completeTodo;
        store.setState((draft) => {
          const todo = draft.todos.find((item) => item.id === id);
          if (!todo || todo.done) return draft;
          todo.done = true;
          todo.completedAt = new Date().toISOString();
          return draft;
        }, 'todo:complete');
        addXp(store, 12, 'To-do');
        toast('+12 EXP. Der Dämon des Aufschiebens hasst diesen Trick.');
      });
    });

    root.querySelectorAll('[data-delete-todo]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteTodo;
        store.setState((draft) => {
          draft.todos = draft.todos.filter((item) => item.id !== id);
          return draft;
        }, 'todo:delete');
      });
    });
  }

  subscribePanel(store, render, ['todo:']);
}

export function bindDailyPanel(store, root, toast) {
  function render(state) {
    root.innerHTML = `
      <article class="form-card">
        <h2>Tägliche To-dos</h2>
        <p>Diese Aufgaben kommen jeden Tag wieder. Sanft, nicht sadistisch.</p>
        <form id="daily-form" class="form-row">
          <input name="text" placeholder="z.B. Medikament nehmen" required />
          <button class="primary-button" type="submit">+</button>
        </form>
      </article>
      <div class="list">
        ${state.dailyTodos.map((todo) => dailyTemplate(todo)).join('') || emptyTemplate('Noch keine täglichen Aufgaben.')}
      </div>
    `;

    root.querySelector('#daily-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      store.setState((draft) => {
        draft.dailyTodos.unshift({
          id: crypto.randomUUID(),
          text: data.get('text').toString().trim(),
          completedDate: null,
          createdAt: new Date().toISOString()
        });
        return draft;
      }, 'daily:add');
    });

    root.querySelectorAll('[data-complete-daily]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.completeDaily;
        const today = new Date().toISOString().slice(0, 10);
        store.setState((draft) => {
          const todo = draft.dailyTodos.find((item) => item.id === id);
          if (!todo || todo.completedDate === today) return draft;
          todo.completedDate = today;
          return draft;
        }, 'daily:complete');
        addXp(store, 8, 'Täglich');
        toast('+8 EXP für dein Tagesritual.');
      });
    });

    root.querySelectorAll('[data-delete-daily]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteDaily;
        store.setState((draft) => {
          draft.dailyTodos = draft.dailyTodos.filter((item) => item.id !== id);
          return draft;
        }, 'daily:delete');
      });
    });
  }

  subscribePanel(store, render, ['daily:']);
}

export function bindGratitudePanel(store, root, toast) {
  function render(state) {
    root.innerHTML = `
      <article class="form-card">
        <h2>Dankbarkeit & Notizen</h2>
        <p>Kein toxisches Positivdenken. Nur ein kleiner Fund im Nebel.</p>
        <form id="gratitude-form">
          <textarea name="text" placeholder="Heute war nicht alles gut, aber…" required></textarea>
          <label class="meta" for="gratitude-photo">Optionales Standortfoto</label>
          <input id="gratitude-photo" name="photo" type="file" accept="image/*" />
          <span class="meta">Fotos werden lokal im Browser gespeichert und für die Karte verkleinert.</span>
          <div class="form-row"><button class="primary-button" type="submit">Notiz speichern</button></div>
        </form>
      </article>
      <div class="list">
        ${state.gratitudeNotes.map((note) => gratitudeTemplate(note)).join('') || emptyTemplate('Noch keine Notizen.')}
      </div>
    `;

    root.querySelector('#gratitude-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const photoFile = data.get('photo');
      const location = store.getState().player.lastKnownLocation;
      const photos = photoFile instanceof File && photoFile.size > 0 ? [await createPhotoAttachment(photoFile, location)] : [];
      store.setState((draft) => {
        draft.gratitudeNotes.unshift({
          id: crypto.randomUUID(),
          text: data.get('text').toString().trim(),
          location,
          photos,
          photoDataUrl: photos[0]?.dataUrl ?? '',
          createdAt: new Date().toISOString()
        });
        return draft;
      }, 'gratitude:add');
      addXp(store, 7, 'Dankbarkeit');
      toast('+7 EXP für eine Notiz. Sehr kleine Laterne, sehr nützlich.');
    });

    root.querySelectorAll('[data-delete-note]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteNote;
        store.setState((draft) => {
          draft.gratitudeNotes = draft.gratitudeNotes.filter((item) => item.id !== id);
          return draft;
        }, 'gratitude:delete');
      });
    });

    root.querySelectorAll('[data-add-note-photo]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const location = store.getState().player.lastKnownLocation;
        const photo = await createPhotoAttachment(file, location);
        store.setState((draft) => {
          const note = draft.gratitudeNotes.find((item) => item.id === input.dataset.addNotePhoto);
          if (!note) return draft;
          note.photos = normalizeNotePhotos(note);
          note.photos.push(photo);
          note.photoDataUrl = note.photos[0]?.dataUrl ?? '';
          return draft;
        }, 'gratitude:photo:add');
        toast('Foto zur Notiz hinzugefügt.');
      });
    });
  }

  subscribePanel(store, render, ['gratitude:']);
}

export function bindCollectionPanel(store, root) {
  function render(state) {
    const cards = state.collection
      .map((id) => DEMONS.find((demon) => demon.id === id))
      .filter(Boolean);

    root.innerHTML = `
      <article class="card">
        <h2>Gebundene Dämonen</h2>
        <p>${cards.length} von ${DEMONS.length} Dämonen gebunden.</p>
      </article>
      <div class="demon-card-grid">
        ${cards.map(collectionCardTemplate).join('') || emptyTemplate('Noch keine Dämonen gebunden. Zeit für einen kleinen Ritualpfad.')}
      </div>
    `;
  }

  subscribePanel(store, render, ['encounter:bind']);
}

export function bindDefensePanel(store, root, toast) {
  function render(state) {
    const summary = getDefenseSummary(state);
    const boundDemons = state.collection
      .map((id) => DEMONS.find((demon) => demon.id === id))
      .filter(Boolean);
    const towerOptions = [
      {
        id: 'home-sigil',
        name: 'Home-Siegel',
        title: 'Grundschutz des Kreises',
        rarity: 'common',
        biome: 'home',
        art: '◆',
        artworkUrl: '',
        role: 'Kern',
        power: 24
      },
      ...boundDemons
    ];
    const selected = new Set(state.defense?.selectedTowerIds ?? []);
    const history = state.defense?.history ?? [];

    root.innerHTML = `
      <article class="form-card">
        <h2>Home-Verteidigung</h2>
        <p>Setze gebundene Dämonen als Türme ein und verteidige abends dein Home-Sigil gegen eine Welle.</p>
        <div class="badges">
          <span class="badge">Sigil: ${summary.sigilHealth}/100</span>
          <span class="badge">Heute: ${summary.dailyRunDone ? 'abgeschlossen' : 'bereit'}</span>
          <span class="badge">Siege: ${summary.wins}</span>
        </div>
        <div class="tower-grid">
          ${towerOptions.map((demon) => towerCardTemplate(demon, selected.has(demon.id))).join('')}
        </div>
        <div class="form-row wrap">
          <button id="run-defense-button" class="primary-button" ${summary.dailyRunDone ? 'disabled' : ''}>Tageswelle starten</button>
        </div>
      </article>
      <article class="card">
        <h2>Letzte Wellen</h2>
        <div class="list">
          ${history.slice(0, 5).map(defenseHistoryTemplate).join('') || emptyTemplate('Noch keine Verteidigung gespielt.')}
        </div>
      </article>
    `;

    root.querySelectorAll('[data-toggle-tower]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.toggleTower;
        store.setState((draft) => {
          draft.defense.selectedTowerIds ??= [];
          if (draft.defense.selectedTowerIds.includes(id)) {
            draft.defense.selectedTowerIds = draft.defense.selectedTowerIds.filter((item) => item !== id);
          } else {
            draft.defense.selectedTowerIds.push(id);
          }
          return draft;
        }, 'defense:tower-toggle');
      });
    });

    root.querySelector('#run-defense-button')?.addEventListener('click', () => {
      const result = runDefense(store);
      toast(result.message, result.ok ? (result.victory ? 'ok' : 'error') : 'error');
    });
  }

  subscribePanel(store, render, ['defense:', 'encounter:bind']);
}

export function bindHealthPanel(store, root, healthService, toast) {
  async function render(state) {
    const status = await healthService.getStatus();
    root.innerHTML = `
      <article class="form-card">
        <h2>Health-Quelle</h2>
        <p>Für den Web-MVP ist Mock Health aktiv. Fitbit hat einen Browser-Prototyp. Apple HealthKit braucht später eine native iOS-Bridge.</p>
        <label class="meta" for="health-provider">Quelle</label>
        <select id="health-provider">
          <option value="mock" ${state.settings.healthProvider === 'mock' ? 'selected' : ''}>Mock Health / Demo</option>
          <option value="fitbit" ${state.settings.healthProvider === 'fitbit' ? 'selected' : ''}>Fitbit Web API Prototype</option>
          <option value="apple" ${state.settings.healthProvider === 'apple' ? 'selected' : ''}>Apple HealthKit Placeholder</option>
        </select>

        <div id="fitbit-settings" style="display:${state.settings.healthProvider === 'fitbit' ? 'block' : 'none'}; margin-top: 12px;">
          <label class="meta" for="fitbit-client-id">Fitbit Client ID</label>
          <input id="fitbit-client-id" value="${escapeHtml(state.settings.fitbitClientId ?? '')}" placeholder="Fitbit Client ID" />
          <span class="meta">Für Produktivbetrieb bitte Authorization Code + PKCE und Backend/Token Storage nutzen.</span>
        </div>

        <div class="badges">
          <span class="badge">${status.label}</span>
          <span class="badge">${status.connected ? 'verbunden' : 'nicht verbunden'}</span>
        </div>

        <div class="form-row wrap">
          <button id="connect-health" class="primary-button">Verbinden</button>
          <button id="sync-health" class="ghost-button">Heute synchronisieren</button>
        </div>
        <p class="meta">Letzter Sync: ${state.player.lastHealthSyncDate ? new Date(state.player.lastHealthSyncDate).toLocaleString('de-DE') : 'nie'}</p>
      </article>
      <article class="card">
        <h2>Manuelle Schritte</h2>
        <p>Gut für Tests auf Desktop oder wenn du noch keine echte Health-Integration willst.</p>
        <div class="form-row">
          <input id="manual-steps" type="number" min="0" step="100" placeholder="z.B. 1200" />
          <button id="add-manual-steps" class="primary-button">Addieren</button>
        </div>
      </article>
    `;

    root.querySelector('#health-provider')?.addEventListener('change', (event) => {
      healthService.setProvider(event.target.value);
      toast(`Health-Quelle: ${event.target.value}`);
    });

    root.querySelector('#fitbit-client-id')?.addEventListener('input', (event) => {
      store.setState((draft) => {
        draft.settings.fitbitClientId = event.target.value.trim();
        return draft;
      }, 'health:fitbit-client-id');
    });

    root.querySelector('#connect-health')?.addEventListener('click', async () => {
      const result = await healthService.connect();
      toast(result.message, result.ok ? 'ok' : 'error');
    });

    root.querySelector('#sync-health')?.addEventListener('click', async () => {
      const result = await healthService.syncToday();
      toast(result.message, result.ok ? 'ok' : 'error');
    });

    root.querySelector('#add-manual-steps')?.addEventListener('click', () => {
      const input = root.querySelector('#manual-steps');
      const amount = Number(input.value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      store.setState((draft) => {
        draft.player.stepsToday += amount;
        const xpGain = Math.min(30, Math.floor(amount / 200));
        draft.player.xp += xpGain;
        draft.player.totalXpEarned += xpGain;
        return draft;
      }, 'health:manual-steps');
      toast(`+${amount} Schritte eingetragen.`);
      input.value = '';
    });
  }

  subscribePanel(store, render, ['health:']);
}

function habitTemplate(habit) {
  const today = new Date().toISOString().slice(0, 10);
  const done = habit.completedDate === today;
  return `
    <div class="list-item ${done ? 'done' : ''}">
      <div>
        <strong>${escapeHtml(habit.name)}</strong>
        <span class="meta">${habit.type === 'positive' ? 'positiv' : 'negativ widerstanden'} · Streak ${habit.streak}</span>
      </div>
      <div class="form-row">
        <button class="small-button" data-complete-habit="${habit.id}" ${done ? 'disabled' : ''}>Heute</button>
        <button class="small-button danger-button" data-delete-habit="${habit.id}">×</button>
      </div>
    </div>
  `;
}

function todoTemplate(todo) {
  return `
    <div class="list-item ${todo.done ? 'done' : ''}">
      <div><strong>${escapeHtml(todo.text)}</strong><span class="meta">${todo.done ? 'erledigt' : 'offen'}</span></div>
      <div class="form-row">
        <button class="small-button" data-complete-todo="${todo.id}" ${todo.done ? 'disabled' : ''}>✓</button>
        <button class="small-button danger-button" data-delete-todo="${todo.id}">×</button>
      </div>
    </div>
  `;
}

function dailyTemplate(todo) {
  const today = new Date().toISOString().slice(0, 10);
  const done = todo.completedDate === today;
  return `
    <div class="list-item ${done ? 'done' : ''}">
      <div><strong>${escapeHtml(todo.text)}</strong><span class="meta">${done ? 'heute erledigt' : 'heute offen'}</span></div>
      <div class="form-row">
        <button class="small-button" data-complete-daily="${todo.id}" ${done ? 'disabled' : ''}>Heute</button>
        <button class="small-button danger-button" data-delete-daily="${todo.id}">×</button>
      </div>
    </div>
  `;
}

function gratitudeTemplate(note) {
  const photos = normalizeNotePhotos(note);
  return `
    <div class="list-item">
      <div>
        <strong>${new Date(note.createdAt).toLocaleDateString('de-DE')}</strong>
        <span class="meta">${escapeHtml(note.text)}</span>
        ${note.location ? `<span class="meta">Ort: ${note.location.lat.toFixed(4)}, ${note.location.lng.toFixed(4)}</span>` : ''}
        ${photos.length ? `<div class="note-photo-grid">${photos.map((photo) => `<img class="note-photo" src="${photo.dataUrl}" alt="Standortfoto zur Notiz" loading="lazy" />`).join('')}</div>` : ''}
        <label class="small-button note-photo-input">
          Foto hinzufügen
          <input type="file" accept="image/*" data-add-note-photo="${note.id}" hidden />
        </label>
      </div>
      <button class="small-button danger-button" data-delete-note="${note.id}">×</button>
    </div>
  `;
}

function towerCardTemplate(demon, selected) {
  const stats = getTowerStats(demon);
  return `
    <button class="tower-option ${selected ? 'is-selected' : ''}" data-toggle-tower="${demon.id}">
      ${demonArtTemplate(demon)}
      <strong>${escapeHtml(demon.name)}</strong>
      <span class="meta">${stats.role} · Stärke ${stats.power}</span>
      <span class="meta">${RARITY_LABELS[demon.rarity] ?? demon.rarity}</span>
    </button>
  `;
}

function defenseHistoryTemplate(entry) {
  return `
    <div class="list-item">
      <div>
        <strong>${entry.success ? 'Sieg' : 'Durchbruch'} · ${escapeHtml(entry.wave.name)}</strong>
        <span class="meta">Turmstärke ${entry.defensePower} gegen Bedrohung ${entry.wave.threat} · +${entry.xpReward} EXP</span>
      </div>
      <span class="badge">${entry.success ? 'gehalten' : `${entry.damage} Schaden`}</span>
    </div>
  `;
}

function collectionCardTemplate(demon) {
  return `
    <article class="collection-card">
      ${demonArtTemplate(demon)}
      <h3>${demon.name}</h3>
      <p>${demon.title}</p>
      <div class="badges">
        <span class="badge">${RARITY_LABELS[demon.rarity]}</span>
        <span class="badge">${demon.biome}</span>
      </div>
      <span class="meta">${demon.flavor}</span>
    </article>
  `;
}

function demonArtTemplate(demon) {
  if (demon.artworkUrl) {
    return `<div class="demon-art"><img src="${escapeHtml(demon.artworkUrl)}" alt="${escapeHtml(demon.name)}" loading="lazy" /></div>`;
  }
  return `<div class="demon-art">${demon.art}</div>`;
}

function emptyTemplate(message) {
  return `<div class="empty-card"><p>${escapeHtml(message)}</p></div>`;
}

function subscribePanel(store, render, actionPrefixes) {
  store.subscribe((state, action) => {
    if (!action || action === 'state:reset' || actionPrefixes.some((prefix) => action.startsWith(prefix))) {
      render(state, action);
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
