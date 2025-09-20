document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');

  function openDrawer(){
    drawer.classList.add('open');
    backdrop.hidden = false;
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false');
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    backdrop.hidden = true;
    document.body.classList.remove('no-scroll');
    btn.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true');
  }

  if(btn){
    btn.addEventListener('click', () => {
      if(drawer.classList.contains('open')) closeDrawer();
      else openDrawer();
    });
  }
  if(backdrop){
    backdrop.addEventListener('click', closeDrawer);
  }
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeDrawer(); });
});
