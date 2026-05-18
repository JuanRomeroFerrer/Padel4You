const { useState, useEffect } = React;

// ─── Icon ──────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', style }) {
  const paths = {
    menu:          <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    x:             <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:         <polyline points="20 6 9 17 4 12"/>,
    'check-circle':<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    'x-circle':    <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    info:          <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    user:          <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    calendar:      <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    clock:         <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'map-pin':     <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    phone:         <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
    mail:          <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    'chevron-left':<polyline points="15 18 9 12 15 6"/>,
    'chevron-right':<polyline points="9 18 15 12 9 6"/>,
    'arrow-right': <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    users:         <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    star:          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    shield:        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    logout:        <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    trash:         <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    'credit-card': <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    award:         <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    'refresh-cw':  <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    zap:           <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    eye:           <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    'eye-off':     <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name] || null}
    </svg>
  );
}

// ─── ImgPlaceholder ────────────────────────────────────────────────────────
function ImgPlaceholder({ label, style = {} }) {
  return (
    <div style={{
      background: 'repeating-linear-gradient(45deg,#e2e6ef,#e2e6ef 5px,#edf0f7 5px,#edf0f7 14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: '11px', color: '#8892a8',
      letterSpacing: '0.04em', textAlign: 'center', padding: '8px',
      ...style,
    }}>
      {label}
    </div>
  );
}

// ─── Btn ───────────────────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', fullWidth, style: extraStyle }) {
  const vMap = {
    primary:  { background: 'var(--green)', color: 'white', border: 'none' },
    navy:     { background: 'var(--navy)', color: 'white', border: 'none' },
    outline:  { background: 'transparent', color: 'var(--green)', border: '1.5px solid var(--green)' },
    ghost:    { background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--gray-light)' },
    danger:   { background: 'var(--red)', color: 'white', border: 'none' },
    white:    { background: 'white', color: 'var(--navy)', border: 'none' },
  };
  const sMap = {
    sm: { padding: '8px 16px', fontSize: '13px', borderRadius: '8px' },
    md: { padding: '11px 22px', fontSize: '14px', borderRadius: '10px' },
    lg: { padding: '15px 30px', fontSize: '16px', borderRadius: '12px' },
    xl: { padding: '18px 36px', fontSize: '17px', borderRadius: '14px' },
  };
  const v = vMap[variant] || vMap.primary;
  const s = sMap[size] || sMap.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        ...v, ...s,
        fontFamily: 'var(--font-heading)', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.18s ease',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        ...extraStyle,
      }}
      onMouseOver={e => { if (!disabled) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseOut={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
    >
      {children}
    </button>
  );
}

// ─── InputField ────────────────────────────────────────────────────────────
function InputField({ label, type = 'text', value, onChange, placeholder, required, error, icon, hint }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em' }}>
          {label}{required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', pointerEvents: 'none' }}>
            <Icon name={icon} size={16} />
          </div>
        )}
        <input
          type={inputType} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `11px ${type === 'password' ? '42px' : '14px'} 11px ${icon ? '40px' : '14px'}`,
            border: `1.5px solid ${error ? 'var(--red)' : focused ? 'var(--green)' : 'var(--gray-mid)'}`,
            borderRadius: '10px', fontSize: '14px', color: 'var(--text)',
            background: 'var(--white)', outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
            boxShadow: focused ? `0 0 0 3px ${error ? 'var(--red-pale)' : 'var(--green-pale)'}` : 'none',
          }}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '4px' }}>
            <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
          </button>
        )}
      </div>
      {hint && !error && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>}
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Icon name="x-circle" size={12} /> {error}
        </span>
      )}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────
