
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const cmFromFtIn = (ft, inch) => (ft*12 + inch) * 2.54;
const kgFromLbs = lbs => lbs * 0.45359237;
const cmFromIn = inch => inch * 2.54;
const inFromCm = cm => cm / 2.54;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const valNum = id => {
  const el = document.getElementById(id);
  const v = parseFloat(el?.value ?? "");
  return Number.isFinite(v) ? v : null;
};


function syncHeightUnit(){
  const unit = document.querySelector('input[name="heightUnit"]:checked')?.value;
  const cm = document.querySelector('.height-cm');
  const ftin = document.querySelector('.height-ftin');
  if(unit === 'cm'){ cm.classList.remove('hidden'); ftin.classList.add('hidden'); }
  else { cm.classList.add('hidden'); ftin.classList.remove('hidden'); }
}
function syncWeightPlaceholder(){
  const unit = document.querySelector('input[name="weightUnit"]:checked')?.value;
  const w = $('#weight');
  if(!w) return;
  w.placeholder = unit === 'kg' ? 'e.g., 68' : 'e.g., 150';
}


function calcBMI(heightCm, weightKg){
  const m = heightCm/100; if(m<=0) return null;
  return weightKg/(m*m);
}
function bmiCategory(b){
  if(b < 18.5) return 'Underweight';
  if(b < 25) return 'Normal';
  if(b < 30) return 'Overweight';
  return 'Obese';
}
function bmiWhisper(cat){
  const map = {
    'Underweight':'“Gather strength gently; the dawn waits.”',
    'Normal':'“You’re in the green zone—steady as a heartbeat.”',
    'Overweight':'“Small rituals, steady breaths—the path is patient.”',
    'Obese':'“Kindness to self lights the longest roads.”'
  };
  return map[cat] ?? '“This isn’t a number—it’s a whisper from within.”';
}
function idealWeightRange(cm){
  const m = cm/100; return [18.5*m*m, 24.9*m*m];
}


function bmrMifflin(gender, age, cm, kg){
  const s = gender === 'male' ? 5 : (gender === 'female' ? -161 : -78); 
  return 10*kg + 6.25*cm - 5*age + s;
}
function activityFactor(level){
  switch(level){
    case 'sedentary': return 1.2;
    case 'light': return 1.375;
    case 'moderate': return 1.55;
    case 'intense': return 1.725;
    default: return 1.2;
  }
}


function bodyFatUSNavy({gender, waist, neck, hip, height}){
  const wIn = inFromCm(waist);
  const nIn = inFromCm(neck);
  const hIn = inFromCm(height);
  const hipIn = hip ? inFromCm(hip) : null;
  if(gender === 'female'){
    if(!hipIn) return null;
    return 163.205*Math.log10(wIn + hipIn - nIn) - 97.684*Math.log10(hIn) - 78.387;
  } else {
    return 86.010*Math.log10(wIn - nIn) - 70.041*Math.log10(hIn) + 36.76;
  }
}
function bodyFatClass(gender, bf){
  if(gender === 'female'){
    if(bf < 10) return 'Below essential';
    if(bf <= 13) return 'Essential';
    if(bf <= 20) return 'Athlete';
    if(bf <= 24) return 'Fit';
    if(bf <= 31) return 'Average';
    return 'Obese';
  } else {
    if(bf < 2) return 'Below essential';
    if(bf <= 5) return 'Essential';
    if(bf <= 13) return 'Athlete';
    if(bf <= 17) return 'Fit';
    if(bf <= 24) return 'Average';
    return 'Obese';
  }
}

const weeklyChangeNeeded = (cur, target, weeks) => weeks>0 ? (target - cur)/weeks : null;
const kcalFromWeekly = kgPerWeek => (kgPerWeek * 7700) / 7;


