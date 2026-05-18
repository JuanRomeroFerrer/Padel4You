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
  const [authToken, setAuthTokenRaw] = useState(() => {
    try { return localStorage.getItem('p4y_token') || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── Notifications ──
  const [notification, setNotification] = useState(null);

  // ────── UTILITY FUNCTIONS ──────

  // Decodificar JWT sin librería externa
  function decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      return decoded;
    } catch (e) {
      console.error('Error decodificando JWT:', e);
      return null;
    }
  }

  // Llamadas genéricas a API
  async function apiCall(method, endpoint, body) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (body) options.body = JSON.stringify(body);

      const response = await fetch(`${window.API_URL}${endpoint}`, options);

      if (response.status === 401) {
        // Token expirado - logout
        setAuthTokenRaw(null);
        setUserRaw(null);
        localStorage.removeItem('p4y_token');
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

      if (data && data.token) {
        setAuthTokenRaw(data.token);
        localStorage.setItem('p4y_token', data.token);

        const decoded = decodeJWT(data.token);
        if (decoded) {
          const userData = { id: decoded.id, email: decoded.email, ...data.user };
          setUserRaw(userData);
          localStorage.setItem('p4y_user', JSON.stringify(userData));
        }

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

      setAuthTokenRaw(null);
      setUserRaw(null);
      setReservations(EMPTY_RESERVATIONS);
      localStorage.removeItem('p4y_token');
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

      if (data && data.token) {
        setAuthTokenRaw(data.token);
        localStorage.setItem('p4y_token', data.token);

        const decoded = decodeJWT(data.token);
        if (decoded) {
          const today = new Date().toISOString().slice(0, 10);
          const userData = { id: decoded.id, email: decoded.email, name, phone, joinDate: today, ...data.user };
          setUserRaw(userData);
          localStorage.setItem('p4y_user', JSON.stringify(userData));
        }

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
    if (!authToken) return;
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

  // Wrapper para setAuthToken que también persiste
  function setAuthToken(token) {
    setAuthTokenRaw(token);
    if (token) {
      localStorage.setItem('p4y_token', token);
    } else {
      localStorage.removeItem('p4y_token');
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

  // Cargar usuario desde token al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('p4y_token');
    if (savedToken && !user) {
      setAuthTokenRaw(savedToken);
      const decoded = decodeJWT(savedToken);
      if (decoded) {
        setUserRaw({ id: decoded.id, email: decoded.email });
        // Cargar reservas del usuario
        (async () => {
          try {
            const data = await fetch(`${window.API_URL}/reservations`, {
              headers: { 'Authorization': `Bearer ${savedToken}` }
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
    }
  }, []);

  // Scroll to top on page change
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function setUser(u) {
    setUserRaw(u);
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

  const pageProps = {
    setPage, user, setUser, reservations, addReservation, cancelReservation,
    showNotification, tweaks, authToken, setAuthToken, loading, setLoading,
    apiError, setApiError, apiCall, apiLogin, apiLogout, apiRegister,
    fetchUserReservations, decodeJWT
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
