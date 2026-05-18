const { useState, useMemo, useEffect } = React;
const { Icon, Btn, Badge, Breadcrumbs } = window;

const DAYS_ES    = ['L','M','X','J','V','S','D'];
const MONTHS_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DEFAULT_PRICE = 20;

function getSlots(dayOfWeek) {
  if (dayOfWeek === 0) return [];
  if (dayOfWeek === 6) return [9, 10.5, 12];
  return [9, 10.5, 12, 16, 17.5, 19, 20.5, 22];
}

function fmt2(n) { return String(n).padStart(2, '0'); }
function fmtSlot(h) { const hr = Math.floor(h); const mn = (h % 1 >= 0.5) ? '30' : '00'; return `${fmt2(hr)}:${mn}`; }
function fmtSlotEnd(h) { return fmtSlot(h + 1.5); }
function fmtDate(d) { return `${DAYS_ES[(d.getDay()+6)%7]}, ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`; }

function ReservationsPage({ user, setPage, addReservation, showNotification, authToken, apiCall, loading, setLoading, fetchUserReservations }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [step, setStep]           = useState(1);
  const [courts, setCourts]       = useState([]);
  const [selectedCourt, setSC]    = useState(null);
  const [calYear, setCalYear]     = useState(today.getFullYear());
  const [calMonth, setCalMonth]   = useState(today.getMonth());
  const [selectedDate, setSD]     = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedHour, setSH]     = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingReservation, setPendingReservation] = useState(null);
  const [holdCountdown, setHoldCountdown] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Fetch courts on mount
  useEffect(() => {
    async function loadCourts() {
      try {
        setApiLoading(true);
        const data = await apiCall('GET', '/courts', null);
        if (data && data.courts) {
          setCourts(data.courts);
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        showNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar las pistas' });
      } finally {
        setApiLoading(false);
      }
    }
    loadCourts();
  }, []);

  // Fetch availability when date or court changes
  useEffect(() => {
    async function loadAvailability() {
      if (!selectedDate || !selectedCourt) {
        setAvailableSlots([]);
        return;
      }

      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const data = await apiCall('GET', `/availability/courts/${selectedCourt}/date/${dateStr}`, null);
        if (data && data.availableSlots) {
          setAvailableSlots(data.availableSlots || []);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailableSlots([]);
      }
    }
    loadAvailability();
  }, [selectedDate, selectedCourt]);

  // Handle hold countdown
  useEffect(() => {
    if (!pendingReservation) {
      setHoldCountdown(null);
      return;
    }

    const holdUntil = new Date(pendingReservation.holdUntil);
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((holdUntil - now) / 1000));

      if (remaining === 0) {
        setHoldCountdown(null);
        setPendingReservation(null);
        showNotification({ type: 'error', title: 'Tiempo expirado', message: 'El hold de tu reserva ha expirado' });
        clearInterval(interval);
      } else {
        setHoldCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingReservation]);

  const calDays = useMemo(() => {
    const first  = new Date(calYear, calMonth, 1);
    const offset = (first.getDay() + 6) % 7;
    const total  = new Date(calYear, calMonth + 1, 0).getDate();
    const cells  = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  function prevMonth() { if (calMonth === 0) { setCalYear(y=>y-1); setCalMonth(11); } else setCalMonth(m=>m-1); }
  function nextMonth() { if (calMonth === 11) { setCalYear(y=>y+1); setCalMonth(0); } else setCalMonth(m=>m+1); }

  function selectDate(day) {
    if (!day) return;
    const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
    if (d < today || d.getDay() === 0) return;
    setSD(d); setSH(null); setStep(3);
  }

  function handleConfirm() {
    if (!user) {
      showNotification({ type: 'info', title: 'Inicia sesión', message: 'Necesitas una cuenta para confirmar la reserva.' });
      setPage('account'); return;
    }
    setConfirming(true);
  }

  async function finalizeBooking() {
    if (!authToken) {
      showNotification({ type: 'error', title: 'Sesión requerida', message: 'Debes estar logueado para confirmar' });
      return;
    }

    try {
      setApiLoading(true);

      const court = courts.find(c => c.id === selectedCourt);
      const dateStr = selectedDate.toISOString().slice(0, 10);

      const response = await apiCall('POST', '/reservations', {
        courtId: selectedCourt,
        date: dateStr,
        startTime: fmtSlot(selectedHour),
        endTime: fmtSlotEnd(selectedHour)
      });

      if (response && response.reservation) {
        const res = response.reservation;

        // Store pending reservation for payment confirmation
        setPendingReservation(res);
        setStep(4); // Move to payment confirmation step

        showNotification({
          type: 'success',
          title: '¡Reserva en espera!',
          message: `Tu reserva está retenida por ${response.holdDurationMinutes} minutos`
        });

        setConfirming(false);
      }
    } catch (error) {
      showNotification({ type: 'error', title: 'Error en reserva', message: error.message });
    } finally {
      setApiLoading(false);
    }
  }

  async function confirmPayment(reservationId) {
    if (!authToken) return;

    try {
      setApiLoading(true);
      const response = await apiCall('PUT', `/reservations/${reservationId}/confirm`, {});

      if (response && response.reservation) {
        showNotification({ type: 'success', title: '¡Pago confirmado!', message: 'Tu reserva ha sido confirmada' });

        // Reset form
        setPendingReservation(null);
        setStep(1);
        setSC(null);
        setSD(null);
        setSH(null);

        // Reload user reservations
        await fetchUserReservations();

        setPage('account');
      }
    } catch (error) {
      showNotification({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setApiLoading(false);
    }
  }

  async function cancelPendingReservation(reservationId) {
    if (!authToken) return;

    try {
      setApiLoading(true);
      await apiCall('DELETE', `/reservations/${reservationId}`, {});

      showNotification({ type: 'info', title: 'Reserva cancelada', message: 'Tu reserva ha sido cancelada' });
      setPendingReservation(null);
      setStep(1);
    } catch (error) {
      showNotification({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setApiLoading(false);
    }
  }

  const courtObj = courts.find(c => c.id === selectedCourt);

  // ── Step bar ─────────────────────────────────────────────────────────────
  function StepBar() {
    const steps = ['Pista','Fecha','Horario'];
    if (step === 4) {
      return (
        <div style={{ marginBottom:'28px', background:'var(--amber-pale)', borderRadius:'var(--radius-lg)', padding:'14px 16px', fontSize:'13px', color:'var(--amber)', display:'flex', alignItems:'center', gap:'10px' }}>
          <Icon name="clock" size={16} color="var(--amber)"/>
          <strong>Paso 4 de 4:</strong> Confirma tu pago (el hold expira en {holdCountdown ? `${Math.ceil(holdCountdown/60)}:${String(holdCountdown%60).padStart(2,'0')}` : '0:00'})
        </div>
      );
    }

    return (
      <div style={{ display:'flex', alignItems:'center', marginBottom:'28px' }}>
        {steps.map((s, i) => {
          const n = i+1; const done = step>n; const active = step===n;
          return (
            <React.Fragment key={i}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                <div style={{
                  width:'30px', height:'30px', borderRadius:'50%', flexShrink:0,
                  background: done?'var(--green)':active?'var(--navy)':'var(--gray-light)',
                  color: done||active?'white':'var(--gray)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'13px', fontWeight:700, fontFamily:'var(--font-heading)', transition:'all 0.25s',
                }}>
                  {done ? <Icon name="check" size={14}/> : n}
                </div>
                <span className="step-label" style={{
                  fontSize:'13px', fontWeight: active?700:500, whiteSpace:'nowrap',
                  color: active?'var(--navy)':done?'var(--green)':'var(--text-muted)',
                  fontFamily:'var(--font-heading)',
                }}>{s}</span>
              </div>
              {i < steps.length-1 && <div style={{ flex:1, height:'2px', background: done?'var(--green)':'var(--gray-light)', margin:'0 10px', transition:'background 0.3s', minWidth:'12px' }}/>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ── Court step ───────────────────────────────────────────────────────────
  function CourtStep() {
    if (apiLoading && courts.length === 0) {
      return (
        <div style={{ animation:'fadeUp 0.3s ease', textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando pistas...</p>
        </div>
      );
    }

    return (
      <div style={{ animation:'fadeUp 0.3s ease' }}>
        <h2 style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'clamp(20px,4vw,24px)', color:'var(--navy)', marginBottom:'6px', letterSpacing:'-0.03em' }}>Selecciona una pista</h2>
        <p style={{ color:'var(--text-muted)', fontSize:'14px', marginBottom:'20px' }}>{courts.length} pistas disponibles</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {courts.map(c => {
            const sel = selectedCourt === c.id;
            const price = c.price_per_session || DEFAULT_PRICE;
            return (
              <button key={c.id} onClick={() => { setSC(c.id); setStep(2); }} style={{
                background: sel?'var(--navy)':'white',
                border: sel?'none':'1.5px solid var(--gray-light)',
                borderRadius:'var(--radius-lg)', padding:'18px 20px',
                cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                boxShadow: sel?'var(--shadow-lg)':'var(--shadow-sm)',
                display:'flex', alignItems:'center', gap:'16px', minHeight:'72px',
              }}
              onMouseOver={e => { if (!sel) e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
              onMouseOut={e => { if (!sel) e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}
              >
                <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:sel?'oklch(100% 0 0 / 0.1)':'var(--green-pale)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-heading)', fontWeight:900, fontSize:'18px', color:sel?'var(--green-bright)':'var(--green)' }}>P{c.id}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'16px', color:sel?'white':'var(--navy)', marginBottom:'2px' }}>{c.name}</div>
                  <div style={{ fontSize:'13px', color:sel?'oklch(78% 0.02 258)':'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.type} · {c.level}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'18px', color:sel?'var(--green-bright)':'var(--navy)' }}>€{price}</span>
                  <div style={{ fontSize:'11px', color:sel?'oklch(70% 0.02 258)':'var(--text-muted)' }}>/sesión</div>
                </div>
                {sel && <Icon name="check-circle" size={20} color="var(--green-bright)"/>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Calendar step ─────────────────────────────────────────────────────────
  function CalendarStep() {
    const todayMonth = today.getMonth(); const todayYear = today.getFullYear();
    const navPrevDisabled = calYear < todayYear || (calYear===todayYear && calMonth<=todayMonth);
    return (
      <div style={{ animation:'fadeUp 0.3s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
          <button onClick={()=>setStep(1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'6px', display:'flex', borderRadius:'8px' }}>
            <Icon name="chevron-left" size={20}/>
          </button>
          <div>
            <h2 style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'clamp(20px,4vw,24px)', color:'var(--navy)', letterSpacing:'-0.03em' }}>Selecciona la fecha</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>{courtObj?.name} · €{courtObj?.price_per_session || DEFAULT_PRICE}/sesión</p>
          </div>
        </div>
        <div style={{ background:'white', borderRadius:'var(--radius-lg)', border:'1.5px solid var(--gray-light)', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid var(--gray-light)' }}>
            <button onClick={prevMonth} disabled={navPrevDisabled} style={{ background:navPrevDisabled?'none':'var(--gray-light)', border:'none', cursor:navPrevDisabled?'default':'pointer', width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:navPrevDisabled?'var(--gray-mid)':'var(--text)', opacity:navPrevDisabled?0.4:1 }}>
              <Icon name="chevron-left" size={18}/>
            </button>
            <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'16px', color:'var(--navy)' }}>{MONTHS_ES[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{ background:'var(--gray-light)', border:'none', cursor:'pointer', width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="chevron-right" size={18}/>
            </button>
          </div>
          <div style={{ padding:'12px 14px 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'4px' }}>
              {DAYS_ES.map((d,i) => <div key={d} style={{ textAlign:'center', fontSize:'12px', fontWeight:700, color:i===6?'var(--red)':'var(--text-muted)', fontFamily:'var(--font-heading)', padding:'6px 0', letterSpacing:'0.04em' }}>{d}</div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
              {calDays.map((day, idx) => {
                if (!day) return <div key={idx}/>;
                const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
                const isPast=d<today, isSun=d.getDay()===0, isToday=d.getTime()===today.getTime();
                const isSel=selectedDate&&d.getTime()===selectedDate.getTime();
                const disabled=isPast||isSun;
                return (
                  <button key={idx} onClick={()=>!disabled&&selectDate(day)} disabled={disabled} style={{
                    width:'100%', aspectRatio:'1', minHeight:'36px', borderRadius:'8px', border:'none',
                    background:isSel?'var(--navy)':isToday?'var(--green-pale)':'transparent',
                    color:isSel?'white':isSun?'var(--red)':isPast?'var(--gray-mid)':isToday?'var(--green)':'var(--text)',
                    fontSize:'13px', fontWeight:isSel||isToday?700:500, cursor:disabled?'not-allowed':'pointer',
                    opacity:isPast?0.4:1, fontFamily:'var(--font-heading)', transition:'all 0.15s',
                  }}
                  onMouseOver={e=>{ if(!disabled&&!isSel) e.currentTarget.style.background='var(--gray-light)'; }}
                  onMouseOut={e=>{ if(!disabled&&!isSel) e.currentTarget.style.background='transparent'; }}
                  >{day}</button>
                );
              })}
            </div>
          </div>
          <div style={{ padding:'10px 16px', background:'var(--off-white)', fontSize:'12px', color:'var(--text-muted)', display:'flex', gap:'16px', flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'var(--green)' }}/> Disponible</span>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'var(--red)' }}/> Dom. cerrado</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Time slots step ────────────────────────────────────────────────────────
  function TimeSlotsStep() {
    const slots = selectedDate ? getSlots(selectedDate.getDay()) : [];
    const isSun = selectedDate && selectedDate.getDay()===0;

    function renderSlot(h) {
      const startTimeStr = fmtSlot(h);
      const isAvailable = availableSlots.some(slot => slot.startTime === startTimeStr);
      const sel = selectedHour===h;
      return (
        <button key={h} onClick={()=>isAvailable&&setSH(h)} disabled={!isAvailable} style={{
          padding:'12px 8px', borderRadius:'10px', border:'none', cursor:isAvailable?'pointer':'not-allowed',
          background:sel?'var(--navy)':!isAvailable?'var(--red-pale)':'var(--green-pale)',
          color:sel?'white':!isAvailable?'var(--red)':'var(--green)',
          fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'13px',
          opacity:!isAvailable?0.7:1, transition:'all 0.15s',
          outline:sel?'2px solid var(--green)':'none', outlineOffset:'2px',
          lineHeight:1.3, minHeight:'48px', whiteSpace:'nowrap',
        }}
        onMouseOver={e=>{ if(isAvailable&&!sel) e.currentTarget.style.background='oklch(90% 0.07 152)'; }}
        onMouseOut={e=>{ if(isAvailable&&!sel) e.currentTarget.style.background='var(--green-pale)'; }}
        >
          {startTimeStr} – {fmtSlotEnd(h)}
        </button>
      );
    }

    return (
      <div style={{ animation:'fadeUp 0.3s ease', paddingBottom: selectedHour!==null ? '80px' : '0' }} className="slots-container">
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
          <button onClick={()=>{ setStep(2); setSH(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'6px', display:'flex', borderRadius:'8px' }}>
            <Icon name="chevron-left" size={20}/>
          </button>
          <div>
            <h2 style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'clamp(20px,4vw,24px)', color:'var(--navy)', letterSpacing:'-0.03em' }}>Selecciona el horario</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>{courtObj?.name} · {selectedDate?fmtDate(selectedDate):''}</p>
          </div>
        </div>

        {isSun ? (
          <div style={{ background:'var(--red-pale)', border:'1.5px solid oklch(85% 0.10 25)', borderRadius:'var(--radius-lg)', padding:'32px', textAlign:'center' }}>
            <Icon name="x-circle" size={36} color="var(--red)"/>
            <p style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'18px', color:'var(--red)', marginTop:'12px' }}>Cerrado los domingos</p>
          </div>
        ) : (
          <>
            {slots.some(h=>h<14) && (
              <div style={{ marginBottom:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'10px', fontFamily:'var(--font-heading)' }}>Mañana · 9:00 – 13:30</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'8px' }}>
                  {slots.filter(h=>h<14).map(h=>renderSlot(h))}
                </div>
              </div>
            )}
            {slots.some(h=>h>=16) && (
              <div style={{ marginBottom:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'10px', fontFamily:'var(--font-heading)' }}>Tarde / Noche · 16:00 – 23:30</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'8px' }}>
                  {slots.filter(h=>h>=16).map(h=>renderSlot(h))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', fontSize:'12px', color:'var(--text-muted)', marginBottom:'16px' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'9px',height:'9px',borderRadius:'3px',background:'var(--green-pale)',border:'1px solid var(--green)' }}/> Disponible</span>
              <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'9px',height:'9px',borderRadius:'3px',background:'var(--red-pale)' }}/> Ocupado</span>
              <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'9px',height:'9px',borderRadius:'3px',background:'var(--navy)' }}/> Seleccionado</span>
            </div>
            {/* Desktop confirm button */}
            {selectedHour!==null && (
              <div className="desktop-confirm">
                <Btn variant="navy" size="lg" fullWidth onClick={handleConfirm}>
                  <Icon name="check-circle" size={18}/> Confirmar · {fmtSlot(selectedHour)} – {fmtSlotEnd(selectedHour)}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Sidebar (desktop) ──────────────────────────────────────────────────────
  function BookingSidebar() {
    const hasAll = selectedCourt && selectedDate && selectedHour!==null;
    const price = courtObj?.price_per_session || DEFAULT_PRICE;
    return (
      <div style={{ background:'white', border:'1.5px solid var(--gray-light)', borderRadius:'var(--radius-lg)', padding:'24px', boxShadow:'var(--shadow-sm)', position:'sticky', top:'86px' }}>
        <h3 style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'16px', color:'var(--navy)', marginBottom:'18px', letterSpacing:'-0.02em' }}>Resumen de reserva</h3>
        {[
          ['Pista', courtObj?.name||'—'],
          ['Fecha', selectedDate?fmtDate(selectedDate):'—'],
          ['Horario', selectedHour!==null?`${fmtSlot(selectedHour)} – ${fmtSlotEnd(selectedHour)}`:'—'],
          ['Duración','1h 30min'],
          ['Precio',`€${price}/sesión`],
        ].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:'1px solid var(--gray-light)', gap:'10px' }}>
            <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{k}</span>
            <span style={{ fontSize:'13px', fontWeight:600, color:'var(--navy)', textAlign:'right' }}>{v}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0' }}>
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'15px', color:'var(--navy)' }}>Total</span>
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:900, fontSize:'20px', color:'var(--green)', letterSpacing:'-0.03em' }}>€{price}</span>
        </div>
        {hasAll && <Btn variant="primary" size="lg" fullWidth onClick={handleConfirm} disabled={apiLoading} style={{ marginTop:'16px' }}><Icon name="check-circle" size={16}/> {apiLoading ? 'Procesando...' : 'Confirmar Reserva'}</Btn>}
        {!user && hasAll && <p style={{ fontSize:'12px', color:'var(--text-muted)', textAlign:'center', marginTop:'8px' }}>Se te pedirá iniciar sesión.</p>}
      </div>
    );
  }

  // ── Mobile sticky bar (shown in step 3 when slot selected) ─────────────────
  function MobileBar() {
    if (step!==3 || selectedHour===null) return null;
    const price = courtObj?.price_per_session || DEFAULT_PRICE;
    return (
      <div className="mobile-confirm-bar" style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:800,
        background:'white', borderTop:'1.5px solid var(--gray-light)',
        padding:'12px 16px 16px',
        boxShadow:'0 -6px 24px oklch(0% 0 0 / 0.12)',
        alignItems:'center', gap:'12px',
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'12px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {courtObj?.name} · {selectedDate?fmtDate(selectedDate):''}
          </div>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'15px', color:'var(--navy)' }}>
            {fmtSlot(selectedHour)} – {fmtSlotEnd(selectedHour)} &nbsp;·&nbsp; <span style={{ color:'var(--green)' }}>€{price}</span>
          </div>
        </div>
        <Btn variant="primary" size="md" onClick={handleConfirm} disabled={apiLoading}>
          <Icon name="check-circle" size={16}/> {apiLoading ? '...' : 'Confirmar'}
        </Btn>
      </div>
    );
  }

  // ── Confirmation modal ─────────────────────────────────────────────────────
  function ConfirmModal() {
    if (!confirming) return null;
    const price = courtObj?.price_per_session || DEFAULT_PRICE;
    return (
      <div style={{ position:'fixed', inset:0, background:'oklch(0% 0 0 / 0.5)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0', animation:'fadeIn 0.2s ease' }}
        className="modal-backdrop">
        <div style={{ background:'white', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', padding:'32px 24px 36px', width:'100%', maxWidth:'480px', boxShadow:'var(--shadow-lg)', animation:'slideUp 0.28s ease' }}>
          <div style={{ width:'4px', height:'4px', borderRadius:'2px' }}/>
          <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'var(--gray-mid)', margin:'0 auto 24px' }}/>
          <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'var(--green-pale)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Icon name="calendar" size={24} color="var(--green)"/>
          </div>
          <h3 style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'20px', color:'var(--navy)', textAlign:'center', marginBottom:'20px', letterSpacing:'-0.03em' }}>Confirmar reserva</h3>
          {[['Pista',courtObj?.name],['Fecha',fmtDate(selectedDate)],['Horario',`${fmtSlot(selectedHour)} – ${fmtSlotEnd(selectedHour)}`],['Duración','1h 30min'],['Total',`€${price}`]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--gray-light)' }}>
              <span style={{ fontSize:'14px', color:'var(--text-muted)' }}>{k}</span>
              <span style={{ fontSize:'14px', fontWeight:700, color:'var(--navy)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
            <Btn variant="ghost" size="lg" fullWidth onClick={()=>setConfirming(false)} disabled={apiLoading}>Cancelar</Btn>
            <Btn variant="primary" size="lg" fullWidth onClick={finalizeBooking} disabled={apiLoading}><Icon name="check-circle" size={16}/> {apiLoading ? 'Procesando...' : 'Confirmar y Pagar'}</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment confirmation modal (step 4) ────────────────────────────────────
  function PaymentConfirmationModal() {
    if (step !== 4 || !pendingReservation) return null;

    const minutes = Math.ceil(holdCountdown / 60);
    const seconds = holdCountdown % 60;

    return (
      <div style={{ position:'fixed', inset:0, background:'oklch(0% 0 0 / 0.5)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0', animation:'fadeIn 0.2s ease' }}
        className="modal-backdrop">
        <div style={{ background:'white', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', padding:'32px 24px 36px', width:'100%', maxWidth:'480px', boxShadow:'var(--shadow-lg)', animation:'slideUp 0.28s ease' }}>
          <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'var(--gray-mid)', margin:'0 auto 24px' }}/>
          <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'var(--amber-pale)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Icon name="clock" size={28} color="var(--amber)"/>
          </div>
          <h3 style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'20px', color:'var(--navy)', textAlign:'center', marginBottom:'8px', letterSpacing:'-0.03em' }}>Confirma tu pago</h3>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', textAlign:'center', marginBottom:'24px' }}>Tu reserva está retenida temporalmente</p>

          <div style={{ background:'var(--amber-pale)', borderRadius:'var(--radius-lg)', padding:'20px', marginBottom:'24px', textAlign:'center' }}>
            <p style={{ fontSize:'12px', color:'var(--amber)', fontWeight:700, marginBottom:'8px', textTransform:'uppercase' }}>Tiempo restante</p>
            <p style={{ fontFamily:'var(--font-heading)', fontWeight:900, fontSize:'32px', color:'var(--amber)', letterSpacing:'-0.03em' }}>
              {String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}
            </p>
          </div>

          {[
            ['ID de Reserva', pendingReservation.id],
            ['Pista', courtObj?.name],
            ['Fecha', fmtDate(selectedDate)],
            ['Horario', `${fmtSlot(selectedHour)} – ${fmtSlotEnd(selectedHour)}`],
            ['Total', `€${courtObj?.price_per_session || DEFAULT_PRICE}`]
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--gray-light)', fontSize:'13px' }}>
              <span style={{ color:'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight:600, color:'var(--navy)' }}>{v}</span>
            </div>
          ))}

          <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
            <Btn variant="ghost" size="lg" fullWidth onClick={() => cancelPendingReservation(pendingReservation.id)} disabled={apiLoading}>
              Cancelar
            </Btn>
            <Btn variant="primary" size="lg" fullWidth onClick={() => confirmPayment(pendingReservation.id)} disabled={apiLoading || !holdCountdown}>
              {apiLoading ? 'Procesando...' : holdCountdown ? 'Confirmar Pago' : 'Tiempo expirado'}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-anim" style={{ paddingTop:'66px', minHeight:'100vh', background:'var(--off-white)' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'clamp(20px,4vw,40px) clamp(14px,4vw,32px)' }}>
        <div style={{ marginBottom:'20px' }}>
          <Breadcrumbs items={[{label:'Inicio',page:'home'},{label:'Reservas'}]} setPage={setPage}/>
        </div>
        {step !== 4 && (
          <div className="res-grid">
            <div>
              <StepBar/>
              {step===1 && <CourtStep/>}
              {step===2 && <CalendarStep/>}
              {step===3 && <TimeSlotsStep/>}
            </div>
            <div className="res-sidebar">
              <BookingSidebar/>
            </div>
          </div>
        )}
      </div>

      <MobileBar/>
      <ConfirmModal/>
      <PaymentConfirmationModal/>

      <style>{`
        .res-grid {
          display: grid;
          grid-template-columns: minmax(0,1fr) 290px;
          gap: 24px;
          align-items: start;
        }
        .res-sidebar { display: block; }
        .mobile-confirm-bar { display: none; }
        .desktop-confirm { display: block; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 860px) {
          .res-grid {
            grid-template-columns: 1fr;
          }
          .res-sidebar { display: none; }
          .mobile-confirm-bar { display: flex !important; }
          .desktop-confirm { display: none; }
          .step-label { display: none; }
          .modal-backdrop {
            align-items: flex-end !important;
          }
        }
      `}</style>
    </div>
  );
}

window.ReservationsPage = ReservationsPage;
