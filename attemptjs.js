
const $ = (id) => document.getElementById(id);

const els = {
  exam: $("exam"),
  serviceWrap: $("service-wrap"),
  service: $("service"),
  statepscWrap: $("statepsc-wrap"),
  statepsc: $("statepsc"),
  statepscValue: $("statepscValue"),
  day: $("dob-day"),
  month: $("dob-month"),
  year: $("dob-year"),
  gender: $("gender"),
  category: $("category"),
  education: $("education"),
  prevAttempts: $("prevAttempts"),
  lastYear: $("lastYear"),
  ugcType: $("ugcent-type"),
  dgcaCpl: $("dgcaCpl"),
  married: $("married"),
  taEmployed: $("taEmployed"),
  calc: $("calcBtn"),
  reset: $("resetBtn"),
  resVal: $("resultValue"),
  resLines: $("resultLines"),
  attemptsMade: $("attemptsMade"),
  attemptsLeft: $("attemptsLeft"),
  isEligible: $("isEligible"),
  nextWindow: $("nextWindow"),
  lastWindow: $("lastWindow"),
  lastReal: $("lastReal"),
  copyBtn: $("copyBtn"),
  saveBtn: $("saveTxtBtn"),
  resultsCard: $("results"),
};

function required(...nodes){ return nodes.every(n => !!n); }

(function initSelectors(){
  if (!required(els.day, els.month, els.year)) return;
  els.day.innerHTML = '<option value="">DD</option>';
  for (let d=1; d<=31; d++) els.day.add(new Option(String(d).padStart(2,'0'), d));
  els.month.innerHTML = '<option value="">MM</option>';
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  months.forEach((m,i)=> els.month.add(new Option(`${String(i+1).padStart(2,'0')} — ${m}`, i+1)));
  const today = new Date();
  els.year.innerHTML = '<option value="">YYYY</option>';
  for (let y=today.getFullYear(); y>=1960; y--) els.year.add(new Option(String(y), y));
})();

function makeDateFromParts(y, m, d) {
  if (!y || !m || !d) return null;
  const dt = new Date(Number(y), Number(m)-1, Number(d));
  if (isNaN(dt.getTime()) || dt.getFullYear() !== Number(y) || (dt.getMonth()+1) !== Number(m) || dt.getDate() !== Number(d)) return null;
  return dt;
}
function yearsBetween(d1, d2) {
  let years = d2.getFullYear() - d1.getFullYear();
  const m1 = d1.getMonth(), m2 = d2.getMonth();
  if (m2 < m1 || (m2 === m1 && d2.getDate() < d1.getDate())) years--;
  return years;
}
function addMonths(d, m) { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; }
function fmtMonthYear(d) { return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }); }
function bullet(text) {
  const wrap = document.createElement('div'); wrap.className = 'bullet';
  const dot = document.createElement('div'); dot.className = 'dot';
  const line = document.createElement('div'); line.className = 'line'; line.textContent = text;
  wrap.appendChild(dot); wrap.appendChild(line); return wrap;
}


const buildAnnual = (today=new Date(),years=15)=>Array.from({length:years},(_,i)=>addMonths(today,i*12));
const buildSemiAnnual = (today=new Date(),years=15)=>Array.from({length:years*2},(_,i)=>addMonths(today,i*6));


const SCHEMA = {
  CDS: {
    services: ["IMA","INA","AFA","OTA"],
    ages: { IMA:{min:19,max:24}, INA:{min:19,max:22}, AFA:{min:20,max:24,cplMax:26}, OTA:{min:19,max:25} },
    education: { IMA:["GRAD","ENGG","PG","OTHER"], INA:["ENGG"], AFA:["GRAD","ENGG","PG","OTHER","SCI_MATH_XII"], OTA:["GRAD","ENGG","PG","OTHER"] },
    marital: { IMA:{allowed:["Unmarried"]}, INA:{allowed:["Unmarried"]}, AFA:{allowed:["Unmarried"]}, OTA:{allowed:["Unmarried","Married"]} },
    cycles: [
      {name:"CDS I",writtenMonth:2, commenceMonth:1, commenceDay:1},
      {name:"CDS II",writtenMonth:9, commenceMonth:7, commenceDay:1}
    ],
  },
  AFCAT: {
    services:["Flying","Ground Duty (Tech/Non-Tech)"],
    ages:{"Flying":{min:20,max:24,cplMax:26},"Ground Duty (Tech/Non-Tech)":{min:20,max:26}}
  }

};

