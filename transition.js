
(() => {
  const DUR = 450;

  
  const curtain = document.createElement('div');
  curtain.className = 'page-curtain';
  document.body.appendChild(curtain);


  requestAnimationFrame(() => {
    document.documentElement.classList.add('route-enter');
    document.documentElement.offsetHeight;
    document.documentElement.classList.add('route-enter-active', 'route-ready');
    setTimeout(() => {
      document.documentElement.classList.remove('route-enter','route-enter-active');
    }, DUR);
  });

 
  function enhanceLink(a){
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || a.hasAttribute('data-no-transition')) return;

    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || a.target === '_blank') return;
      ev.preventDefault();
      a.setAttribute('aria-busy','true');

      
      document.documentElement.classList.add('route-exit');
      document.documentElement.offsetHeight; 
      document.documentElement.classList.add('route-exit-active');

      setTimeout(() => { window.location.href = href; }, DUR);
    });
  }

  document.querySelectorAll('a').forEach(enhanceLink);
})();
