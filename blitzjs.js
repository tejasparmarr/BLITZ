
const nav = document.querySelector('.nav ul');
const toggleBtn = document.createElement('button');

toggleBtn.textContent = '☰';
toggleBtn.classList.add('nav-toggle');
toggleBtn.setAttribute('aria-label', 'Toggle navigation');
document.querySelector('.header-content').insertBefore(toggleBtn, nav);

toggleBtn.addEventListener('click', () => {
  nav.classList.toggle('show');
});


const inPageLinks = [
  ...document.querySelectorAll('.nav ul li a[href^="#"]'),
  ...document.querySelectorAll('a.btn[href^="#"]')
];

inPageLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    e.preventDefault();
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

   
    nav?.classList?.remove('show');

   
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});
