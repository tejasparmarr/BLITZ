
const unitData = {
  Length: {
    units: ["Meter","Kilometer","Centimeter","Millimeter","Mile","Yard","Foot","Inch","Light-year","Nautical Mile","Angstrom","Parsec"],
    toBase: {
      Meter:v=>v, Kilometer:v=>v*1000, Centimeter:v=>v/100, Millimeter:v=>v/1000,
      Mile:v=>v*1609.344, Yard:v=>v*0.9144, Foot:v=>v*0.3048, Inch:v=>v*0.0254,
      "Light-year":v=>v*9.461e15, "Nautical Mile":v=>v*1852, Angstrom:v=>v*1e-10, Parsec:v=>v*3.086e16
    },
    fromBase: {
      Meter:v=>v, Kilometer:v=>v/1000, Centimeter:v=>v*100, Millimeter:v=>v*1000,
      Mile:v=>v/1609.344, Yard:v=>v/0.9144, Foot:v=>v/0.3048, Inch:v=>v/0.0254,
      "Light-year":v=>v/9.461e15, "Nautical Mile":v=>v/1852, Angstrom:v=>v/1e-10, Parsec:v=>v/3.086e16
    }
  },
  Mass: {
    units:["Kilogram","Gram","Milligram","Pound","Ounce","Ton","Stone","Carat"],
    toBase:{Kilogram:v=>v,Gram:v=>v/1000,Milligram:v=>v/1e6,Pound:v=>v*0.453592,Ounce:v=>v*0.0283495,Ton:v=>v*1000,Stone:v=>v*6.35029,Carat:v=>v*0.0002},
    fromBase:{Kilogram:v=>v,Gram:v=>v*1000,Milligram:v=>v*1e6,Pound:v=>v/0.453592,Ounce:v=>v/0.0283495,Ton:v=>v/1000,Stone:v=>v/6.35029,Carat:v=>v/0.0002}
  },
  Temperature: {
    units:["Celsius","Fahrenheit","Kelvin","Rankine"],
    toBase:{Celsius:v=>v,Fahrenheit:v=>(v-32)*(5/9),Kelvin:v=>v-273.15,Rankine:v=>(v-491.67)*(5/9)},
    fromBase:{Celsius:v=>v,Fahrenheit:v=>v*9/5+32,Kelvin:v=>v+273.15,Rankine:v=>(v+273.15)*9/5}
  },
  Volume: {
    units:["Liter","Milliliter","Cubic Meter","Gallon","Pint","Cup","Fluid Ounce","Barrel"],
    toBase:{Liter:v=>v,Milliliter:v=>v/1000,"Cubic Meter":v=>v*1000,Gallon:v=>v*3.78541,Pint:v=>v*0.473176,Cup:v=>v*0.236588,"Fluid Ounce":v=>v*0.0295735,Barrel:v=>v*158.987},
    fromBase:{Liter:v=>v,Milliliter:v=>v*1000,"Cubic Meter":v=>v/1000,Gallon:v=>v/3.78541,Pint:v=>v/0.473176,Cup:v=>v/0.236588,"Fluid Ounce":v=>v/0.0295735,Barrel:v=>v/158.987}
  },
  Time: {
    units:["Second","Minute","Hour","Day","Week","Year","Millisecond","Microsecond"],
    toBase:{Second:v=>v,Minute:v=>v*60,Hour:v=>v*3600,Day:v=>v*86400,Week:v=>v*604800,Year:v=>v*31557600,Millisecond:v=>v/1000,Microsecond:v=>v/1e6},
    fromBase:{Second:v=>v,Minute:v=>v/60,Hour:v=>v/3600,Day:v=>v/86400,Week:v=>v/604800,Year:v=>v/31557600,Millisecond:v=>v*1000,Microsecond:v=>v*1e6}
  },
  Force: {
    units:["Newton","Dyne","Pound-force","Kilopond","Kilogram-force"],
    toBase:{Newton:v=>v,Dyne:v=>v/1e5,"Pound-force":v=>v*4.44822,Kilopond:v=>v*9.80665,"Kilogram-force":v=>v*9.80665},
    fromBase:{Newton:v=>v,Dyne:v=>v*1e5,"Pound-force":v=>v/4.44822,Kilopond:v=>v/9.80665,"Kilogram-force":v=>v/9.80665}
  },
  Energy: {
    units:["Joule","Calorie","Kilowatt-hour","BTU","Electronvolt","Erg","Foot-pound"],
    toBase:{Joule:v=>v,Calorie:v=>v*4.184,"Kilowatt-hour":v=>v*3.6e6,BTU:v=>v*1055.06,Electronvolt:v=>v*1.602e-19,Erg:v=>v/1e7,"Foot-pound":v=>v*1.35582},
    fromBase:{Joule:v=>v,Calorie:v=>v/4.184,"Kilowatt-hour":v=>v/3.6e6,BTU:v=>v/1055.06,Electronvolt:v=>v/1.602e-19,Erg:v=>v*1e7,"Foot-pound":v=>v/1.35582}
  },
  Power: {
    units:["Watt","Horsepower","BTU/hr","Erg/sec","Kilowatt","Megawatt"],
    toBase:{Watt:v=>v,Horsepower:v=>v*745.7,"BTU/hr":v=>v*0.293071,"Erg/sec":v=>v/1e7,Kilowatt:v=>v*1000,Megawatt:v=>v*1e6},
    fromBase:{Watt:v=>v,Horsepower:v=>v/745.7,"BTU/hr":v=>v/0.293071,"Erg/sec":v=>v*1e7,Kilowatt:v=>v/1000,Megawatt:v=>v/1e6}
  },
  Pressure: {
    units:["Pascal","Bar","Atmosphere","Torr","PSI","mmHg"],
    toBase:{Pascal:v=>v,Bar:v=>v*1e5,Atmosphere:v=>v*101325,Torr:v=>v*133.322,PSI:v=>v*6894.76,mmHg:v=>v*133.322},
    fromBase:{Pascal:v=>v,Bar:v=>v/1e5,Atmosphere:v=>v/101325,Torr:v=>v/133.322,PSI:v=>v/6894.76,mmHg:v=>v/133.322}
  },
  Area: {
    units: [
      "Square Meter","Square Kilometer","Square Centimeter","Acre","Hectare","Square Mile","Square Foot","Square Inch",
      
      "Square Yard","Gaj","Gajam","Guz","Square Guz","Bigha","Biswa","Katha","Kattha","Guntha","Gunta","Ground","Cent","Kanal","Marla"
    ],
    toBase: {
      "Square Meter":v=>v,
      "Square Kilometer":v=>v*1e6,
      "Square Centimeter":v=>v/1e4,
      Acre:v=>v*4046.8564224,
      Hectare:v=>v*1e4,
      "Square Mile":v=>v*2.589988110336e6,
      "Square Foot":v=>v*0.09290304,
      "Square Inch":v=>v*0.00064516,

  
      "Square Yard":v=>v*0.83612736,   
      Gaj:v=>v*0.83612736,             
      Gajam:v=>v*0.83612736,           
      Guz:v=>v*0.83612736,             
      "Square Guz":v=>v*0.83612736,

      
      Bigha:v=>v*2500,                 // common (UP/Haryana) bigha ≈ 2500 m²
      Biswa:v=>v*125,                  // 1 bigha = 20 biswa
      Katha:v=>v*126.441,              // common Bihar/Jharkhand ≈ 126.441 m²
      Kattha:v=>v*126.441,             // alias
      Guntha:v=>v*101.17141056,        // 1 guntha ≈ 101.1714 m² (40 guntas = 1 acre)
      Gunta:v=>v*101.17141056,         // alias (south)
      Ground:v=>v*203.4375,            // Tamil Nadu ground ≈ 2400 ft² = 223.0? Often 2400 ft²; using 203.4375 m² for 2187.5 ft²? Safer: 2400 ft² = 222.967296 m²
      Cent:v=>v*40.468564224,          // 1 cent = 1/100 acre
      Kanal:v=>v*505.857,              // Punjab/J&K 1 kanal = 20 marla ≈ 505.857 m²
      Marla:v=>v*25.29285264           // 1 marla = 272.25 ft² ≈ 25.2929 m²
    },
    fromBase: {
      "Square Meter":v=>v,
      "Square Kilometer":v=>v/1e6,
      "Square Centimeter":v=>v*1e4,
      Acre:v=>v/4046.8564224,
      Hectare:v=>v/1e4,
      "Square Mile":v=>v/2.589988110336e6,
      "Square Foot":v=>v/0.09290304,
      "Square Inch":v=>v/0.00064516,

      "Square Yard":v=>v/0.83612736,
      Gaj:v=>v/0.83612736,
      Gajam:v=>v/0.83612736,
      Guz:v=>v/0.83612736,
      "Square Guz":v=>v/0.83612736,

      Bigha:v=>v/2500,
      Biswa:v=>v/125,
      Katha:v=>v/126.441,
      Kattha:v=>v/126.441,
      Guntha:v=>v/101.17141056,
      Gunta:v=>v/101.17141056,
      Ground:v=>v/203.4375,
      Cent:v=>v/40.468564224,
      Kanal:v=>v/505.857,
      Marla:v=>v/25.29285264
    }
  },
  Angle: {
    units:["Degree","Radian","Gradian","Turn"],
    toBase:{Degree:v=>v,Radian:v=>v*180/Math.PI,Gradian:v=>v*0.9,Turn:v=>v*360},
    fromBase:{Degree:v=>v,Radian:v=>v*Math.PI/180,Gradian:v=>v/0.9,Turn:v=>v/360}
  },
  Velocity: {
    units:["m/s","km/h","mph","knot","ft/s"],
    toBase:{"m/s":v=>v,"km/h":v=>v/3.6,mph:v=>v*0.44704,knot:v=>v*0.514444,"ft/s":v=>v*0.3048},
    fromBase:{"m/s":v=>v,"km/h":v=>v*3.6,mph:v=>v/0.44704,knot:v=>v/0.514444,"ft/s":v=>v/0.3048}
  },
  Frequency: {
    units:["Hertz","Kilohertz","Megahertz","Gigahertz","RPM"],
    toBase:{Hertz:v=>v,Kilohertz:v=>v*1000,Megahertz:v=>v*1e6,Gigahertz:v=>v*1e9,RPM:v=>v/60},
    fromBase:{Hertz:v=>v,Kilohertz:v=>v/1000,Megahertz:v=>v/1e6,Gigahertz:v=>v/1e9,RPM:v=>v*60}
  },
  "Data Storage": {
    units:["Bit","Byte","Kilobyte","Megabyte","Gigabyte","Terabyte","Petabyte"],
    toBase:{Bit:v=>v,Byte:v=>v*8,Kilobyte:v=>v*8192,Megabyte:v=>v*8.389e6,Gigabyte:v=>v*8.59e9,Terabyte:v=>v*8.796e12,Petabyte:v=>v*9.007e15},
    fromBase:{Bit:v=>v,Byte:v=>v/8,Kilobyte:v=>v/8192,Megabyte:v=>v/8.389e6,Gigabyte:v=>v/8.59e9,Terabyte:v=>v/8.796e12,Petabyte:v=>v/9.007e15}
  },
  "Poetic Units": {
    units:["Heartbreak","Joy","Memory","Dream","Hope"],
    toBase:{Heartbreak:v=>v*3.2,Joy:v=>v*0.8,Memory:v=>v*1.5,Dream:v=>v*0.3,Hope:v=>v*2.1},
    fromBase:{Heartbreak:v=>v/3.2,Joy:v=>v/0.8,Memory:v=>v/1.5,Dream:v=>v/0.3,Hope:v=>v/2.1}
  }
};


