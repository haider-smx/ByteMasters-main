/* Modular site JS: navbar, modal contact, focus trap, active link, form handling */
(function(){
  const FORM_ENDPOINT = 'https://formspree.io/f/mrbjpdgo';

  /* Utilities */
  const qs = (sel, ctx=document)=> ctx.querySelector(sel);
  const qsa = (sel, ctx=document)=> Array.from(ctx.querySelectorAll(sel));

  /* Active nav links based on filename */
  function setActiveNav(){
    const links = qsa('.nav-link');
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(a=>{
      // reset
      a.classList.remove('active');
      a.removeAttribute('aria-current');
      // do not mark contact-openers as active (they open modal)
      if(a.classList.contains('js-open-contact')) return;
      const href = a.getAttribute('href') || '';
      const target = href.split('#')[0];
      // Determine current page types
      const isPhase = current && /^fase/i.test(current);
      const isProjectCurrent = current === 'proyecto.html' || isPhase;
      const isHomeCurrent = current === '' || current === 'index.html';
      // Mark Inicio active when on index
      if(isHomeCurrent && (target === '' || target === 'index.html')){
        a.classList.add('active');
        a.setAttribute('aria-current','page');
      }
      // Mark Proyecto active when current is proyecto or a fase page
      if(isProjectCurrent && target === 'proyecto.html'){
        a.classList.add('active');
        a.setAttribute('aria-current','page');
      }
      // Generic exact match fallback
      if(target && target === current){
        a.classList.add('active');
        a.setAttribute('aria-current','page');
      }
    });
  }

  /* Sticky header shadow on scroll */
  function setupScrollHeader(){
    const header = qs('header.navbar');
    if(!header) return;
    const onScroll = ()=>{
      if(window.scrollY > 50) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* Setup accessible toggler (uses bootstrap collapse events) */
  function setupToggler(){
    const toggler = qs('.navbar-toggler');
    const collapse = qs('.navbar-collapse');
    if(!toggler || !collapse) return;
    // Keep aria-expanded in sync using Bootstrap events
    collapse.addEventListener('show.bs.collapse', ()=> toggler.setAttribute('aria-expanded','true'));
    collapse.addEventListener('hide.bs.collapse', ()=> toggler.setAttribute('aria-expanded','false'));
    // Ensure initial attribute
    toggler.setAttribute('aria-expanded', collapse.classList.contains('show') ? 'true' : 'false');
  }

  /* Modal builder and focus trap */
  let modalOverlay = null;
  let lastFocused = null;
  function buildModal(){
    const overlay = document.createElement('div');
    overlay.className = 'contact-overlay';
    overlay.innerHTML = `
      <div class="backdrop" tabindex="-1"></div>
      <div id="contactModal" class="contact-panel" role="dialog" aria-modal="true" aria-labelledby="contactTitle" aria-describedby="contactDesc">
        <button class="close-btn" aria-label="Cerrar contacto">✕</button>
        <h2 id="contactTitle">Contacto</h2>
        <p id="contactDesc" style="margin-top:0.25rem;color:var(--muted-2);">Escríbenos y te responderemos lo antes posible.</p>
        <div class="contact-grid">
          <form class="contact-form" id="contactForm" novalidate>
            <div class="mb-2">
              <label for="c-name">Nombre</label>
              <input id="c-name" name="name" class="form-control" type="text" required autocomplete="name" />
            </div>
            <div class="mb-2">
              <label for="c-email">Email</label>
              <input id="c-email" name="email" class="form-control" type="email" required autocomplete="email" />
            </div>
            <div class="mb-2">
              <label for="c-subject">Asunto</label>
              <select id="c-subject" name="subject" class="form-control">
                <option value="Consulta">Consulta</option>
                <option value="Presupuesto">Presupuesto</option>
                <option value="Demostración">Demostración</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div class="mb-2">
              <label for="c-message">Mensaje</label>
              <textarea id="c-message" name="message" class="form-control" rows="6" required></textarea>
            </div>
            <div class="contact-actions">
              <button class="btn btn-cta" type="submit">Enviar</button>
              <button type="button" class="btn btn-back js-cancel">Cancelar</button>
            </div>
            <input type="hidden" name="_subject" value="Nuevo mensaje desde sitio" />
          </form>
          <div class="contact-info" aria-hidden="false">
            <h4 style="color:#fff;margin-bottom:8px">Información</h4>
            <p style="margin:0.2rem 0;color:var(--muted-2)">Dirección: Av. Ejemplo 123, Ciudad</p>
            <p style="margin:0.2rem 0;color:var(--muted-2)">Teléfono: +34 600 000 000</p>
            <p style="margin:0.2rem 0;color:var(--muted-2)">Email: contacto@bytemasters.local</p>
            <div style="margin-top:12px">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.999210779399!2d2.292292415674933!3d48.85837307928733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66fc33d7d5f25%3A0x4017d99b03827d0!2sEiffel%20Tower!5e0!3m2!1ses!2ses!4v1699200000000!5m2!1ses!2ses" width="100%" height="160" style="border:0;border-radius:8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
            <div style="margin-top:12px;color:var(--muted-2)">Redes: <a href="#" style="color:var(--accent)">Twitter</a> · <a href="#" style="color:var(--accent)">LinkedIn</a></div>
          </div>
        </div>
      </div>
    `;
    return overlay;
  }

  function trapFocus(modal){
    const focusable = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(modal.querySelectorAll(focusable));
    if(elements.length === 0) return ()=>{};
    let first = elements[0];
    let last = elements[elements.length-1];
    function keyHandler(e){
      if(e.key === 'Tab'){
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      }
      if(e.key === 'Escape') closeModal();
    }
    modal.addEventListener('keydown', keyHandler);
    return ()=> modal.removeEventListener('keydown', keyHandler);
  }

  function openModal(e){
    if(e) e.preventDefault();
    if(modalOverlay) return; // already open
    lastFocused = document.activeElement;
    modalOverlay = buildModal();
    document.body.appendChild(modalOverlay);
    document.body.classList.add('modal-open');
    const panel = qs('.contact-panel', modalOverlay);
    // animate in
    requestAnimationFrame(()=> panel.classList.add('open'));

    // event listeners
    const backdrop = qs('.backdrop', modalOverlay);
    const closeBtn = qs('.close-btn', modalOverlay);
    const cancel = qs('.js-cancel', modalOverlay);
    const form = qs('#contactForm', modalOverlay);

    function handleOutside(ev){ if(ev.target === backdrop) closeModal(); }
    backdrop.addEventListener('click', handleOutside);
    closeBtn.addEventListener('click', closeModal);
    cancel.addEventListener('click', closeModal);

    // focus first input
    const firstInput = qs('#c-name', modalOverlay);
    if(firstInput) firstInput.focus();

    // trap focus
    const removeTrap = trapFocus(panel);

    // submit handling
    form.addEventListener('submit', async function submitHandler(ev){
      ev.preventDefault();
      // simple validation
      const name = qs('#c-name', form).value.trim();
      const email = qs('#c-email', form).value.trim();
      const message = qs('#c-message', form).value.trim();
      if(!name || !email || !message){
        alert('Por favor completa Nombre, Email y Mensaje.');
        return;
      }
      const data = new FormData(form);
      try{
        const res = await fetch(FORM_ENDPOINT, { method:'POST', body: data, headers: { 'Accept': 'application/json' } });
        if(res.ok){
          showSuccess(panel, removeTrap);
        } else {
          const text = await res.text();
          console.error('Formspree error', text);
          alert('Error al enviar, por favor inténtalo de nuevo.');
        }
      }catch(err){ console.error(err); alert('Error de red.'); }
    });

    // close on Escape handled by trapFocus
  }

  function showSuccess(panel, removeTrap){
    // announce success for screen readers
    panel.setAttribute('aria-live','polite');
    const content = document.createElement('div');
    content.className = 'contact-success pulse';
    content.innerHTML = `
      <h3 style="color:#fff;margin-bottom:8px">Mensaje enviado</h3>
      <p style="color:var(--muted-2)">Gracias, hemos recibido tu mensaje. Te responderemos pronto.</p>
      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="btn btn-cta js-close-success">Cerrar</button>
        <button class="btn btn-back js-send-another">Enviar otro mensaje</button>
      </div>
    `;
    // replace grid content
    const grid = qs('.contact-grid', panel);
    grid.innerHTML = '';
    grid.appendChild(content);

    // wire buttons
    qs('.js-close-success', grid).addEventListener('click', closeModal);
    qs('.js-send-another', grid).addEventListener('click', ()=>{
      // reconstruct modal
      const parent = panel.parentElement;
      if(parent){ parent.remove(); modalOverlay = null; openModal(); }
    });
  }

  function closeModal(){
    if(!modalOverlay) return;
    const panel = qs('.contact-panel', modalOverlay);
    panel.classList.remove('open');
    document.body.classList.remove('modal-open');
    // wait transition then remove
    setTimeout(()=>{ if(modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay); modalOverlay = null; if(lastFocused) lastFocused.focus(); }, 280);
  }

  function wireOpeners(){
    qsa('.js-open-contact').forEach(el=> el.addEventListener('click', openModal));
    // Close mobile menu when a nav-link is clicked (accessibility + UX)
    const collapse = qs('.navbar-collapse');
    const bs = window.bootstrap || null;
    qsa('.navbar-nav .nav-link').forEach(link=>{
      link.addEventListener('click', ()=>{
        try{
          if(collapse && collapse.classList.contains('show') && bs && bs.Collapse){
            const instance = bs.Collapse.getInstance(collapse) || new bs.Collapse(collapse, {toggle:false});
            instance.hide();
          }
        }catch(e){ /* ignore */ }
      });
    });
  }

  /* Initialize everything on DOM ready */
  document.addEventListener('DOMContentLoaded', ()=>{
    // keyboard focus visible helper (adds .js-focus-visible when Tab used)
    function handleFirstTab(e){ if(e.key === 'Tab'){ document.documentElement.classList.add('js-focus-visible'); window.removeEventListener('keydown', handleFirstTab); window.addEventListener('mousedown', handlePointer); window.addEventListener('touchstart', handlePointer); } }
    function handlePointer(){ document.documentElement.classList.remove('js-focus-visible'); window.removeEventListener('mousedown', handlePointer); window.removeEventListener('touchstart', handlePointer); }
    window.addEventListener('keydown', handleFirstTab);

    setActiveNav();
    setupScrollHeader();
    setupToggler();
    wireOpeners();
    // expose for debugging
    window.Site = window.Site || {};
    window.Site.openContact = openModal;
    window.Site.closeContact = closeModal;
  });

})();
