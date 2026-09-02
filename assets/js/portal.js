import { projectCard } from './project-card.js';

const grid = document.querySelector('#project-grid');

try {
  const response = await fetch('./data/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Catalogo non disponibile');
  const projects = await response.json();
  grid.innerHTML = projects.map(projectCard).join('');
} catch (error) {
  grid.innerHTML = `<div class="loading-card">I progetti non sono disponibili in questo momento. Riprova tra poco.</div>`;
}