els.exam?.addEventListener("change", () => {
  const val = els.exam.value;
  if (els.serviceWrap) els.serviceWrap.classList.add("hidden");
  if (els.statepscWrap) els.statepscWrap.classList.add("hidden");
  if (els.service) els.service.innerHTML = "";
  const cplLabel = els.dgcaCpl ? els.dgcaCpl.closest("label") : null;
  if (cplLabel) cplLabel.style.display = "none";

  if (val === "CDS" && els.service && els.serviceWrap) {
    SCHEMA.CDS.services.forEach(s => els.service.add(new Option(s, s)));
    els.serviceWrap.classList.remove("hidden");
    if (cplLabel) cplLabel.style.display = "inline-flex";
  }
});


function buildCDSCyclesForward(today = new Date()){
  const out = []; const startY=today.getFullYear(), endY=startY+8;
  SCHEMA.CDS.cycles.forEach(cyc=>{
    for(let y=startY; y<=endY; y++){
      const written = new Date(y, cyc.writtenMonth-1, 1);
      if (written < today) continue;
      const commence = new Date(y+1, cyc.commenceMonth-1, cyc.commenceDay);
      out.push({cycle:cyc.name,year:y,written,commence});
    }
  });
  return out;
}
function maritalAllowedCDS(service, married){
  const rule = SCHEMA.CDS.marital[service];
  const flag = married ? "Married" : "Unmarried";
  return rule ? rule.allowed.includes(flag) : true;
}
function ageOkCDS(service, dob, refDate, ctx={}){
  const age = yearsBetween(dob, refDate);
  const band = SCHEMA.CDS.ages[service]; if (!band) return false;
  const max = (service==="AFA" && ctx.cpl) ? band.cplMax : band.max;
  return age>=band.min && age<=max;
}
function cdsCommencementDateFor(cycleName, examYear) {
  if (cycleName === "CDS I") return new Date(examYear + 1, 0, 1);
  if (cycleName === "CDS II") return new Date(examYear + 1, 6, 1);
  return null;
}
function latestStartingCycle(dob, service, cpl) {
  const band = SCHEMA.CDS.ages[service];
  const cap = (service === "AFA" && cpl) ? band.cplMax : band.max;
  const capYear = dob.getFullYear() + cap;
  const bdayThisYear = new Date(capYear, dob.getMonth(), dob.getDate());
  const cds2Comm = new Date(capYear, 6, 1);
  const cds1Comm = new Date(capYear, 0, 1);
  if (cds2Comm <= bdayThisYear) return { cycle: "CDS II", examYear: capYear - 1 };
  if (cds1Comm <= bdayThisYear) return { cycle: "CDS I", examYear: capYear - 1 };
  return { cycle: "CDS II", examYear: capYear - 2 };
}
function previousCycle(cycle, year) {
  if (cycle === "CDS II") return { cycle: "CDS I", examYear: year };
  return { cycle: "CDS II", examYear: year - 1 };
}
function findLastCDS(dob, edu, married, service, cpl) {

  const eduOK = {
    IMA:["GRAD","ENGG","PG","OTHER"],
    INA:["ENGG"],
    AFA:["GRAD","ENGG","PG","OTHER","SCI_MATH_XII"],
    OTA:["GRAD","ENGG","PG","OTHER"]
  }[service] || [];
  if (!eduOK.includes(edu)) return { found:false, reason:"Education qualification not met for this academy." };
  if (!maritalAllowedCDS(service, married)) return { found:false, reason:"Marital status not permitted for this academy." };

  let start = latestStartingCycle(dob, service, cpl);
  let steps = 0;
  while (steps < 24) {
    const comm = cdsCommencementDateFor(start.cycle, start.examYear);
    if (!comm) break;
    if (ageOkCDS(service, dob, comm, { cpl })) {
      return { found:true, cycle:start.cycle, year:start.examYear, commence:comm };
    }
    start = previousCycle(start.cycle, start.examYear);
    steps++;
  }
  return { found:false, reason:"No age-eligible cycle found in search horizon." };
}
function computeCDS(dob, edu, married, cpl, prevAttempts){
  const service = els.service?.value || "IMA";
  const result = findLastCDS(dob, edu, married, service, cpl);
  const attemptsMade = Math.max(0, Number(prevAttempts)||0);
  const lines = [`Preference: ${service}`];

  if (!result.found) {
    const forward = buildCDSCyclesForward(new Date());
    const next = forward.find(c => ageOkCDS(service, dob, c.commence, { cpl }) && (()=>{
      const eduOK = {
        IMA:["GRAD","ENGG","PG","OTHER"],
        INA:["ENGG"],
        AFA:["GRAD","ENGG","PG","OTHER","SCI_MATH_XII"],
        OTA:["GRAD","ENGG","PG","OTHER"]
      }[service] || [];
      return eduOK.includes(els.education?.value);
    })() && maritalAllowedCDS(service, !!els.married?.checked));
    return {
      attemptsMade,
      attemptsLeft: 0,
      eligibleNow: !!next,
      nextWindow: next ? `${next.cycle} ${next.year} → Commences ${fmtMonthYear(next.commence)}` : "None",
      lastWindow: "None",
      lastReal: "None",
      detailLines: [...lines, result.reason]
    };
  }

  const lastAttemptLabel = `${result.cycle} ${result.year}`;
  const forward = buildCDSCyclesForward(new Date());
  const upcomingElig = forward.filter(c => ageOkCDS(service, dob, c.commence, { cpl }) && (()=>{
    const eduOK = {
      IMA:["GRAD","ENGG","PG","OTHER"],
      INA:["ENGG"],
      AFA:["GRAD","ENGG","PG","OTHER","SCI_MATH_XII"],
      OTA:["GRAD","ENGG","PG","OTHER"]
    }[service] || [];
    return eduOK.includes(els.education?.value);
  })() && maritalAllowedCDS(service, !!els.married?.checked));

  const next = upcomingElig[0] || null;
  const attemptsLeft = Math.max(0, upcomingElig.length - attemptsMade);
  const lastWindow = `${result.cycle} ${result.year} → Commences ${fmtMonthYear(result.commence)}`;
  lines.push(`Last Attempt (age at commencement): ${lastAttemptLabel}`);
  if (next) lines.push(`Next Window: ${next.cycle} ${next.year} → Commences ${fmtMonthYear(next.commence)}`);
  lines.push(`Last Window: ${lastWindow}`);
  if(!!els.dgcaCpl?.checked && (service === 'AFA' || service === 'Flying')) lines.push('CPL relaxation considered.');

  return {
    attemptsMade,
    attemptsLeft,
    eligibleNow: !!next,
    nextWindow: next ? `${next.cycle} ${next.year} → Commences ${fmtMonthYear(next.commence)}` : "None",
    lastWindow: lastWindow,
    lastReal: lastAttemptLabel,
    detailLines: lines
  };
}

