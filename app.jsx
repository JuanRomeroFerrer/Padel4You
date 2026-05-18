const { useState, useEffect } = React;
const { Nav, Footer, Toast } = window;
const { TweaksPanel, TweakSection, TweakSlider, TweakColor, TweakSelect, TweakButton, useTweaks } = window;
const { HomePage, ReservationsPage, AboutPage, AccountPage } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#2e7d4f",
  "featuredPlan": "trimestral",
  "cardRadius": 20
}/*EDITMODE-END*/;

const MOCK_RESERVATIONS = [
  { id: 'R001', court: 'Pista 1', courtId: 1, date: '2026-05-28', time: '18:00 – 19:30', status: 'confirmed', price: 20 },
  { id: 'R002', court: 'Pista 3', courtId: 3, date: '2026-06-03', time: '10:30 – 12:00', status: 'confirmed', price: 20 },
  { id: 'R003', court: 'Pista 2', courtId: 2, date: '2026-04-18', time: '19:00 – 20:30', status: 'completed', price: 20 },
  { id: 'R004', court: 'Pista 1', courtId: 1, date: '2026-03-10', time: '09:00 – 10:30', status: 'completed', price: 20 },
  { id: 'R005', court: 'Pista 2', courtId: 2, date: '2026-02-05', time: '17:30 – 19:00', status: 'cancelled', price: 20 },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ── Routing ──
  const [page, setPage] = useState(() => {
    try { return localStorage.getItem('p4y_page') || 'home'; } catch { return 'home'; }
  });

  // ── Auth ──
  const [user, setUserRaw] = useState(() => {
    try { const u = localStorage.getItem('p4y_user'); return u ? JSON.parse(u) : null; } catch { return null; }
  });

  // ── Reservations ──
  const [reservations, setReservations] = useState(() => {
    try {
      const r = localStorage.getItem('p4y_reservations');
      return r ? JSON.parse(r) : MOCK_RESERVATIONS;
    } catch { return MOCK_RESERVATIONS; }
  });

  // ── Notifications ──
  const [notification, setNotification] = useState(null);

  // Persist state
  useEffect(() => {
    try { localStorage.setItem('p4y_page', page); } catch {}
  }, [page]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('p4y_user', JSON.stringify(user));
      else localStorage.removeItem('p4y_user');
    } catch {}
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem('p4y_reservations', JSON.stringify(reservations)); } catch {}
  }, [reservations]);

  // Scroll to top on page change
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function setUser(u) {
    setUserRaw(u);
    if (u) {
      setReservations(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const toAdd = MOCK_RESERVATIONS.filter(r => !existingIds.has(r.id));
        return toAdd.length ? [...toAdd, ...prev] : prev;
      });
    }
  }

  function addReservation(res) {
    setReservations(prev => [res, ...prev]);
  }

  function cancelReservation(id) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  }

  function showNotification(n) { setNotification(n); }
  function dismissNotification() { setNotification(null); }

  // Apply tweaks as CSS overrides
  const radius = Number(tweaks.cardRadius) || 20;
  const accent = tweaks.accentColor || '#2e7d4f';

  const pageProps = { setPage, user, setUser, reservations, addReservation, cancelReservation, showNotification, tweaks };

  const pageEl = (() => {
    switch (page) {
      case 'home':         return <HomePage {...pageProps} />;
      case 'reservations': return <ReservationsPage {...pageProps} />;
      case 'about':        return <AboutPage {...pageProps} />;
      case 'account':      return <AccountPage {...pageProps} />;
      default:             return <HomePage {...pageProps} />;
    }
  })();

  return (
    <>
      <style>{`
        :root {
          --green: ${accent};
          --green-mid: color-mix(in oklch, ${accent} 80%, white 20%);
          --green-bright: color-mix(in oklch, ${accent} 70%, white 30%);
          --green-pale: color-mix(in oklch, ${accent} 12%, white 88%);
          --radius-lg: ${radius}px;
          --radius-md: ${Math.max(4, radius - 6)}px;
          --radius-sm: ${Math.max(2, radius - 12)}px;
        }
      `}</style>

      <Nav page={page} setPage={setPage} user={user} />

      <main key={page} className="page-anim">
        {pageEl}
      </main>

      {page !== 'account' && <Footer setPage={setPage} />}

      <Toast notification={notification} onDismiss={dismissNotification} />

      <TweaksPanel>
        <TweakSection label="Apariencia">
          <TweakColor
            label="Color de acento"
            value={accent}
            options={['#2e7d4f', '#1a5ea8', '#b02626', '#7b4fa6']}
            onChange={v => setTweak('accentColor', v)}
          />
          <TweakSlider
            label="Radio tarjetas"
            value={radius}
            min={0} max={32} step={4} unit="px"
            onChange={v => setTweak('cardRadius', v)}
          />
        </TweakSection>
        <TweakSection label="Página de inicio">
          <TweakSelect
            label="Plan destacado"
            value={tweaks.featuredPlan}
            options={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'trimestral', label: 'Trimestral' },
              { value: 'anual', label: 'Anual' },
            ]}
            onChange={v => setTweak('featuredPlan', v)}
          />
        </TweakSection>
        <TweakSection label="Demo rápida">
          <TweakButton
            label={user ? `Cerrar sesión (${user.name?.split(' ')[0]})` : 'Simular login como Carlos'}
            onClick={() => {
              if (user) {
                setUserRaw(null);
                showNotification({ type: 'info', title: 'Sesión cerrada', message: '¡Hasta pronto!' });
              } else {
                const u = {
                  name: 'Carlos Martínez', email: 'carlos@padel4you.es',
                  phone: '+34 612 345 678', joinDate: '2024-01-15',
                  subscription: { plan: 'Elite Anual', price: 249, billingCycle: 'año', renewalDate: '2027-01-15' },
                };
                setUser(u);
                showNotification({ type: 'success', title: '¡Bienvenido!', message: 'Sesión iniciada como Carlos' });
              }
            }}
          />
          <TweakButton
            label="Ir a Reservas"
            secondary
            onClick={() => setPage('reservations')}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
