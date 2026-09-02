import projects from '../data/projects.json';

function ProjectCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
  const date = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(project.updated));
  return (
    <article className="project-card" data-accent={project.accent}>
      <div className="card-top">
        <span className="project-index">PROGETTO {String(index + 1).padStart(2, '0')}</span>
        <span className="status">● {project.status}</span>
      </div>
      <h2>{project.title}</h2>
      <p>{project.description}</p>
      <div className="project-meta">
        <div>
          <small>Sorgente dati</small><strong>{project.source}</strong>
          <small style={{ marginTop: 12 }}>Ultimo snapshot</small><strong>{date}</strong>
        </div>
        <a className="open-project" href={project.href} aria-label={`Apri ${project.title}`}>Apri progetto <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="ARTEMIA, portale progetti">
          <span className="brand-mark">A</span>
          <span><strong>ARTEMIA</strong><small>PROJECT CONTROL</small></span>
        </a>
        <div className="top-meta"><span className="live-dot" /> Dati collegati</div>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <div><p className="eyebrow">PORTALE OPERATIVO</p><h1 id="page-title">Ogni progetto.<br /><em>Un solo punto di accesso.</em></h1></div>
          <p className="intro-copy">Dashboard, documenti e dati economici organizzati per progetto. I valori operativi restano modificabili nei Google Sheet e arrivano alle viste pubblicate attraverso snapshot JSON versionati.</p>
        </section>
        <section className="project-grid" aria-label="Progetti ARTEMIA">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</section>
        <section className="flow" aria-labelledby="flow-title">
          <div className="flow-copy"><p className="eyebrow">FLUSSO DATI</p><h2 id="flow-title">Modifica una volta,<br />pubblica ovunque.</h2></div>
          <ol className="flow-steps">
            <li><span>01</span><div><strong>Google Drive / Sheets</strong><small>Sorgente dati e documenti modificabile</small></div></li>
            <li><span>02</span><div><strong>Apps Script</strong><small>Validazione e sincronizzazione automatica</small></div></li>
            <li><span>03</span><div><strong>JSON versionato</strong><small>Snapshot stabile, verificabile e recuperabile</small></div></li>
            <li><span>04</span><div><strong>Siti ARTEMIA</strong><small>Viste veloci, separate e sempre aggiornabili</small></div></li>
          </ol>
        </section>
      </main>
      <footer><span>ARTEMIA Group</span><a href="/docs/GUIDA-AGGIORNAMENTI.md">Guida aggiornamenti</a></footer>
    </>
  );
}
