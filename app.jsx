const { useState, useEffect } = React;
const { Nav, Footer, Toast } = window;
const { TweaksPanel, TweakSection, TweakSlider, TweakColor, TweakSelect, TweakButton, useTweaks } = window;
const { HomePage, ReservationsPage, AboutPage, AccountPage } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#2e7d4f",
  "featuredPlan": "trimestral",
  "cardRadius": 20
}/*EDITMODE-END*/;

// Empty array - reservations will be fetched from API
const EMPTY_RESERVATIONS = [];

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
      return r ? JSON.parse(r) : EMPTY_RESERVATIONS;
    } catch { return EMPTY_RESERVATIONS; }
  });

  // ── API State ──
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── Notifications ──
  const [notification, setNotification] = useState(null);

  // ────── UTILITY FUNCTIONS ──────

  // Llamadas genéricas a API
  async function apiCall(method, endpoint, body) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      };

      if (body) options.body = JSON.stringify(body);

      const response = await fetch(`${window.API_URL}${endpoint}`, options);

      if (response.status === 401) {
        setUserRaw(null);
        localStorage.removeItem('p4y_user');
        showNotification({ type: 'error', title: 'Sesión expirada', message: 'Por favor inicia sesión nuevamente' });
        return null;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API error:', error);
      setApiError(error.message);
      throw error;
    }
  }

  // Login con API
  async function apiLogin(email, password) {
    try {
      setLoading(true);
      setApiError(null);
      const data = await apiCall('POST', '/auth/login', { email, password });

      if (data && data.user) {
        const userData = { ...data.user };
        setUserRaw(userData);
        localStorage.setItem('p4y_user', JSON.stringify(userData));
        setLoading(false);
        return true;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  // Logout con API
  async function apiLogout() {
    try {
      setLoading(true);
      await apiCall('POST', '/auth/logout', {});

      setUserRaw(null);
      setReservations(EMPTY_RESERVATIONS);
      localStorage.removeItem('p4y_user');
      showNotification({ type: 'success', title: 'Sesión cerrada', message: '¡Hasta pronto!' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Logout error:', error);
    }
  }

  // Registro con API
  async function apiRegister(name, email, phone, password) {
    try {
      setLoading(true);
      setApiError(null);
      const data = await apiCall('POST', '/auth/register', { name, email, phone, password });

      if (data && data.user) {
        const today = new Date().toISOString().slice(0, 10);
        const userData = { ...data.user, joinDate: today };
        setUserRaw(userData);
        localStorage.setItem('p4y_user', JSON.stringify(userData));
        setLoading(false);
        return true;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  // Obtener reservas del usuario
  async function fetchUserReservations() {
    if (!user) return;
    try {
      const data = await apiCall('GET', '/reservations', null);
      if (data && data.reservations) {
        setReservations(data.reservations);
        localStorage.setItem('p4y_reservations', JSON.stringify(data.reservations));
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }

  // ────── EFFECTS ──────

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

  // Cargar reservas del usuario al iniciar si está logueado
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const data = await fetch(`${window.API_URL}/reservations`, {
            credentials: 'include'
          }).then(r => r.json());
          if (data && data.reservations) {
            setReservations(data.reservations);
            localStorage.setItem('p4y_reservations', JSON.stringify(data.reservations));
          }
        } catch (error) {
          console.error('Error loading reservations:', error);
        }
      })();
    }
  }, [user]);

  // Scroll to top on page change
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function setUser(u) {
    setUserRaw(u);
  }

  function addReservation(res) {
    setReservations(prev => [res, ...prev]);
  }

  async function cancelReservation(id) {
    try {
      // Hacer DELETE al backend
      await apiCall('DELETE', `/reservations/${id}`, null);

      // Actualizar estado local
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      showNotification({ type: 'error', title: 'Error', message: error.message });
    }
  }

  function showNotification(n) { setNotification(n); }
  function dismissNotification() { setNotification(null); }

  // Apply tweaks as CSS overrides
  const radius = Number(tweaks.cardRadius) || 20;
  const accent = tweaks.accentColor || '#2e7d4f';

  const pageProps = {
    setPage, user, setUser, reservations, addReservation, cancelReservation,
    showNotification, tweaks, loading, setLoading,
    apiError, setApiError, apiCall, apiLogin, apiLogout, apiRegister,
    fetchUserReservations
  };

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
        <TweakSection label="Sesión">
          <TweakButton
            label={user ? `Cerrar sesión (${user.name?.split(' ')[0] || user.email})` : 'Ir a Login'}
            onClick={() => {
              if (user) {
                apiLogout();
              } else {
                setPage('account');
              }
            }}
          />
          {user && <TweakButton
            label="Ir a Reservas"
            secondary
            onClick={() => setPage('reservations')}
          />}
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
