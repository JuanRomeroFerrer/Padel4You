const { useState } = React;
const { Icon, ImgPlaceholder, Btn, Breadcrumbs } = window;

function AboutPage({ setPage }) {

  // ── Hero ──
  function AboutHero() {
    return (
      <div style={{ background: 'var(--navy)', padding: 'clamp(80px,12vw,140px) clamp(20px,4vw,40px) clamp(48px,6vw,80px)', position: 'relative', overflow: 'hidden' }}>
        {/* Photo background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("uploads/padel.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, oklch(8% 0.05 258 / 0.88) 0%, oklch(12% 0.06 258 / 0.75) 60%, oklch(8% 0.05 258 / 0.86) 100%)' }} />
        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to top, oklch(8% 0.05 258 / 0.55), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Inicio', page: 'home' }, { label: 'Sobre Nosotros' }]} setPage={setPage} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(36px,6vw,72px)', color: 'white', letterSpacing: '-0.04em', marginTop: '24px', marginBottom: '16px', textWrap: 'balance' }}>
            El club que<br /><span style={{ color: 'var(--green-bright)' }}>lo cambia todo</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'oklch(78% 0.02 258)', maxWidth: '520px', lineHeight: 1.7 }}>
            Fundado en 2018 con la misión de hacer el pádel accesible, apasionante y de primera calidad para todos.
          </p>
        </div>
      </div>
    );
  }

  // ── Mission / Vision / Values ──
  function MissionSection() {
    const blocks = [
      { icon: 'zap', title: 'Misión', color: 'var(--green)', desc: 'Democratizar el pádel ofreciendo instalaciones de élite, entrenamiento de calidad y una comunidad integradora donde cada jugador, independientemente de su nivel, pueda progresar y disfrutar.' },
      { icon: 'star', title: 'Visión', color: 'oklch(52% 0.18 230)', desc: 'Ser el club de referencia en Madrid, reconocido por la excelencia de sus instalaciones, la innovación en sus servicios y el impacto positivo en la comunidad deportiva local.' },
      { icon: 'shield', title: 'Valores', color: 'var(--amber)', desc: 'Pasión por el deporte, excelencia en el servicio, comunidad inclusiva, sostenibilidad ambiental y mejora continua. Estos principios guían cada decisión que tomamos en Padel4You.' },
    ];
    return (
      <section style={{ padding: 'clamp(60px,8vw,96px) clamp(20px,4vw,40px)', background: 'var(--white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
            {blocks.map((b, i) => (
              <div key={i} style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-lg)', padding: '36px 30px', border: '1px solid var(--gray-light)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <Icon name={b.icon} size={22} color={b.color} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: 'var(--navy)', marginBottom: '12px', letterSpacing: '-0.03em' }}>{b.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.75 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Gallery ──
  function Gallery() {
    const shots = [
      { label: 'Vista aérea · Pista 1', wide: true },
      { label: 'Zona de calentamiento', wide: false },
      { label: 'Vestuarios premium', wide: false },
      { label: 'Pista 2 · Noche', wide: false },
      { label: 'Recepción y tienda', wide: false },
      { label: 'Gimnasio equipado', wide: true },
    ];
    return (
      <section style={{ background: 'var(--off-white)', padding: 'clamp(60px,8vw,96px) clamp(20px,4vw,40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Instalaciones</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px,4vw,42px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '8px' }}>Nuestras instalaciones</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto', gap: '14px' }}>
            {shots.map((s, i) => (
              <ImgPlaceholder key={i} label={s.label} style={{
                borderRadius: 'var(--radius-md)',
                height: s.wide ? '260px' : '200px',
                gridColumn: s.wide ? 'span 2' : 'span 1',
              }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Schedule ──
  function Schedule() {
    const rows = [
      ['Lunes a Viernes', '9:00 – 14:00', '16:00 – 23:00', true],
      ['Sábado', '9:00 – 14:00', 'Cerrado', true],
    ];
    return (
      <section style={{ padding: 'clamp(60px,8vw,96px) clamp(20px,4vw,40px)', background: 'var(--white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '48px', alignItems: 'start' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Horarios</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '8px', marginBottom: '28px' }}>Cuándo estamos abiertos</h2>
            <div style={{ background: 'var(--off-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--gray-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--navy)', padding: '12px 20px' }}>
                {['Día', 'Mañana', 'Tarde'].map(h => (
                  <span key={h} style={{ fontSize: '12px', fontWeight: 700, color: 'oklch(70% 0.02 258)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>{h}</span>
                ))}
              </div>
              {rows.map(([day, am, pm, open], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < rows.length - 1 ? '1px solid var(--gray-light)' : 'none', background: !open ? 'var(--red-pale)' : 'transparent' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: open ? 'var(--navy)' : 'var(--red)', fontFamily: 'var(--font-heading)' }}>{day}</span>
                  <span style={{ fontSize: '14px', color: am === 'Cerrado' ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{am}</span>
                  <span style={{ fontSize: '14px', color: pm === 'Cerrado' ? 'var(--text-muted)' : 'var(--green)', fontWeight: 600 }}>{pm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Equipo</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '8px', marginBottom: '28px' }}>Nuestro equipo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { name: 'Justo', role: 'Director del Club', exp: '' },
                { name: 'José María Pereira', role: 'Director del Club', exp: '' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--off-white)', borderRadius: 'var(--radius-md)', padding: '14px 18px', border: '1px solid var(--gray-light)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'var(--green-bright)', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '16px' }}>{p.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>{p.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>{p.role}</div>
                    {p.exp && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.exp}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Location ──
  function Location() {
    return (
      <section style={{ background: 'var(--off-white)', padding: 'clamp(60px,8vw,96px) clamp(20px,4vw,40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Ubicación</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px,4vw,42px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '8px' }}>Cómo llegar</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '28px', alignItems: 'start' }}>
            {/* Map */}
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-light)', gridColumn: 'span 2' }}>
              <iframe
                title="Ubicación Padel4You"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-5.8645%2C38.9520%2C-5.8405%2C38.9680&layer=mapnik&marker=38.959952%2C-5.852526"
                style={{ width: '100%', height: '380px', border: 'none', display: 'block' }}
                loading="lazy"
              />
            </div>

            {/* Contact details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: 'map-pin', title: 'Dirección', lines: ['Avenida de Córdoba, 13', '06400 Don Benito', 'Extremadura'] },
                { icon: 'phone', title: 'Teléfono', lines: ['+34 924 80 61 35'] },
                { icon: 'mail', title: 'Email', lines: ['hola@padel4you.es', 'reservas@padel4you.es'] },
                { icon: 'clock', title: 'Horario general', lines: ['Lun–Vie: 9:00–23:00', 'Sábado: 9:00–14:00'] },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', background: 'white', borderRadius: 'var(--radius-md)', padding: '18px 20px', border: '1px solid var(--gray-light)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={item.icon} size={18} color="var(--green)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>{item.title}</div>
                    {item.lines.map((l, li) => <div key={li} style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{l}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="page-anim" style={{ paddingTop: '66px' }}>
      <AboutHero />
      <MissionSection />
      <Gallery />
      <Schedule />
      <Location />
    </div>
  );
}

window.AboutPage = AboutPage;