function eduRank(val){
  // Map UI values to an ordinal ranking for comparisons
  // Lowest to highest: 10th < 12th < XII(PCM) < GRAD < ENGG < PG < MPhil < PhD < LLB < LLM < OTHER (treated flexibly)
  // UI provides: XII, SCI_MATH_XII, GRAD, ENGG, PG, LLB, LLM, OTHER
  switch(val){
    case "10TH": return 1;
    case "XII": return 2;
    case "SCI_MATH_XII": return 3;
    case "GRAD": return 4;
    case "ENGG": return 5;
    case "PG": return 6;
    case "MPHIL": return 7;
    case "PHD": return 8;
    case "LLB": return 6; // treat law UG ~ grad+ specialization baseline
    case "LLM": return 7; // treat law PG ~ PG+
    case "OTHER": return 4; // neutral default to graduate-level for permissive checks
    default: return 0;
  }
}
function atLeastEdu(current, requiredKey){
  // requiredKey: "10TH" | "XII" | "GRAD" | "PG" etc.
  return eduRank(current) >= eduRank(requiredKey);
}

// -------------------------- CATEGORY RELAXATION HELPERS --------------------------
function upperAgeWithCategory(baseMax, catUpperExt){
  // catUpperExt map: { GEN:0, EWS:0, OBC:3, SC:5, ST:5, PwD:0 } as per per-exam rules
  return (cat)=> {
    const key = (cat||"GEN").toUpperCase();
    const add = (catUpperExt[key] ?? 0);
    return baseMax + add;
  };
}

