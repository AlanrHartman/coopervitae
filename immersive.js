/* COOPERVITAE — Natural Motion 3.0
   Deliberately lightweight: one throttled scroll loop, no canvas/particles,
   no continuous drawing. Native scrolling remains under visitor control. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const scenes = [...document.querySelectorAll('main > section')];
  const clamp = v => Math.min(1,Math.max(0,v));
  let active = null;
  let scheduled = false;
  let width = window.innerWidth, height = window.innerHeight;

  function paint() {
    scheduled = false;
    const viewH = height;
    let nearest = null, distance = Infinity;
    for(const section of scenes) {
      const box = section.getBoundingClientRect();
      if(box.bottom < -viewH*.4 || box.top > viewH*1.4) continue;
      const d = Math.abs((box.top + box.bottom) / 2 - viewH / 2);
      if(d < distance) { nearest = section; distance = d; }
      if(reduced) continue;
      const p = clamp((viewH-box.top) / Math.max(viewH,box.height+viewH));
      section.style.setProperty('--scroll-slow',(-p*55).toFixed(1)+'px');
      section.style.setProperty('--scroll-medium',(-p*75).toFixed(1)+'px');
      if(section.id === 'origem') {
        section.style.setProperty('--hero-zoom',(1.065+p*.09).toFixed(4));
        section.style.setProperty('--hero-mobile-zoom',(1.1+p*.065).toFixed(4));
      }
      if(section.id === 'transformacao') {
        section.style.setProperty('--beans-zoom',(1.075+p*.085).toFixed(4));
      }
      const pinned = section.querySelector('.product-pin,.transform-pin,.origin-sticky');
      if(pinned) {
        pinned.style.setProperty('--scroll-slow',(-p*55).toFixed(1)+'px');
      }
    }
    if(active !== nearest) {
      active = nearest;
      document.body.dataset.ambient = active?.id || '';
    }
  }
  const schedule = () => { if(!scheduled) { scheduled = true; requestAnimationFrame(paint); } };
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{width=innerWidth;height=innerHeight;schedule();},{passive:true});
  paint();

  if(finePointer && !reduced) {
    let x=0,y=0,pointerQueued=false;
    addEventListener('pointermove',event=>{
      x=(event.clientX/width-.5)*12;
      y=(event.clientY/height-.5)*10;
      if(pointerQueued)return;
      pointerQueued=true;
      requestAnimationFrame(()=>{
        pointerQueued=false;
        if(!active) return;
        active.style.setProperty('--par-x',x.toFixed(1)+'px');
        active.style.setProperty('--par-y',y.toFixed(1)+'px');
        const pin=active.querySelector('.product-pin,.transform-pin,.origin-sticky');
        if(pin){pin.style.setProperty('--par-x',x.toFixed(1)+'px');pin.style.setProperty('--par-y',y.toFixed(1)+'px');}
      });
    },{passive:true});
  }
  // Play only the scene film currently visible. All three are muted, optimized and local.
  const films=[document.querySelector('.origin-video'),document.querySelector('.transform-beans'),document.querySelector('.business-film')].filter(Boolean);
  const filmObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    for(const entry of entries){
      const film=entry.target, visible=entry.isIntersecting && !document.hidden;
      if(!reduced && visible) film.play().catch(()=>{});
      else film.pause();
    }
  },{threshold:.02,rootMargin:'80px 0px 80px 0px'}) : null;
  for(const film of films){
    if(reduced){film.pause();film.removeAttribute('autoplay');}
    else if(filmObserver)filmObserver.observe(film);
    else film.play().catch(()=>{});
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) films.forEach(film=>film.pause());
    else if(!reduced)films.forEach(film=>{
      const rect=film.getBoundingClientRect();
      if(rect.bottom>0 && rect.top<innerHeight) film.play().catch(()=>{});
    });
  });
})();
