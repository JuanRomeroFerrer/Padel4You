const { useState } = React;
const { Icon, ImgPlaceholder, Btn, Badge } = window;

function HomePage({ setPage, showNotification, tweaks }) {
  const accentColor = tweaks?.accentColor || 'var(--green)';

  // ── Hero ──
  function Hero() {
    return (
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: 'var(--navy)',
        display: 'flex', alignItems: 'center'
      }}>

        {/* Photo background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("uploads/padel.jpg")',
          backgroundSize: 'cover', backgroundPosition: 'center'
        }} />
        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, oklch(8% 0.05 258 / 0.90) 0%, oklch(12% 0.06 258 / 0.78) 60%, oklch(8% 0.05 258 / 0.86) 100%)'
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
          background: 'linear-gradient(to top, oklch(8% 0.05 258 / 0.65), transparent)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: 'clamp(100px,14vw,160px) clamp(20px,4vw,40px) 80px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px', animation: 'fadeUp 0.5s 0.1s ease both' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-bright)', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--green-bright)', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CLUB DE PÁDEL — DON BENITO (EXTREMADURA)

            </span>
          </div>

          <h1 className="hero-title" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900, lineHeight: 1.05,
            fontSize: 'clamp(48px,7vw,90px)', color: 'white', letterSpacing: '-0.04em',
            marginBottom: '28px', maxWidth: '720px', textWrap: 'balance',
            animation: 'fadeUp 0.55s 0.18s ease both'
          }}>
            Padel<span style={{ color: 'var(--green-bright)' }}>4</span>You
          </h1>

          <p style={{
            fontSize: 'clamp(16px,2vw,20px)', color: 'oklch(80% 0.02 258)', lineHeight: 1.7,
            maxWidth: '520px', marginBottom: '44px', fontFamily: 'var(--font-body)',
            animation: 'fadeUp 0.55s 0.26s ease both'
          }}>
            Tres pistas de cristal homologadas, gimnasio equipado y una comunidad apasionada. Reserva en segundos, juega al instante.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'fadeUp 0.55s 0.34s ease both' }}>
            <Btn variant="primary" size="xl" onClick={() => setPage('reservations')}>
              <Icon name="calendar" size={18} /> Reservar Pista
            </Btn>
            <button onClick={() => document.getElementById('suscripciones')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'oklch(100% 0 0 / 0.10)', border: '1.5px solid oklch(100% 0 0 / 0.20)',
              color: 'white', padding: '18px 28px', borderRadius: '14px', fontSize: '17px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'oklch(100% 0 0 / 0.16)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'oklch(100% 0 0 / 0.10)'}>
              
              Ver planes <Icon name="arrow-right" size={17} />
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '0', flexWrap: 'wrap', marginTop: '72px',
            borderTop: '1px solid oklch(100% 0 0 / 0.10)', paddingTop: '36px',
            animation: 'fadeUp 0.55s 0.42s ease both'
          }}>
            {[['3', 'Pistas cubiertas'], ['8', 'Años de historia']].map(([n, l], i) =>
            <div key={i} style={{ flex: '1 1 120px', padding: '0 28px 0 0', minWidth: '100px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '13px', color: 'oklch(65% 0.02 258)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>{l}</div>
              </div>
            )}
          </div>
        </div>
      </section>);

  }

  // ── Features ──
  function Features() {
    const items = [
    { icon: 'zap', title: 'Reserva al instante', desc: 'Elige pista, fecha y hora en menos de un minuto. Disponibilidad en tiempo real.' },
    { icon: 'shield', title: 'Pistas homologadas', desc: 'Tres pistas de cristal panorámico con iluminación LED profesional y suelo de césped artificial premium.' },
    { icon: 'users', title: 'Comunidad activa', desc: 'Torneos mensuales, clases grupales y ligas internas para todos los niveles.' },
    { icon: 'award', title: 'Entrenadores titulados', desc: 'Equipo de profesores federados con programas personalizados para principiantes y avanzados.' }];

    return (
      <section style={{ background: 'var(--off-white)', padding: 'clamp(64px,8vw,100px) clamp(20px,4vw,40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Por qué elegirnos</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '10px', textWrap: 'balance' }}>
              Todo lo que necesitas en un club
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px' }}>
            {items.map((item, i) =>
            <div key={i} style={{
              background: 'white', borderRadius: 'var(--radius-lg)', padding: '32px 28px',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.22s ease',
              border: '1px solid var(--gray-light)'
            }}
            onMouseOver={(e) => {e.currentTarget.style.boxShadow = 'var(--shadow-lg)';e.currentTarget.style.transform = 'translateY(-3px)';}}
            onMouseOut={(e) => {e.currentTarget.style.boxShadow = 'var(--shadow-sm)';e.currentTarget.style.transform = '';}}>
              
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon name={item.icon} size={22} color="var(--green)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--navy)', marginBottom: '10px', letterSpacing: '-0.02em' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>);

  }

  // ── Subscriptions ──
  function Subscriptions() {
    const [featured, setFeatured] = useState(tweaks?.featuredPlan || 'trimestral');
    const plans = [
    {
      id: 'mensual', name: 'Mensual', price: 29, unit: 'mes',
      desc: 'Perfecto para empezar',
      perks: ['Acceso al gimnasio', 'Reservas estándar', 'Vestuarios básicos', 'App móvil'],
      badge: null
    },
    {
      id: 'trimestral', name: 'Trimestral', price: 75, unit: 'trimestre', priceMonth: 25,
      desc: 'El más popular del club',
      perks: ['Todo lo del plan Mensual', 'Reservas prioritarias', 'Descuento 10% en clases', 'Vestuarios premium', '1 invitado/mes gratis'],
      badge: 'Más popular'
    },
    {
      id: 'anual', name: 'Anual', price: 249, unit: 'año', priceMonth: 20.75,
      desc: 'Máximo ahorro y beneficios',
      perks: ['Todo lo del plan Trimestral', 'Descuento 20% en clases', '2 invitados/mes gratis', 'Análisis de juego', 'Acceso a torneos VIP'],
      badge: 'Mejor valor'
    }];

    return (
      <section id="suscripciones" style={{ padding: 'clamp(64px,8vw,100px) clamp(20px,4vw,40px)', background: 'var(--white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>Suscripciones</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-0.03em', color: 'var(--navy)', marginTop: '10px' }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '12px', maxWidth: '480px', margin: '12px auto 0' }}>
              Sin permanencia. Cancela cuando quieras.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', alignItems: 'start' }}>
            {plans.map((plan) => {
              const isFeatured = plan.id === featured;
              return (
                <div key={plan.id} style={{
                  background: isFeatured ? 'var(--navy)' : 'white',
                  border: isFeatured ? 'none' : '1.5px solid var(--gray-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '36px 30px',
                  position: 'relative',
                  transform: isFeatured ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isFeatured ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                  transition: 'all 0.25s ease'
                }}>
                  {plan.badge &&
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--green)', color: 'white', padding: '4px 16px',
                    borderRadius: '99px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-heading)',
                    whiteSpace: 'nowrap'
                  }}>{plan.badge}</div>
                  }
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isFeatured ? 'var(--green-bright)' : 'var(--green)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(36px,5vw,52px)', color: isFeatured ? 'white' : 'var(--navy)', letterSpacing: '-0.04em', lineHeight: 1 }}>€{plan.price}</span>
                    <span style={{ fontSize: '15px', color: isFeatured ? 'oklch(70% 0.02 258)' : 'var(--text-muted)', marginBottom: '6px' }}>/{plan.unit}</span>
                  </div>
                  {plan.priceMonth &&
                  <p style={{ fontSize: '13px', color: isFeatured ? 'var(--green-bright)' : 'var(--green)', marginBottom: '4px', fontWeight: 600 }}>≈ €{plan.priceMonth}/mes</p>
                  }
                  <p style={{ fontSize: '14px', color: isFeatured ? 'oklch(72% 0.02 258)' : 'var(--text-muted)', marginBottom: '28px' }}>{plan.desc}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    {plan.perks.map((perk, pi) =>
                    <div key={pi} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: isFeatured ? 'oklch(85% 0.015 258)' : 'var(--text)' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: isFeatured ? 'oklch(100% 0 0 / 0.1)' : 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Icon name="check" size={11} color={isFeatured ? 'var(--green-bright)' : 'var(--green)'} />
                        </div>
                        {perk}
                      </div>
                    )}
                  </div>

                  <Btn variant={isFeatured ? 'primary' : 'outline'} size="lg" fullWidth
                  onClick={() => showNotification({ type: 'info', title: `Plan ${plan.name} seleccionado`, message: 'Inicia sesión para completar la suscripción.' })}>
                    Suscribirse
                  </Btn>
                </div>);

            })}
          </div>
        </div>
      </section>);

  }

  // ── CTA Reservar ──
  function CTAReservar() {
    return (
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)',
        padding: 'clamp(64px,8vw,96px) clamp(20px,4vw,40px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, var(--green) 0%, transparent 60%)', opacity: 0.07 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(30px,5vw,52px)', color: 'white', letterSpacing: '-0.04em', marginBottom: '16px', textWrap: 'balance' }}>
            ¿Listo para jugar?
          </h2>
          <p style={{ fontSize: '17px', color: 'oklch(78% 0.02 258)', marginBottom: '40px', lineHeight: 1.65 }}>
            Consulta la disponibilidad en tiempo real y reserva tu pista favorita en segundos.
          </p>
          <Btn variant="primary" size="xl" onClick={() => setPage('reservations')}>
            <Icon name="calendar" size={20} /> RESERVAR PISTA
          </Btn>
        </div>
      </section>);

  }

  return (
    <div className="page-anim">
      <Hero />
      <Features />
      <Subscriptions />
      <CTAReservar />
    </div>);

}

window.HomePage = HomePage;