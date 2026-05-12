"use client"; export default function Home() {
  const apartments = [
    { name: "Piso Paloma", location: "Centro / Playa con vistas espectaculares", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80" },
    { name: "Piso Micu", location: "Casco Antiguo y playa a 5 minutos", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80" },
    { name: "Piso Larysol", location: "Playa de la Fontanilla en el Centro", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80" },
    { name: "Ático Banesto", location: "Ático en La Alameda Centro / Playa", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" },
    { name: "Ático AMI", location: "Coqueto Ático con ubicación inmejorable", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80" },
  ];

  const reviews = [
    { text: "Mar fue una anfitriona excepcional. El apartamento estaba impecable y la ubicación no podría ser mejor para descubrir Marbella.", author: "Carlos, Madrid" },
    { text: "Mar was an amazing host. The apartment was spotless and the location couldn't be better. Perfect for a long stay.", author: "Sarah, London" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
        <nav className="max-w-7xl mx-auto px-8 py-3 flex justify-between items-center">
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>HolaMarbella</span>
          <div className="hidden md:flex gap-8 text-sm">
            {['Apartamentos', 'Registro de viajeros', 'Información', 'Normas de la casa'].map(item => (
              <a key={item} href="#" className="transition-colors hover:opacity-70" style={{ color: 'var(--primary)' }}>{item}</a>
            ))}
          </div>
          <button className="text-sm font-medium px-3 py-1 rounded-full border" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>ES / EN</button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=80"
            alt="Marbella"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.5) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <p className="text-white/70 text-sm uppercase tracking-widest mb-4 font-medium">Marbella · España</p>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
              Bienvenidos a vuestra<br />
              estancia perfecta,{' '}
              <span className="font-serif-italic text-[#E5D5C0]" style={{ fontWeight: 'normal' }}>
                gestionada con mimo.
              </span>
            </h1>
            <p className="text-white/80 text-lg mt-4">Apartamentos de corta estancia para vacaciones o teletrabajo</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="absolute bottom-0 left-0 right-0 z-30 translate-y-1/2 flex justify-center px-8">
          <div className="bg-white shadow-2xl rounded-full p-3 pl-8 flex flex-col md:flex-row gap-4 items-center w-full max-w-4xl">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Apartamento</label>
              <select className="w-full border-none bg-stone-50 rounded-xl py-2 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }}>
                <option>Cualquier apartamento</option>
                <option>Piso Paloma</option>
                <option>Piso Micu</option>
                <option>Piso Larysol</option>
                <option>Ático Banesto</option>
                <option>Ático AMI</option>
              </select>
            </div>
            <div className="w-px h-8 bg-stone-200 hidden md:block" />
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Llegada</label>
              <input type="date" className="w-full border-none bg-stone-50 rounded-xl py-2 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
            </div>
            <div className="w-px h-8 bg-stone-200 hidden md:block" />
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Salida</label>
              <input type="date" className="w-full border-none bg-stone-50 rounded-xl py-2 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
            </div>
            <button className="text-white font-bold text-xs px-10 h-12 rounded-full uppercase tracking-widest w-full md:w-auto transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* APARTMENTS */}
      <section className="pt-28 pb-20" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              Nuestros <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>Apartamentos</span>
            </h2>
            <a href="#" className="text-sm font-medium underline underline-offset-4" style={{ color: 'var(--primary)' }}>Ver todos →</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apt, i) => (
              <div key={i} className="group cursor-pointer rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={apt.img} alt={apt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{apt.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{apt.location}</p>
                  <button className="mt-4 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full border transition-all hover:text-white" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'var(--primary)'; (e.target as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; (e.target as HTMLElement).style.color = 'var(--primary)'; }}>
                    Ver apartamento
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20" style={{ backgroundColor: 'var(--arena)' }}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { icon: '🤝', title: 'Trato', italic: 'Personal', desc: 'Atención directa y personalizada. Recepción a la llegada en persona y disponibilidad durante toda la estancia.' },
            { icon: '📍', title: 'Excelentes', italic: 'Localizaciones', desc: 'Apartamentos en las zonas más estratégicas de Marbella para que puedas ir a pie a todas partes.' },
            { icon: '🏡', title: 'Siéntete', italic: 'en Casa', desc: 'Espacios cuidados y equipados con mimo para ofrecer el máximo confort y calidez hogareña.' },
          ].map((f, i) => (
            <div key={i} className="group px-6">
              <div className="text-5xl mb-6">{f.icon}</div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--on-surface)' }}>
                {f.title} <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{f.italic}</span>
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST / MAR */}
      <section className="py-24" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6" style={{ color: 'var(--primary)' }}>
              Hola, <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>soy Mar</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
              Me encanta cuidar cada detalle para que tu estancia en Marbella sea especial. Mi objetivo es que no solo alquiles un apartamento, sino que descubras el alma de la ciudad con la tranquilidad de sentirte en casa.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div>
                <div className="text-6xl font-bold" style={{ color: 'var(--primary)' }}>4.98</div>
                <div className="text-yellow-400 text-2xl mt-1">★★★★★</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Airbnb Superhost</div>
                <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>+250 reseñas verificadas</div>
              </div>
            </div>
            <div className="rounded-2xl p-8 border" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
              {reviews.map((r, i) => (
                <div key={i} className={i > 0 ? 'hidden' : ''}>
                  <p className="font-serif-italic text-base leading-relaxed mb-4" style={{ color: 'var(--on-surface)' }}>"{r.text}"</p>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px" style={{ backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>{r.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
              alt="Mar, anfitriona de HolaMarbella"
              className="relative w-full rounded-2xl object-cover shadow-2xl border-8 border-white"
              style={{ aspectRatio: '4/5' }}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>HolaMarbella</span>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>© 2026 HolaMarbella · Todos los derechos reservados</p>
          <div className="flex gap-8 text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            <a href="#" className="hover:opacity-70 transition-opacity">Privacidad</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Términos</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Contacto</a>
          </div>
        </div>
      </footer>

    </div>
  );
}