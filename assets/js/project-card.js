export function projectCard(project, index) {
  const date = project.updated ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(project.updated)) : 'Dati disponibili';
  return `<article class="project-card" data-accent="${project.accent}">
    <div class="card-top">
      <span class="project-index">PROGETTO ${String(index + 1).padStart(2, '0')}</span>
      <span class="status">● ${project.status}</span>
    </div>
    <h2>${project.title}</h2>
    <p>${project.description}</p>
    <div class="project-meta">
      <div><small>Sorgente dati</small><strong>${project.source}</strong><small style="margin-top:12px">Ultimo snapshot</small><strong>${date}</strong></div>
      <a class="open-project" href="${project.href}" aria-label="Apri ${project.title}">Apri progetto <span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
}