function Badge({ children, variant = 'default' }) {
  const v = {
    default: { bg: 'var(--gray-light)', color: 'var(--gray)' },
    success: { bg: 'var(--green-pale)', color: 'var(--green)' },
    error:   { bg: 'var(--red-pale)', color: 'var(--red)' },
    navy:    { bg: 'var(--navy)', color: 'white' },
    amber:   { bg: 'var(--amber-pale)', color: 'oklch(48% 0.15 75)' },
  }[variant] || { bg: 'var(--gray-light)', color: 'var(--gray)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 600,
      background: v.bg, color: v.color, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ notification, onDismiss }) {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [notification]);
  if (!notification) return null;
  const cfg = {
    success: { bg: 'var(--navy)', accent: 'var(--green-bright)', icon: 'check-circle' },
    error:   { bg: 'oklch(38% 0.18 25)', accent: 'white', icon: 'x-circle' },
    info:    { bg: 'var(--navy)', accent: 'oklch(72% 0.16 230)', icon: 'info' },
  }[notification.type] || { bg: 'var(--navy)', accent: 'var(--green-bright)', icon: 'info' };
  return (
    <div style={{
      position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '16px 18px', background: cfg.bg, color: 'white',
      borderRadius: '14px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.28)',
      maxWidth: '360px', minWidth: '260px',
      animation: 'slideInRight 0.28s ease',
    }}>
      <Icon name={cfg.icon} size={20} color={cfg.accent} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-heading)', marginBottom: '2px' }}>{notification.title}</div>
        {notification.message && <div style={{ fontSize: '13px', opacity: 0.78, lineHeight: 1.5 }}>{notification.message}</div>}
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.6, padding: '2px', flexShrink: 0 }}>
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────
function Nav({ page, setPage, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isHome = page === 'home';
  const solid = scrolled || !isHome;
  const txtColor = solid ? 'var(--text)' : 'white';

  const links = [
    { id: 'home', label: 'Inicio' },
    { id: 'about', label: 'Sobre Nosotros' },
    { id: 'reservations', label: 'Reservas' },
    { id: 'account', label: user ? 'Mi Cuenta' : 'Acceder' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: '66px', display: 'flex', alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 40px)',
        background: solid ? 'var(--white)' : 'transparent',
        boxShadow: solid ? 'var(--shadow-sm)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s',
        gap: '8px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setPage('home')}>
          <img src="uploads/LogoPadel4You.jpg" alt="Padel4You logo" style={{ width: '38px', height: '38px', borderRadius: '9px', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '17px', color: txtColor, letterSpacing: '-0.03em', transition: 'color 0.3s' }}>
            Padel<span style={{ color: 'var(--green)' }}>4</span>You
          </span>
        </div>

        {/* Desktop links */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto', marginRight: '16px' }}>
          {links.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} style={{
              background: page === l.id ? (solid ? 'var(--green-pale)' : 'oklch(100% 0 0 / 0.12)') : 'none',
              border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px',
              fontSize: '14px', fontWeight: page === l.id ? 700 : 500,
              color: page === l.id ? 'var(--green)' : txtColor,
              transition: 'all 0.18s', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em',
            }}
            onMouseOver={e => { if (page !== l.id) e.currentTarget.style.background = solid ? 'var(--gray-light)' : 'oklch(100% 0 0 / 0.1)'; }}
            onMouseOut={e => { if (page !== l.id) e.currentTarget.style.background = 'none'; }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button className="nav-desktop" onClick={() => setPage('reservations')} style={{
          background: 'var(--green)', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em',
          transition: 'all 0.18s', whiteSpace: 'nowrap',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'var(--green-mid)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.transform = ''; }}
        >
          Reservar Pista
        </button>

        {/* Mobile hamburger */}
        <button className="nav-mobile-btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menú"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtColor, marginLeft: 'auto', padding: '6px' }}>
          <Icon name="menu" size={24} />
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'var(--navy)', display: 'flex', flexDirection: 'column', padding: '24px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="uploads/LogoPadel4You.jpg" alt="Padel4You logo" style={{ width: '36px', height: '36px', borderRadius: '9px', objectFit: 'cover' }} />
              <span style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em' }}>
                Padel<span style={{ color: 'var(--green-bright)' }}>4</span>You
              </span>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
              <Icon name="x" size={26} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {links.map(l => (
              <button key={l.id} onClick={() => { setPage(l.id); setMobileOpen(false); }} style={{
                background: page === l.id ? 'oklch(100% 0 0 / 0.08)' : 'none',
                border: 'none', cursor: 'pointer', padding: '16px 20px', borderRadius: '12px',
                textAlign: 'left', fontSize: '22px', fontWeight: 700,
                fontFamily: 'var(--font-heading)', color: page === l.id ? 'var(--green-bright)' : 'oklch(88% 0.01 258)',
                letterSpacing: '-0.02em', transition: 'all 0.15s',
              }}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setPage('reservations'); setMobileOpen(false); }} style={{
            width: '100%', background: 'var(--green)', color: 'white', border: 'none',
            padding: '18px', borderRadius: '14px', fontSize: '18px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-heading)',
          }}>
            Reservar Pista
          </button>
        </div>
      )}
    </>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer style={{ background: 'var(--navy)', color: 'oklch(72% 0.02 258)', padding: 'clamp(48px,6vw,72px) clamp(20px,4vw,40px) 32px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '40px 32px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <img src="uploads/LogoPadel4You.jpg" alt="Padel4You logo" style={{ width: '38px', height: '38px', borderRadius: '9px', objectFit: 'cover', flexShrink: 0 }} />
              <span style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.03em' }}>Padel<span style={{ color: 'var(--green-bright)' }}>4</span>You</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'oklch(68% 0.02 258)' }}>El club de pádel más moderno de la ciudad. Instalaciones de primera, comunidad apasionada.</p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', marginBottom: '14px', letterSpacing: '-0.01em' }}>Navegación</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[['home','Inicio'],['about','Sobre Nosotros'],['reservations','Reservar Pista'],['account','Mi Cuenta']].map(([id,lbl]) => (
                <button key={id} onClick={() => setPage(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(68% 0.02 258)', fontSize: '14px', textAlign: 'left', padding: 0, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--green-bright)'}
                  onMouseOut={e => e.currentTarget.style.color = 'oklch(68% 0.02 258)'}
                >{lbl}</button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>Contacto</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14px' }}>
              {[['map-pin','Avenida de Córdoba, 13\n06400 Don Benito (Extremadura)'],['phone','+34 924 80 61 35'],['mail','hola@padel4you.es']].map(([ic, txt]) => (
                <div key={ic} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                  <Icon name={ic} size={15} color="var(--green-bright)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'pre-line' }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>Horarios</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              {[['Lun – Vie','9:00 – 23:00','success'],['Sábado','9:00 – 14:00','success']].map(([d,h,v]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>{d}</span>
                  <span style={{ color: v === 'success' ? 'var(--green-bright)' : 'oklch(65% 0.18 25)' }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid oklch(100% 0 0 / 0.07)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: 'oklch(50% 0.015 258)' }}>© 2026 Padel4You. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'oklch(50% 0.015 258)' }}>
            {['Privacidad','Términos','Cookies'].map(t => <a key={t} href="#" style={{ color: 'inherit' }}>{t}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Breadcrumbs ───────────────────────────────────────────────────────────
function Breadcrumbs({ items, setPage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevron-right" size={14} color="var(--gray-mid)" />}
          {item.page ? (
            <button onClick={() => setPage(item.page)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: '13px', padding: 0, fontFamily: 'var(--font-body)' }}>{item.label}</button>
          ) : (
            <span style={{ color: i === items.length - 1 ? 'var(--text)' : 'inherit', fontWeight: i === items.length - 1 ? 600 : 400 }}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, { Icon, ImgPlaceholder, Btn, InputField, Badge, Toast, Nav, Footer, Breadcrumbs });
