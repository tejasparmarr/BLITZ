// Remove duplicate drawer logic; keep only page-specific behaviors.
// This script now only sets active link highlight and route-ready flag.

document.addEventListener('DOMContentLoaded', () => {
  // Active link highlight (works alongside nav.js)
  const path = location.pathname.toLowerCase();
  document.querySelectorAll('.nav-links a, .drawer-nav a').forEach(a=>{
    const href = a.getAttribute('href')?.toLowerCase();
    if(href && path.endsWith(href)) a.classList.add('active');
  });

  document.documentElement.classList.add('route-ready');
});
