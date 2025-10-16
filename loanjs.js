
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const toInt = v => Number.isFinite(+v) ? +v : null;
const monthsFrom = (n, unit) => unit === 'years' ? Math.round(n*12) : Math.round(n);
const ratePerPeriod = (apr, freq) => {
  const rYear = (+apr || 0)/100;
  if(freq === 'monthly') return rYear/12;
  if(freq === 'biweekly') return rYear/26;
  if(freq === 'weekly') return rYear/52;
  return rYear/12;
};
const periodsFor = (months, freq) => {
  if(freq === 'monthly') return months;
  if(freq === 'biweekly') return Math.round(months*26/12);
  if(freq === 'weekly') return Math.round(months*52/12);
  return months;
};
const currency = n => isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:0}) : '—';

function emi(P, r, n){
  if(n<=0) return 0;
  if(r === 0) return P / n;
  const pow = Math.pow(1+r, n);
  return P * r * pow / (pow - 1);
}

function buildSchedule({principal, apr, months, freq, prepayAmt=0, prepayAtPeriods=null}){
  const r = ratePerPeriod(apr, freq);
  const N = periodsFor(months, freq);
  const fixedEmi = emi(principal, r, N);
  const rows = [];
  let balance = principal;
  let totalInt = 0;
  let totalPay = 0;

  for(let k=1; k<=N; k++){
    const interest = r * balance;
    let principalComp = fixedEmi - interest;

    if(prepayAmt>0 && prepayAtPeriods && k === prepayAtPeriods){
      balance = Math.max(0, balance - prepayAmt);
    }

    if(principalComp > balance){
      principalComp = balance;
    }
    const pay = principalComp + interest;
    balance = Math.max(0, balance - principalComp);

    rows.push({ k, payment: pay, interest, principal: principalComp, balance });

    totalInt += interest;
    totalPay += pay;

    if(balance <= 0){ break; }
  }

  return { rows, totalInterest: totalInt, totalPayment: totalPay, emiValue: fixedEmi };
}

function drawPie(canvas, principal, interest){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 10;

  const total = Math.max(1, principal + interest);
  const angInterest = (interest/total) * Math.PI * 2;

  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.fillStyle = '#f59e0b';
  ctx.arc(cx,cy,r,0,angInterest); ctx.closePath(); ctx.fill();

  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.fillStyle = '#22c55e';
  ctx.arc(cx,cy,r,angInterest,Math.PI*2); ctx.closePath(); ctx.fill();

  ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
}

function readInputs(){
  const amount = toInt($('#loanAmount')?.value);
  const rate = parseFloat($('#interestRate')?.value || '0');
  const tenure = toInt($('#tenure')?.value);
  const tenureUnit = $('#tenureUnit')?.value || 'months';
  const months = monthsFrom(tenure || 0, tenureUnit);

  const downPayment = toInt($('#downPayment')?.value) || 0;
  const processingFee = toInt($('#processingFee')?.value) || 0;
  const freq = $('#frequency')?.value || 'monthly';
  const loanType = $('#loanType')?.value || 'personal';

  const age = toInt($('#age')?.value);

  const prepayAmount = toInt($('#prepayAmount')?.value) || 0;
  const prepayAt = toInt($('#prepayAt')?.value);
  const prepayUnit = $('#prepayUnit')?.value || 'months';
  const prepayAtPeriods = prepayAt ? periodsFor(monthsFrom(prepayAt, prepayUnit), freq) : null;

 
  const poeticMode = true;

  const principal = Math.max(0, (amount || 0) - downPayment + processingFee);

  return { principal, rate, months, freq, loanType, age, prepayAmount, prepayAtPeriods, poeticMode };
}

function frequencyChip(freq){
  if(freq==='monthly') return 'Monthly';
  if(freq==='biweekly') return 'Bi-weekly';
  if(freq==='weekly') return 'Weekly';
  return 'Monthly';
}
function endDateAndAge(startAge, months){
  if(!months) return { endAge: null };
  const years = months/12;
  const endAge = startAge ? (startAge + years) : null;
  return { endAge };
}