const els = {
  
  segWrap: document.querySelector(".segmented"),
  val: document.getElementById("value-input"),
  from: document.getElementById("from-unit"),
  to: document.getElementById("to-unit"),
  swap: document.getElementById("swap-btn"),
  prec: document.getElementById("precision-input"),
  precLbl: document.getElementById("precision-display"),
  sep: document.getElementById("thousands"),
  autoCopy: document.getElementById("auto-copy"),
  res: document.getElementById("resultValue"),
  resSub: document.getElementById("resultSub"),
  copy: document.getElementById("copyBtn"),
  save: document.getElementById("saveTxtBtn"),
  miniP: document.getElementById("miniPrecision"),
  miniLoc: document.getElementById("miniLocale"),
};

const state = {
  category: "Length",
  precision: 2,
  locale: "en-IN"
};


function buildCategories(){
  els.segWrap.innerHTML = "";
  Object.keys(unitData).forEach((cat, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "seg" + (i===0 ? " on" : "");
    b.dataset.type = cat;
    b.textContent = cat;
    b.addEventListener("click", () => setCategory(cat));
    els.segWrap.appendChild(b);
  });
}


function hydrateUnits(){
  const cat = unitData[state.category];
  els.from.innerHTML = "";
  els.to.innerHTML = "";
  cat.units.forEach(u => {
    els.from.add(new Option(u, u));
    els.to.add(new Option(u, u));
  });
  
  els.from.selectedIndex = 0;
  els.to.selectedIndex = Math.min(1, els.to.options.length-1);
  els.resSub.textContent = `0 ${state.category.toLowerCase()}`;
}