function readCore(){
  const hu = document.querySelector('input[name="heightUnit"]:checked')?.value;
  const wu = document.querySelector('input[name="weightUnit"]:checked')?.value;

  let heightCm = null;
  if(hu === 'cm'){
    const h = valNum('heightCm'); if(h) heightCm = h;
  }else{
    const ft = valNum('heightFt') ?? 0;
    const inch = valNum('heightIn') ?? 0;
    const cm = cmFromFtIn(ft, inch);
    if(cm>0) heightCm = cm;
  }

  let weightKg = null;
  const w = valNum('weight');
  if(w!=null){ weightKg = wu === 'kg' ? w : kgFromLbs(w); }


  const gender = $('#gender')?.value || 'na';
  const age = valNum('age');
  const activity = $('#activity')?.value || 'sedentary';

  return { heightCm, weightKg, gender, age, activity };
}
function readCirc(){
  const unit = document.querySelector('input[name="circUnit"]:checked')?.value || 'cm';
  const waist = valNum('waist');
  const neck = valNum('neck');
  
  const hip1 = valNum('hip');
  const hip2 = valNum('hip2');
  const hip = hip1 ?? hip2 ?? null;

  const toCm = x => unit==='cm' ? x : (x!=null ? cmFromIn(x) : null);
  return { waist: waist!=null?toCm(waist):null, neck: neck!=null?toCm(neck):null, hip: hip!=null?toCm(hip):null };
}
function readGoal(){
  const targetWeight = valNum('targetWeight');
  const timeline = valNum('targetTimeline');
  const unit = $('#timelineUnit')?.value || 'weeks';
  const weeks = timeline ? (unit==='weeks' ? timeline : timeline*4.345) : null;
  return { targetWeight, weeks };
}


function setText(id, txt){ const el = document.getElementById(id); if(el) el.textContent = txt; }
function setChipCategory(cat){
  const chip = document.getElementById('bmiCategory');
  if(!chip) return;
  chip.textContent = cat === '—' ? '—' : cat;
  chip.className = 'chip';
  if(cat === 'Normal') chip.classList.add('green');
  else if(cat === 'Overweight' || cat === 'Underweight') chip.classList.add('amber');
  else if(cat === 'Obese') chip.classList.add('red');
}
function paintBmiBar(bmi){
  const bar = document.getElementById('bmiMeter');
  const pct = bmi==null ? 0 : clamp(((bmi - 10)/(40 - 10))*100, 0, 100);
  bar.style.width = `${pct}%`;
  if(bmi == null){ bar.style.background = 'linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)'; return; }
  if(bmi < 18.5){ bar.style.background = 'linear-gradient(90deg,#60a5fa,#22c55e)'; }
  else if(bmi < 25){ bar.style.background = 'linear-gradient(90deg,#22c55e,#34d399)'; }
  else if(bmi < 30){ bar.style.background = 'linear-gradient(90deg,#f59e0b,#f97316)'; }
  else { bar.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)'; }
}
function tipsForCategory(cat){
  if(cat === 'Underweight'){
    return [
      'Focus on nutrient-dense meals and resistance training.',
      'Add gentle snacks between meals; prioritize sleep for recovery.',
      'Track strength progress, not just scale shifts.'
    ];
  }
  if(cat === 'Normal'){
    return [
      'Maintain variety: protein, colorful plants, and fiber daily.',
      'Cycle intensities: easy movement most days, a few stronger sessions.',
      'Guard sleep and hydration—they anchor everything.'
    ];
  }
  if(cat === 'Overweight'){
    return [
      'Prioritize sleep, hydration, and sustainable movement.',
      'Aim for small, consistent calorie deficits; avoid extremes.',
      'Walk after meals; build a simple strength routine.'
    ];
  }
 
  return [
    'Start with breath, then steps. The journey is yours.',
    'Create gentle habits: short walks, protein at each meal.',
    'Work with professionals if possible; progress is personal.'
  ];
}