function computeUPSC_CSE_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 21, baseMax = 32;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);


  const eduOK = atLeastEdu(edu, "GRAD"); // Bachelor's+
  const maritalOK = true; // no restriction
  const lines = [
    `Age band: 21–${effectiveMax} (with category relaxation applied)`,
    `Education: ${eduOK ? "Meets Bachelor's+ requirement" : "Requires Bachelor's or above"}`,
    `Marital: Allowed`
  ];

  // Build annual windows far enough to allow reaching 2037 if age permits
  const horizon = 30; // plan enough years
  const annuals = buildAnnual(new Date(), horizon);
  // Eligibility by age is checked at each reference month (month granularity)
  const eligWindows = annuals.filter(ref => {
    const age = yearsBetween(dob, ref);
    return age >= baseMin && age <= effectiveMax;
  });

  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;


  const allowedNow = !!next && eduOK && maritalOK;

  if (!eduOK) lines.push("Blocked: Education below Bachelor's.");
  if (!maritalOK) lines.push("Blocked: Marital status not permitted (but UPSC allows both).");


  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity, 
    eligibleNow: allowedNow,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeIBPS_PO(dob, edu, cat, married, prevAttempts){
  const baseMin = 20, baseMax = 30;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `Age band: 20–${effectiveMax} (with category relaxation)`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's+"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const age = yearsBetween(dob, ref);
    return age >= baseMin && age <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeNDA_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 16.5, baseMax = 19.5;
  const eduOK = atLeastEdu(edu, "XII");
  const maritalOK = !married; 

  const lines = [
    `Age band: strictly 16.5–19.5 (no relaxations)`,
    `Education: ${eduOK ? "≥ 10+2 OK" : "Requires 10+2"}`,
    `Marital: ${maritalOK ? "Unmarried confirmed" : "Must be Unmarried"}`
  ];

  const semi = buildSemiAnnual();
  const eligWindows = semi.filter(ref => {
    const age = yearsBetween(dob, ref);
    return age >= baseMin && age <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Math.max(0, eligWindows.length - (Number(prevAttempts)||0)),
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeCLAT(dob, edu, cat, married, prevAttempts){
  const eduOK = atLeastEdu(edu, "XII");
  const maritalOK = true;
  const lines = [
    `Age: No min or max limit`,
    `Education: ${eduOK ? "≥ 10+2 OK" : "Requires 10+2"}`,
    `Marital: Allowed`
  ];
  const annuals = buildAnnual();
  const next = annuals.find(d=> d>= new Date()) || null;
  const last = annuals[annuals.length-1] || null;
  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeLIC_AAO(dob, edu, cat, married, prevAttempts){
  const baseMin = 21, baseMax = 30;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `Age band: 21–${effectiveMax} (with category relaxation)`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's+"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeRRB_NTPC(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 36;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);


  const eduFor12th = atLeastEdu(edu, "XII");
  const eduForGrad = atLeastEdu(edu, "GRAD");
  const eduOK = eduFor12th || eduForGrad;
  const lines = [
    `Age band: 18–${effectiveMax} (with category relaxation)`,
    `Education: ${eduForGrad ? "Eligible for Graduate posts" : eduFor12th ? "Eligible for 12th-level posts" : "Requires at least 10+2"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}

function computeRBI_GRADE_B(dob, edu, cat, married, prevAttempts){
  const baseMin = 21, baseMax = 30;

  const catCap = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0})(cat);
 
  const isMPhil = (edu === "MPHIL");
  const isPhD = (edu === "PHD" || edu === "PhD"); 
  const eduCap = isPhD ? 34 : isMPhil ? 32 : baseMax;

  const effectiveMax = Math.max(catCap, eduCap);


  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${effectiveMax} (category/degree cap applied)`,
    `Education: ${eduOK ? "Bachelor's+(marks per post) / PG accepted" : "Requires Bachelor's minimum"}`,
    `Special cap: ${isPhD ? "Ph.D. → 34 max" : isMPhil ? "M.Phil → 32 max" : "—"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });

  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeCOAST_GUARD_NAVIK(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 22;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);

  const eduOK10 = eduRank(edu) >= eduRank("10TH") || atLeastEdu(edu, "XII");

  const lines = [
    `Age band: 18–${effectiveMax} (with category relaxation)`,
    `Education: ${eduOK10 ? "10th+/12th+ OK (PCM needed for GD)" : "Requires 10th+ (DB) or 12th PCM (GD)"}`,
    `Marital: Allowed`
  ];

  const semi = buildSemiAnnual();
  const eligWindows = semi.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });

  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Math.max(0, eligWindows.length - (Number(prevAttempts)||0)),
    eligibleNow: !!next && eduOK10,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeSSC_GD_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 23;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = eduRank(edu) >= eduRank("10TH") || atLeastEdu(edu, "XII");
  const maritalOK = true;

  const lines = [
    `Age band: 18–${effectiveMax} (with category relaxation)`,
    `Education: ${eduOK ? "≥ 10th OK" : "Requires 10th"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function renderResult(out){
  if (!required(els.resVal, els.resLines, els.attemptsMade, els.attemptsLeft, els.isEligible, els.nextWindow, els.lastWindow, els.lastReal)) return;
  els.attemptsMade.textContent = String(out.attemptsMade);
  els.attemptsLeft.textContent = (out.attemptsLeft===Infinity) ? "∞" : String(out.attemptsLeft);
  els.isEligible.textContent = out.eligibleNow ? "Yes" : "No";
  els.nextWindow.textContent = out.nextWindow || "—";
  els.lastWindow.textContent = out.lastWindow || "—";
  els.lastReal.textContent = out.lastReal || "—";
  els.resVal.textContent = out.eligibleNow ? "Eligible" : "Not Eligible";
  els.resLines.innerHTML = "";
  (out.detailLines||[]).forEach(line => {
    if (line) els.resLines.appendChild(bullet(line));
  });
}

function autoScrollToResults(){ els.resultsCard?.scrollIntoView({behavior:'smooth',block:'start'}); }

function computeAll(){
  const exam = els.exam?.value;
  const dob = makeDateFromParts(els.year?.value, els.month?.value, els.day?.value);
  if (!exam || !dob){
    if (els.resVal) els.resVal.textContent = "—";
    if (els.resLines){ els.resLines.innerHTML=""; els.resLines.appendChild(bullet("Select exam and enter full Date of Birth")); }
    autoScrollToResults(); return;
  }

  const edu = els.education?.value || "";
  const married = !!els.married?.checked;
  const cpl = !!els.dgcaCpl?.checked;
  const prevAttempts = els.prevAttempts?.value || 0;
  const cat = (els.category?.value || "GEN").toUpperCase();

  let out;
  switch (exam){
    case "CDS":
      out = computeCDS(dob, edu, married, cpl, prevAttempts);
      break;
    case "UPSC_CSE":
      out = computeUPSC_CSE_CUSTOM(dob, edu, cat, married, prevAttempts);
      break;
    case "NDA":
      out = computeNDA_CUSTOM(dob, edu, cat, married, prevAttempts);
      break;
    case "LAW_ENTRANCE":
      out = computeCLAT(dob, edu, cat, married, prevAttempts);
      break;
    case "SSC_GD":
      out = computeSSC_GD_CUSTOM(dob, edu, cat, married, prevAttempts);
      break;
    default:
      
      out = routeMoreExams(dob, edu, cat, married, prevAttempts);
      break;
  }

  renderResult(out);
  autoScrollToResults();
}

function routeMoreExams(dob, edu, cat, married, prevAttempts){
  const exam = els.exam?.value;
  if (exam === "IBPS_PO") return computeIBPS_PO(dob, edu, cat, married, prevAttempts);
  if (exam === "LIC_AAO") return computeLIC_AAO(dob, edu, cat, married, prevAttempts);
  if (exam === "RRB_NTPC") return computeRRB_NTPC(dob, edu, cat, married, prevAttempts);
  if (exam === "RBI_GRADE_B") return computeRBI_GRADE_B(dob, edu, cat, married, prevAttempts);
  if (exam === "POLICE" || exam === "STATE_PSC" || exam === "SSC_CGL" || exam==="SSC_CHSL" || exam==="UGC_NET" || exam==="AFCAT" || exam==="JEE" || exam==="CAPF" || exam==="TA" || exam==="OTHER" || exam==="UPSC_ESE" || exam==="UPSC_CSE") {
    
    return {
      attemptsMade: 0, attemptsLeft: 0, eligibleNow: false,
      nextWindow: "Will be added in Part 2", lastWindow: "—", lastReal: "—",
      detailLines: ["Logic continues in next part. Paste Part 2 right after this file content."]
    };
  }
  
  if (exam === "COAST_GUARD_NAVIK") return computeCOAST_GUARD_NAVIK(dob, edu, cat, married, prevAttempts);

  return { attemptsMade: 0, attemptsLeft: 0, eligibleNow: false, nextWindow: "—", lastWindow: "—", lastReal: "—", detailLines: ["Exam not recognized in router."] };
}

els.calc?.addEventListener("click", computeAll);
els.reset?.addEventListener("click", () => {
  $("elig-form")?.reset();
  if (els.service) els.service.innerHTML = "";
  if (els.serviceWrap) els.serviceWrap.classList.add("hidden");
  if (els.statepscWrap) els.statepscWrap.classList.add("hidden");
  if (els.statepscValue) els.statepscValue.value = "";
  document.querySelectorAll(".state-chip").forEach(b=>b.classList.remove("on"));
  if (els.resVal) els.resVal.textContent = "—";
  if (els.resLines) els.resLines.innerHTML = "";
  if (els.attemptsMade) els.attemptsMade.textContent = "0";
  if (els.attemptsLeft) els.attemptsLeft.textContent = "0";
  if (els.isEligible) els.isEligible.textContent = "—";
  if (els.nextWindow) els.nextWindow.textContent = "—";
  if (els.lastWindow) els.lastWindow.textContent = "—";
  if (els.lastReal) els.lastReal.textContent = "—";
});

els.copyBtn?.addEventListener("click", async ()=>{
  const lines = [...(els.resLines?.querySelectorAll(".line")||[])].map(n=>`• ${n.textContent}`);
  const text = [
    `Eligibility: ${els.resVal?.textContent||"—"}`,
    `Attempts Made: ${els.attemptsMade?.textContent||"0"}`,
    `Remaining Attempts: ${els.attemptsLeft?.textContent||"0"}`,
    `Eligible Now: ${els.isEligible?.textContent||"—"}`,
    `Next Window: ${els.nextWindow?.textContent||"—"}`,
    `Last Window: ${els.lastWindow?.textContent||"—"}`,
    `Last Attempt: ${els.lastReal?.textContent||"—"}`,
    ...lines
  ].join("\n");
  try { await navigator.clipboard?.writeText(text); } catch {}
});
els.saveBtn?.addEventListener("click", ()=>{
  const lines = [...(els.resLines?.querySelectorAll(".line")||[])].map(n=>`• ${n.textContent}`);
  const text = [
    `Eligibility: ${els.resVal?.textContent||"—"}`,
    `Attempts Made: ${els.attemptsMade?.textContent||"0"}`,
    `Remaining Attempts: ${els.attemptsLeft?.textContent||"0"}`,
    `Eligible Now: ${els.isEligible?.textContent||"—"}`,
    `Next Window: ${els.nextWindow?.textContent||"—"}`,
    `Last Window: ${els.lastWindow?.textContent||"—"}`,
    `Last Attempt: ${els.lastReal?.textContent||"—"}`,
    ...lines
  ].join("\n");
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eligibility.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

window.addEventListener("DOMContentLoaded", ()=>{
  const cplLabel = els.dgcaCpl ? els.dgcaCpl.closest("label") : null;
  if (cplLabel) cplLabel.style.display = "none";
});

function computeUPSC_ESE_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 21, baseMax = 30;
  const eduOK = (edu === "ENGG") || atLeastEdu(edu, "ENGG");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${baseMax} (no category relax specified)`,
    `Education: ${eduOK ? "Engineering OK" : "Requires Engineering degree"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeAFCAT_CUSTOM(dob, edu, cat, married, prevAttempts){
  const branch = (els.service?.value || "Flying"); 
  let min=20, max=24;
  const cpl = !!els.dgcaCpl?.checked;

  if (branch === "Flying"){
    max = cpl ? 26 : 24; 
  } else {
    
    max = 26;
  }

  
  let eduOK = false;
  if (branch === "Flying"){
    eduOK = ["SCI_MATH_XII","GRAD","ENGG","PG","OTHER"].includes(edu);
  } else {
    eduOK = ["GRAD","ENGG","PG","OTHER"].includes(edu);
  }

  const lines = [
    `Branch: ${branch}`,
    `Age band: ${min}–${max}${(branch==="Flying" && cpl) ? " (CPL relaxation)" : ""}`,
    `Education: ${eduOK ? "Meets branch threshold" : "Does not meet branch threshold"}`
  ];

  const semi = buildSemiAnnual();
  const eligWindows = semi.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= min && a <= max;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Math.max(0, eligWindows.length - (Number(prevAttempts)||0)),
    eligibleNow: !!next && eduOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeCAPF_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 20, baseMax = 25;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = atLeastEdu(edu, "GRAD"); 
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${effectiveMax} (category applied)`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeTA_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 42;
  const employed = !!els.taEmployed?.checked;
  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${baseMax}`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's"}`,
    `Employment: ${employed ? "Gainfully employed" : "Employment required"}`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  const ok = !!next && eduOK && employed && maritalOK;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: ok,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}

function computeUGC_NET_CUSTOM(dob, edu, cat, married, prevAttempts){
  const subtype = els.ugcType?.value || "AP"; 
  const eduOK = atLeastEdu(edu, "PG") || (edu === "LLM") || atLeastEdu(edu, "ENGG"); 
  const maritalOK = true;

  let baseMin = 21; 
  let baseMax = Infinity;
  if (subtype === "JRF"){
    baseMax = 30; 
  }

  const lines = [
    `Track: ${subtype}`,
    `Age band: ${baseMin}–${baseMax===Infinity?"No upper cap":baseMax}`,
    `Education: ${eduOK ? "PG/Equivalent OK" : "Requires PG or equivalent"}`
  ];

  const semi = buildSemiAnnual();
  const eligWindows = semi.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[semi.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Math.max(0, semi.length - (Number(prevAttempts)||0)),
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeJEE_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 17, baseMax = 25;
  const eduOK = atLeastEdu(edu, "XII") || (edu==="SCI_MATH_XII");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${baseMax} (planning window)`,
    `Education: ${eduOK ? "≥ 10+2 OK" : "Requires 10+2"}`,
    `Marital: Allowed`
  ];

  const semi = buildSemiAnnual();
  const eligWindows = semi.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Math.max(0, eligWindows.length - (Number(prevAttempts)||0)),
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeSSC_CGL_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 32;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${effectiveMax} (category applied)`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


function computeSSC_CHSL_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 27;
  const maxByCat = upperAgeWithCategory(baseMax, {GEN:0,EWS:0,OBC:3,SC:5,ST:5,PWD:0, PwD:0});
  const effectiveMax = maxByCat(cat);
  const eduOK = atLeastEdu(edu, "XII") || (edu==="SCI_MATH_XII");
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${effectiveMax} (category applied)`,
    `Education: ${eduOK ? "≥ 10+2 OK" : "Requires 10+2"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= effectiveMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}

function computePOLICE_CUSTOM(dob, edu, cat, married, prevAttempts){
  const stream = els.service?.value || "State Police SI";
  const bands = {
    "Delhi Police Constable": {min:18,max:25},
    "Delhi Police SI": {min:20,max:25},
    "State Police Constable": {min:18,max:25},
    "State Police SI": {min:20,max:28}
  };
  const band = bands[stream] || {min:18,max:28};
  const eduOK = atLeastEdu(edu, "XII") || atLeastEdu(edu, "GRAD"); 
  const maritalOK = true;

  const lines = [
    `Role: ${stream}`,
    `Age band: ${band.min}–${band.max}`,
    `Education: ${eduOK ? "Meets typical role threshold" : "Education may be insufficient for selected role"}`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= band.min && a <= band.max;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}

function computeSTATE_PSC_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 21, baseMax = 40;
  const state = els.statepscValue?.value || "";
  const eduOK = atLeastEdu(edu, "GRAD");
  const maritalOK = true;

  const lines = [
    `State: ${state || "Not selected"}`,
    `Age band: ${baseMin}–${baseMax}`,
    `Education: ${eduOK ? "Bachelor's+ OK" : "Requires Bachelor's"}`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  const ok = !!state && !!next && eduOK && maritalOK;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: ok,
    nextWindow: ok ? fmtMonthYear(next) : "None",
    lastWindow: ok ? (last ? fmtMonthYear(last) : "None") : "None",
    lastReal: ok ? (last ? fmtMonthYear(last) : "None") : "None",
    detailLines: lines
  };
}


function computeOTHER_CUSTOM(dob, edu, cat, married, prevAttempts){
  const baseMin = 18, baseMax = 40;
  const eduOK = true;
  const maritalOK = true;

  const lines = [
    `Age band: ${baseMin}–${baseMax}`,
    `Education: ${eduOK ? "Flexible" : "—"}`,
    `Marital: Allowed`
  ];

  const annuals = buildAnnual();
  const eligWindows = annuals.filter(ref => {
    const a = yearsBetween(dob, ref);
    return a >= baseMin && a <= baseMax;
  });
  const next = eligWindows.find(d=> d>= new Date()) || null;
  const last = eligWindows[eligWindows.length-1] || null;

  return {
    attemptsMade: Math.max(0, Number(prevAttempts)||0),
    attemptsLeft: Infinity,
    eligibleNow: !!next && eduOK && maritalOK,
    nextWindow: next ? fmtMonthYear(next) : "None",
    lastWindow: last ? fmtMonthYear(last) : "None",
    lastReal: last ? fmtMonthYear(last) : "None",
    detailLines: lines
  };
}


(function patchRouter(){
  const oldRoute = typeof routeMoreExams === "function" ? routeMoreExams : null;
  window.routeMoreExams = function(dob, edu, cat, married, prevAttempts){
    const exam = els.exam?.value;
    switch (exam){
      case "UPSC_ESE": return computeUPSC_ESE_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "AFCAT": return computeAFCAT_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "CAPF": return computeCAPF_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "TA": return computeTA_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "UGC_NET": return computeUGC_NET_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "JEE": return computeJEE_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "SSC_CGL": return computeSSC_CGL_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "SSC_CHSL": return computeSSC_CHSL_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "POLICE": return computePOLICE_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "STATE_PSC": return computeSTATE_PSC_CUSTOM(dob, edu, cat, married, prevAttempts);
      case "OTHER": return computeOTHER_CUSTOM(dob, edu, cat, married, prevAttempts);
      default:
        return oldRoute ? oldRoute(dob, edu, cat, married, prevAttempts)
                        : { attemptsMade:0, attemptsLeft:0, eligibleNow:false, nextWindow:"—", lastWindow:"—", lastReal:"—", detailLines:["Unhandled exam"] };
    }
  };
})();