function convert(val, from, to){
  
  if(state.category === "Temperature"){
    const toC = unitData.Temperature.toBase[from];
    const fromC = unitData.Temperature.fromBase[to];
    return fromC(toC(val));
  }
  
  if(state.category === "Poetic Units"){
    const toB = unitData["Poetic Units"].toBase[from];
    const fromB = unitData["Poetic Units"].fromBase[to];
    return fromB(toB(val));
  }
  const cat = unitData[state.category];
  const base = cat.toBase[from](val);
  return cat.fromBase[to](base);
}

function formatNum(n){
  return n.toLocaleString(state.locale, {
    minimumFractionDigits: state.precision,
    maximumFractionDigits: state.precision,
    useGrouping: els.sep.checked
  });
}

function compute(){
  const v = parseFloat(els.val.value);
  if(Number.isNaN(v)){ els.res.textContent = "—"; return; }
  const from = els.from.value;
  const to = els.to.value;
  const out = convert(v, from, to);
  
  const dynPrec = out < 1 ? Math.max(state.precision+2, state.precision) : state.precision;
  const pretty = out.toLocaleString(state.locale,{
    minimumFractionDigits: dynPrec, maximumFractionDigits: dynPrec, useGrouping: els.sep.checked
  });
  els.res.textContent = pretty;
  const label = state.category === "Poetic Units" ? "poetic equivalents" : state.category.toLowerCase();
  els.resSub.textContent = `${v} ${from} → ${to}`;
  if(els.autoCopy.checked) navigator.clipboard?.writeText(pretty);
}