function calculate(){
  const core = readCore();
  const circ = readCirc();
  const goal = readGoal();

 
  if(core.heightCm && core.weightKg){
    const bmi = calcBMI(core.heightCm, core.weightKg);
    const cat = bmiCategory(bmi);
    setText('result', `BMI ${bmi.toFixed(1)} — ${cat}`);
  } else {
    setText('result', '—');
  }


  if(core.heightCm && core.weightKg){
    const bmi = calcBMI(core.heightCm, core.weightKg);
    const cat = bmiCategory(bmi);
    setText('bmiValue', bmi.toFixed(1));
    setChipCategory(cat);
    paintBmiBar(bmi);

    const [wMin,wMax] = idealWeightRange(core.heightCm);
    const idealTxt = `${wMin.toFixed(1)}–${wMax.toFixed(1)} kg`;
    setText('idealRange', idealTxt);
    setText('bmiWhisper', bmiWhisper(cat));
    setText('idealCopy', `Your body thrives between ${idealTxt}. The rest is nuance.`);

    
    const tips = tipsForCategory(cat);
    const ul = document.getElementById('tipsList');
    if(ul) ul.innerHTML = tips.map(t=>`<li>${t}</li>`).join('');
  }else{
    setText('bmiValue','—');
    setChipCategory('—');
    paintBmiBar(null);
    setText('idealRange','—');
    setText('bmiWhisper','“This isn’t a number—it’s a whisper from within.”');
    setText('idealCopy','Your body thrives between —. The rest is nuance.');
    const ul = document.getElementById('tipsList'); if(ul) ul.innerHTML = '<li>Enter height and weight to see tailored guidance.</li>';
  }

  
  if(core.age && core.heightCm && core.weightKg){
    const bmr = bmrMifflin(core.gender, core.age, core.heightCm, core.weightKg);
    const tdee = bmr * activityFactor(core.activity);
    setText('bmrValue', Math.round(bmr));
    setText('tdeeValue', Math.round(tdee));
    setText('bmrCopy', `To stay where you are, you need ~${Math.round(tdee)} kcal/day. Movement changes everything.`);
  }else{
    setText('bmrValue','—'); setText('tdeeValue','—');
    setText('bmrCopy','To stay where you are, you need — kcal/day. Movement changes everything.');
  }

  
  if(core.heightCm && circ.waist && circ.neck){
    const bf = bodyFatUSNavy({gender: core.gender, waist: circ.waist, neck: circ.neck, hip: circ.hip, height: core.heightCm});
    if(bf!=null && isFinite(bf) && bf>0 && bf<70){
      setText('bfPercent', `${bf.toFixed(1)}%`);
      const c = bodyFatClass(core.gender, bf);
      setText('bfClass', c);
      setText('bfCopy', `Your body fat is ${bf.toFixed(1)}% — a quiet balance of strength and softness.`);
    }else{
      setText('bfPercent','—'); setText('bfClass','—'); setText('bfCopy','Enter measurements for an estimate.');
    }
  }else{
    setText('bfPercent','—'); setText('bfClass','—'); setText('bfCopy','Enter measurements for an estimate.');
  }


  if(core.weightKg && goal.targetWeight && goal.weeks){
    const perWeek = weeklyChangeNeeded(core.weightKg, goal.targetWeight, goal.weeks);
    const kcalDay = kcalFromWeekly(perWeek);
    setText('weeklyChange', `${perWeek>=0?'+':''}${perWeek.toFixed(2)} kg/wk`);
    setText('dailyKcal', `${perWeek>=0?'+':''}${Math.round(kcalDay)} kcal/day`);
    setText('goalNote', `To reach ${goal.targetWeight}kg in ${goal.weeks.toFixed(1)} weeks, aim for ~${Math.abs(Math.round(kcalDay))} kcal ${perWeek<0?'deficit':'surplus'}/day. Small steps, steady climb.`);
  }else{
    setText('weeklyChange','—'); setText('dailyKcal','—'); setText('goalNote','Enter target weight and a timeline to see the path.');
  }
}


function mirrorFemaleHip(){
  const hipMain = document.getElementById('hip');
  const hipAddon = document.getElementById('hip2');
  if(!hipMain || !hipAddon) return;
  hipMain.addEventListener('input', ()=>{ if(hipAddon.value !== hipMain.value) hipAddon.value = hipMain.value; });
  hipAddon.addEventListener('input', ()=>{ if(hipMain.value !== hipAddon.value) hipMain.value = hipAddon.value; });
}
function applyGenderFromTabs(){
  const selected = document.querySelector('input[name="genderTab"]:checked')?.value || 'na';
  const genderSelect = document.getElementById('gender');
  if(genderSelect) genderSelect.value = selected;

  const femaleEls = document.querySelectorAll('.only-female');
  femaleEls.forEach(el => {
    if(selected === 'female') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}
function bindGenderTabs(){
  const radios = document.querySelectorAll('input[name="genderTab"]');
  radios.forEach(r => r.addEventListener('change', ()=>{
    applyGenderFromTabs();
    calculate();
  }));
  applyGenderFromTabs();
  mirrorFemaleHip();
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
  $$('input[name="heightUnit"]').forEach(r=>r.addEventListener('change', ()=>{ syncHeightUnit(); }));
  $$('input[name="weightUnit"]').forEach(r=>r.addEventListener('change', syncWeightPlaceholder));
  $('#calcBtn')?.addEventListener('click', calculate);
  $('#resetBtn')?.addEventListener('click', ()=> setTimeout(calculate,0));
}


document.addEventListener('DOMContentLoaded', ()=>{
  syncHeightUnit();
  syncWeightPlaceholder();
  bind();
  bindGenderTabs();
  calculate();
  setupCollapsibles();
});