function renderAll(){
  const { principal, rate, months, freq, loanType, age, poeticMode, prepayAmount, prepayAtPeriods } = readInputs();

  if(!principal || !rate || !months){
    $('#result').textContent = '—';
    $('#emiValue').textContent = '—';
    $('#totalInterest').textContent = '—';
    $('#totalPayment').textContent = '—';
    $('#emiFreqChip').textContent = '—';
    $('#timelineNote').textContent = 'Enter amount, rate, and tenure to begin.';
    $('#poeticLine').textContent = 'This loan walks beside you—steady, not silent.';
    $('#amoBody').innerHTML = '<tr><td colspan="5" class="dim">Enter details to generate schedule.</td></tr>';
    drawPie($('#pieChart'), 0, 1);
    return;
  }

  const sched = buildSchedule({ principal, apr: rate, months, freq, prepayAmt: prepayAmount, prepayAtPeriods });
  const N = periodsFor(months, freq);
  const emiVal = sched.emiValue;
  const totalInt = sched.totalInterest;
  const totalPay = sched.totalPayment;

  $('#result').textContent = `${frequencyChip(freq)} EMI ${currency(Math.round(emiVal))} • ${N} payments`;
  $('#emiValue').textContent = currency(Math.round(emiVal));
  $('#totalInterest').textContent = currency(Math.round(totalInt));
  $('#totalPayment').textContent = currency(Math.round(totalPay));
  $('#emiFreqChip').textContent = frequencyChip(freq);

  const { endAge } = endDateAndAge(age, months);
  const timeline = `${Math.floor(months/12)}y ${months%12}m`;
  $('#timelineNote').textContent = endAge ? `You’ll be debt-free in ~${timeline}, around age ${Math.round(endAge)}.` : `You’ll be debt-free in ~${timeline}.`;

  const lineByType = loanType==='home'
    ? 'This shelter is patient—stone and breath.'
    : loanType==='education'
      ? 'This knowledge has a cost; its returns are quiet and compounding.'
      : loanType==='vehicle'
        ? 'Wheels turn, seasons change—keep pace, keep grace.'
        : 'This loan walks beside you—steady, not silent.';
  $('#poeticLine').textContent = lineByType;

  drawPie($('#pieChart'), principal, totalInt);

  const tbody = $('#amoBody');
  tbody.innerHTML = '';
  sched.rows.forEach(row=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.k}</td>
      <td>${currency(Math.round(row.payment))}</td>
      <td>${currency(Math.round(row.interest))}</td>
      <td>${currency(Math.round(row.principal))}</td>
      <td>${currency(Math.round(row.balance))}</td>
    `;
    tbody.appendChild(tr);
  });

  $('#cmpEmiA').textContent = currency(Math.round(emiVal));
  $('#cmpIntA').textContent = currency(Math.round(totalInt));
  $('#cmpPayA').textContent = currency(Math.round(totalPay));
}

function compareAlt(){
  const base = readInputs();
  const altRate = parseFloat($('#altRate')?.value || '') || base.rate;
  const altTenure = toInt($('#altTenure')?.value);
  const altUnit = $('#altTenureUnit')?.value || 'months';
  const altMonths = altTenure ? monthsFrom(altTenure, altUnit) : base.months;

  const schedA = buildSchedule({ principal: base.principal, apr: base.rate, months: base.months, freq: base.freq, prepayAmt: base.prepayAmount, prepayAtPeriods: base.prepayAtPeriods });
  const schedB = buildSchedule({ principal: base.principal, apr: altRate, months: altMonths, freq: base.freq, prepayAmt: base.prepayAmount, prepayAtPeriods: base.prepayAtPeriods });

  $('#cmpEmiA').textContent = currency(Math.round(schedA.emiValue));
  $('#cmpIntA').textContent = currency(Math.round(schedA.totalInterest));
  $('#cmpPayA').textContent = currency(Math.round(schedA.totalPayment));

  $('#cmpEmiB').textContent = currency(Math.round(schedB.emiValue));
  $('#cmpIntB').textContent = currency(Math.round(schedB.totalInterest));
  $('#cmpPayB').textContent = currency(Math.round(schedB.totalPayment));
}


function setupCollapsibles(){
  const items = document.querySelectorAll('details.collapsible');

  items.forEach(d => {
    const wrap = d.querySelector('.anim-wrap');
    if(!wrap) return;

    if(d.hasAttribute('open')){
      wrap.style.maxHeight = `${wrap.scrollHeight}px`;
      wrap.style.opacity = '1';
      wrap.style.transform = 'translateY(0)';
    }

    const summary = d.querySelector('summary');
    if(!summary) return;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = d.hasAttribute('open');

      if(!isOpen){
        d.setAttribute('open','');
        requestAnimationFrame(() => {
          wrap.style.maxHeight = `${wrap.scrollHeight}px`;
          wrap.style.opacity = '1';
          wrap.style.transform = 'translateY(0)';
        });
      }else{
        wrap.style.maxHeight = `${wrap.scrollHeight}px`;
        requestAnimationFrame(() => {
          wrap.style.maxHeight = '0px';
          wrap.style.opacity = '0';
          wrap.style.transform = 'translateY(-4px)';
        });
        const onEnd = (evt) => {
          if(evt.propertyName === 'max-height'){
            d.removeAttribute('open');
            wrap.removeEventListener('transitionend', onEnd);
          }
        };
        wrap.addEventListener('transitionend', onEnd);
      }
    });

    const ro = new ResizeObserver(() => {
      if(d.hasAttribute('open')){
        wrap.style.maxHeight = `${wrap.scrollHeight}px`;
      }
    });
    ro.observe(wrap);
  });
}


function bind(){
  $('#calcBtn')?.addEventListener('click', renderAll);
  $('#resetBtn')?.addEventListener('click', ()=> setTimeout(renderAll,0));
  $('#compareBtn')?.addEventListener('click', compareAlt);
  ['loanAmount','interestRate','tenure','tenureUnit','frequency','downPayment','processingFee','prepayAmount','prepayAt','prepayUnit']
    .forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('input', ()=>{/* optional live */}); });
}

document.addEventListener('DOMContentLoaded', ()=>{
  bind();
  setupCollapsibles();
  renderAll();
});