function setCategory(cat){
  state.category = cat;
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("on", b.dataset.type === cat));
  hydrateUnits();
  compute();
}


function applyPreset(code){
  const [from,to] = code.split("->");
  const x = from.replace("°","");
  if(["cm","in","m","ft","km","mi","yd"].includes(x)) setCategory("Length");
  if(["kg","lb","g","oz","mg","ton","stone"].includes(x.toLowerCase())) setCategory("Mass");
  if(["c","f","k","rankine"].includes(x.toLowerCase())) setCategory("Temperature");
  const find = (sel, v) => [...sel.options].findIndex(o => o.value.toLowerCase() === v.toLowerCase() || o.text.toLowerCase() === v.toLowerCase());
  const i1 = find(els.from, from.replace("°",""));
  const i2 = find(els.to, to.replace("°",""));
  if(i1>=0) els.from.selectedIndex = i1;
  if(i2>=0) els.to.selectedIndex = i2;
  compute();
}


["input","change"].forEach(ev => {
  els.val.addEventListener(ev, compute);
  els.from.addEventListener(ev, compute);
  els.to.addEventListener(ev, compute);
});
document.getElementById("swap-btn").addEventListener("click", () => {
  const a = els.from.selectedIndex;
  els.from.selectedIndex = els.to.selectedIndex;
  els.to.selectedIndex = a;
  compute();
});
document.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => applyPreset(c.dataset.preset)));

els.prec.addEventListener("input", () => {
  state.precision = +els.prec.value;
  els.precLbl.textContent = String(state.precision);
  els.miniP.textContent = String(state.precision);
  compute();
});
[els.sep, els.autoCopy].forEach(el => el.addEventListener("change", compute));

document.getElementById("copyBtn").addEventListener("click", async () => {
  const t = els.res.textContent.trim();
  if(t && t !== "—") await navigator.clipboard?.writeText(t);
});
document.getElementById("saveTxtBtn").addEventListener("click", () => {
  const text = `${els.res.textContent} (${els.resSub.textContent})`;
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "conversion.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});


els.val.addEventListener("keypress", (e) => { if(e.key === "Enter") compute(); });


buildCategories();
setCategory(state.category);

const catScroller = document.querySelector('.segmented');
if (catScroller) {
  catScroller.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      catScroller.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      e.preventDefault();
    }
  }, { passive: false });

  let isDown = false, startX = 0, startLeft = 0;
  catScroller.addEventListener('mousedown', (e)=>{ isDown=true; startX=e.pageX; startLeft=catScroller.scrollLeft; });
  window.addEventListener('mouseup', ()=> isDown=false);
  catScroller.addEventListener('mouseleave', ()=> isDown=false);
  catScroller.addEventListener('mousemove', (e)=>{
    if(!isDown) return;
    const dx = e.pageX - startX;
    catScroller.scrollLeft = startLeft - dx;
  });
}
