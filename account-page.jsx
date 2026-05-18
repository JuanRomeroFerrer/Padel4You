const { useState } = React;
const { Icon, Btn, InputField, Badge, Breadcrumbs } = window;

const MONTHS_ES_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function fmtDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d} ${MONTHS_ES_SHORT[parseInt(m,10)-1]} ${y}`;
}

function AccountPage({ user, setUser, reservations, cancelReservation, setPage, showNotification, apiLogin, apiLogout, apiRegister, loading, setLoading, apiError, setApiError }) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [profileTab, setProfileTab] = useState('reservas'); // 'reservas' | 'suscripcion' | 'perfil'

  // ── Login form ──
  function LoginForm() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState({});
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    function validate() {
      const e = {};
      if (!email) e.email = 'El email es obligatorio';
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido';
      if (!pass) e.pass = 'La contraseña es obligatoria';
      else if (pass.length < 6) e.pass = 'Mínimo 6 caracteres';
      return e;
    }

    async function handleLogin(ev) {
      ev.preventDefault();
      const e = validate();
      if (Object.keys(e).length) { setErrors(e); return; }

      try {
        setLocalLoading(true);
        setLocalError('');
        setErrors({});

        await apiLogin(email, pass);
        showNotification({ type: 'success', title: '¡Bienvenido de nuevo!', message: 'Sesión iniciada correctamente 👋' });
        setPage('home');
      } catch (error) {
        setLocalError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        setErrors({ api: true });
      } finally {
        setLocalLoading(false);
      }
    }

    return (
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {localError && (
          <div style={{ background: 'var(--red-pale)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: 'var(--red)', borderLeft: '3px solid var(--red)' }}>
            {localError}
          </div>
        )}
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com" required icon="mail" error={errors.email} disabled={localLoading} />
        <InputField label="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="••••••••" required icon="shield" error={errors.pass} disabled={localLoading} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)', opacity: localLoading ? 0.5 : 1, pointerEvents: localLoading ? 'none' : 'auto' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={localLoading}
              style={{ width: '16px', height: '16px', accentColor: 'var(--green)', cursor: 'pointer' }} />
            Recordarme
          </label>
          <button type="button" disabled={localLoading} style={{ background: 'none', border: 'none', cursor: localLoading ? 'not-allowed' : 'pointer', color: 'var(--green)', fontSize: '13px', fontWeight: 600, padding: 0, opacity: localLoading ? 0.5 : 1 }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Btn type="submit" variant="primary" size="lg" fullWidth disabled={localLoading}>
          {localLoading ? '⏳ Iniciando sesión…' : (<><Icon name="arrow-right" size={17} /> Iniciar sesión</>)}
        </Btn>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={() => setAuthTab('register')} disabled={localLoading}
            style={{ background: 'none', border: 'none', cursor: localLoading ? 'not-allowed' : 'pointer', color: 'var(--green)', fontWeight: 700, fontSize: '14px', padding: 0, opacity: localLoading ? 0.5 : 1 }}>
            Regístrate gratis
          </button>
        </p>
      </form>
    );
  }

  // ── Register form ──
  function RegisterForm() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', pass: '', pass2: '' });
    const [errors, setErrors] = useState({});
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    function validate() {
      const e = {};
      if (!form.name.trim()) e.name = 'El nombre es obligatorio';
      if (!form.email) e.email = 'El email es obligatorio';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email no válido';
      if (!form.phone) e.phone = 'El teléfono es obligatorio';
      if (!form.pass || form.pass.length < 8) e.pass = 'Mínimo 8 caracteres';
      if (form.pass !== form.pass2) e.pass2 = 'Las contraseñas no coinciden';
      return e;
    }

    async function handleRegister(ev) {
      ev.preventDefault();
      const e = validate();
      if (Object.keys(e).length) { setErrors(e); return; }

      try {
        setLocalLoading(true);
        setLocalError('');
        setErrors({});

        await apiRegister(form.name, form.email, form.phone, form.pass);
        showNotification({ type: 'success', title: '¡Cuenta creada!', message: `Bienvenido/a, ${form.name.split(' ')[0]}!` });
        setPage('home');
      } catch (error) {
        setLocalError(error.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
        setErrors({ api: true });
      } finally {
        setLocalLoading(false);
      }
    }

    return (
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {localError && (
          <div style={{ background: 'var(--red-pale)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: 'var(--red)', borderLeft: '3px solid var(--red)' }}>
            {localError}
          </div>
        )}
        <InputField label="Nombre completo" value={form.name} onChange={set('name')} placeholder="Tu nombre" required icon="user" error={errors.name} disabled={localLoading} />
        <InputField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com" required icon="mail" error={errors.email} disabled={localLoading} />
        <InputField label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="+34 600 000 000" required icon="phone" error={errors.phone} disabled={localLoading} />
        <InputField label="Contraseña" type="password" value={form.pass} onChange={set('pass')} placeholder="Mínimo 8 caracteres" required icon="shield" error={errors.pass} disabled={localLoading} />
        <InputField label="Confirmar contraseña" type="password" value={form.pass2} onChange={set('pass2')} placeholder="Repite la contraseña" required icon="shield" error={errors.pass2} disabled={localLoading} />
        <Btn type="submit" variant="primary" size="lg" fullWidth disabled={localLoading}>
          {localLoading ? '⏳ Creando cuenta…' : (<><Icon name="user" size={17} /> Crear cuenta gratuita</>)}
        </Btn>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={() => setAuthTab('login')} disabled={localLoading}
            style={{ background: 'none', border: 'none', cursor: localLoading ? 'not-allowed' : 'pointer', color: 'var(--green)', fontWeight: 700, fontSize: '14px', padding: 0, opacity: localLoading ? 0.5 : 1 }}>
            Iniciar sesión
          </button>
        </p>
      </form>
    );
  }

  // ── Auth page ──
  function AuthSection() {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '66px', background: 'var(--off-white)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'calc(66px + 40px) 20px 60px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <Breadcrumbs items={[{ label: 'Inicio', page: 'home' }, { label: 'Mi Cuenta' }]} setPage={setPage} />
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', marginTop: '20px' }}>
            {/* Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--gray-light)' }}>
              {[['login','Iniciar sesión'],['register','Crear cuenta']].map(([id, label]) => (
                <button key={id} onClick={() => setAuthTab(id)} style={{
                  background: authTab === id ? 'white' : 'var(--off-white)',
                  border: 'none', cursor: 'pointer', padding: '18px', fontFamily: 'var(--font-heading)',
                  fontWeight: authTab === id ? 700 : 500, fontSize: '15px',
                  color: authTab === id ? 'var(--navy)' : 'var(--text-muted)',
                  borderBottom: authTab === id ? '2px solid var(--green)' : '2px solid transparent',
                  transition: 'all 0.18s',
                }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ padding: '32px 36px' }}>
              {authTab === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Profile section ──
  function ProfileSection() {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    function save() {
      setUser({ ...user, ...form });
      showNotification({ type: 'success', title: 'Perfil actualizado', message: 'Los cambios se han guardado correctamente.' });
      setEditing(false);
    }

    return (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--gray-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ background: 'var(--navy)', padding: '28px 28px 48px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(oklch(100% 0 0) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.04, zIndex: -1 }} />
        </div>
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-36px', marginBottom: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--green)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '26px', color: 'white' }}>{user.name?.[0] || 'U'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: 'var(--navy)', letterSpacing: '-0.02em' }}>{user.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Socio desde {user.joinDate ? fmtDateShort(user.joinDate) : '—'}</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(e => !e)}>
              <Icon name="edit" size={14} /> {editing ? 'Cancelar' : 'Editar'}
            </Btn>
          </div>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <InputField label="Nombre" value={form.name} onChange={set('name')} icon="user" />
              <InputField label="Email" type="email" value={form.email} onChange={set('email')} icon="mail" />
              <InputField label="Teléfono" value={form.phone} onChange={set('phone')} icon="phone" />
              <Btn variant="primary" size="md" onClick={save} style={{ alignSelf: 'flex-start' }}>Guardar cambios</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['mail', user.email], ['phone', user.phone || '—'], ['calendar', `Miembro desde ${user.joinDate ? fmtDateShort(user.joinDate) : '—'}`]].map(([ic, txt]) => (
                <div key={ic} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text)' }}>
                  <Icon name={ic} size={16} color="var(--text-muted)" />
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Reservations tab ──
  function MyReservations() {
    const today = new Date(); today.setHours(0,0,0,0);
    const upcoming = reservations.filter(r => new Date(r.date) >= today && r.status !== 'cancelled');
    const past = reservations.filter(r => new Date(r.date) < today || r.status === 'cancelled');

    function ResList({ items, isPast }) {
      if (!items.length) return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Icon name="calendar" size={36} color="var(--gray-mid)" />
          <p style={{ marginTop: '12px', fontSize: '15px' }}>{isPast ? 'No hay reservas anteriores' : 'No tienes reservas próximas'}</p>
          {!isPast && <Btn variant="primary" size="md" onClick={() => setPage('reservations')} style={{ marginTop: '16px' }}>Reservar ahora</Btn>}
        </div>
      );
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(r => {
            const statusMap = { confirmed: ['success', 'Confirmada'], completed: ['default', 'Completada'], cancelled: ['error', 'Cancelada'] };
            const [sv, sl] = statusMap[r.status] || ['default', r.status];
            return (
              <div key={r.id} style={{ background: 'white', border: '1.5px solid var(--gray-light)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: r.status === 'cancelled' ? 'var(--red-pale)' : 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="calendar" size={18} color={r.status === 'cancelled' ? 'var(--red)' : 'var(--green)'} />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>{r.court}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{fmtDateShort(r.date)} · {r.time} h</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Badge variant={sv}>{sl}</Badge>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'var(--navy)' }}>€{r.price}</span>
                  {r.status === 'confirmed' && !isPast && (
                    <button onClick={() => { cancelReservation(r.id); showNotification({ type: 'info', title: 'Reserva cancelada', message: `${r.court} · ${fmtDateShort(r.date)}` }); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--red-pale)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <Icon name="trash" size={14} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'var(--navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="clock" size={17} color="var(--green)" /> Próximas reservas
            {upcoming.length > 0 && <span style={{ background: 'var(--green)', color: 'white', borderRadius: '99px', fontSize: '12px', fontWeight: 700, padding: '1px 8px' }}>{upcoming.length}</span>}
          </h4>
          <ResList items={upcoming} isPast={false} />
        </div>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'var(--navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="refresh-cw" size={17} color="var(--gray)" /> Historial
          </h4>
          <ResList items={past} isPast={true} />
        </div>
      </div>
    );
  }

  // ── Subscription tab ──
  function MySubscription() {
    const sub = user.subscription;
    if (!sub) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--off-white)', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--gray-mid)' }}>
          <Icon name="credit-card" size={40} color="var(--gray-mid)" />
          <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '19px', color: 'var(--navy)', marginTop: '16px', marginBottom: '8px' }}>Sin suscripción activa</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Suscríbete para acceder al gimnasio y disfrutar de beneficios exclusivos.</p>
          <Btn variant="primary" size="md" onClick={() => { setPage('home'); setTimeout(() => document.getElementById('suscripciones')?.scrollIntoView({ behavior: 'smooth' }), 300); }}>
            Ver planes
          </Btn>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '28px 30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', borderRadius: '50%', background: 'var(--green)', opacity: 0.08, transform: 'translate(60px,-60px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green-bright)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>Plan activo</p>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '26px', color: 'white', letterSpacing: '-0.03em' }}>{sub.plan}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '32px', color: 'white', letterSpacing: '-0.04em' }}>€{sub.price}</span>
                <span style={{ color: 'oklch(70% 0.02 258)', fontSize: '14px' }}>/{sub.billingCycle}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'oklch(100% 0 0 / 0.07)', borderRadius: '10px', padding: '10px 16px' }}>
                <p style={{ fontSize: '11px', color: 'oklch(60% 0.02 258)', marginBottom: '2px' }}>Renovación</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{fmtDateShort(sub.renewalDate)}</p>
              </div>
              <div style={{ background: 'oklch(100% 0 0 / 0.07)', borderRadius: '10px', padding: '10px 16px' }}>
                <p style={{ fontSize: '11px', color: 'oklch(60% 0.02 258)', marginBottom: '2px' }}>Estado</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-bright)' }}>● Activo</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Btn variant="outline" size="md" onClick={() => showNotification({ type: 'info', title: 'Renovar suscripción', message: 'Redirigiendo a la pasarela de pago…' })}>
            <Icon name="refresh-cw" size={15} /> Renovar
          </Btn>
          <Btn variant="ghost" size="md" onClick={() => setPage('home')}>
            Cambiar plan
          </Btn>
          <Btn variant="danger" size="md" onClick={() => { setUser({ ...user, subscription: null }); showNotification({ type: 'info', title: 'Suscripción cancelada', message: 'Tu plan ha sido cancelado.' }); }}>
            <Icon name="x-circle" size={15} /> Cancelar
          </Btn>
        </div>
      </div>
    );
  }

  // ── Dashboard (logged in) ──
  function Dashboard() {
    const tabs = [
      { id: 'reservas', label: 'Mis Reservas', icon: 'calendar' },
      { id: 'suscripcion', label: 'Mi Suscripción', icon: 'credit-card' },
      { id: 'perfil', label: 'Mi Perfil', icon: 'user' },
    ];
    return (
      <div style={{ minHeight: '100vh', paddingTop: '66px', background: 'var(--off-white)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <Breadcrumbs items={[{ label: 'Inicio', page: 'home' }, { label: 'Mi Cuenta' }]} setPage={setPage} />
            <button onClick={apiLogout} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-heading)', transition: 'color 0.15s', opacity: loading ? 0.5 : 1 }}
              onMouseOver={e => !loading && (e.currentTarget.style.color = 'var(--red)')}
              onMouseOut={e => !loading && (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Icon name="logout" size={16} /> {loading ? 'Cerrando…' : 'Cerrar sesión'}
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: 'var(--radius-md)', padding: '5px', border: '1.5px solid var(--gray-light)', marginBottom: '24px', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setProfileTab(tab.id)} style={{
                flex: '1 1 100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                background: profileTab === tab.id ? 'var(--navy)' : 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', borderRadius: '8px', transition: 'all 0.2s',
                color: profileTab === tab.id ? 'white' : 'var(--text-muted)',
                fontSize: '14px', fontWeight: profileTab === tab.id ? 700 : 500, fontFamily: 'var(--font-heading)',
              }}>
                <Icon name={tab.icon} size={16} color={profileTab === tab.id ? 'var(--green-bright)' : 'currentColor'} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="page-anim">
            {profileTab === 'reservas' && <MyReservations />}
            {profileTab === 'suscripcion' && <MySubscription />}
            {profileTab === 'perfil' && <ProfileSection />}
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthSection />;
}

window.AccountPage = AccountPage;
