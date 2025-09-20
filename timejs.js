
function populateSelect(selectEl, start, end, padZero = false) {
  selectEl.innerHTML = '';
  for (let i = start; i <= end; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = padZero && i < 10 ? '0' + i : i;
    selectEl.appendChild(option);
  }
}


function populateMonths(selectEl) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  selectEl.innerHTML = '';
  months.forEach((month, idx) => {
    const option = document.createElement('option');
    option.value = idx + 1;
    option.textContent = month;
    selectEl.appendChild(option);
  });
}


function initSelects() {
  const daySelects = [document.getElementById('day1'), document.getElementById('day2')];
  const monthSelects = [document.getElementById('month1'), document.getElementById('month2')];
  const yearSelects = [document.getElementById('year1'), document.getElementById('year2')];
  const hourSelects = [document.getElementById('hour1'), document.getElementById('hour2')];
  const minuteSelects = [document.getElementById('minute1'), document.getElementById('minute2')];
  const secondSelects = [document.getElementById('second1'), document.getElementById('second2')];

  daySelects.forEach(sel => populateSelect(sel, 1, 31));
  monthSelects.forEach(sel => populateMonths(sel));

 
  const currentYear = new Date().getFullYear();
  const START_YEAR = 1900;
  const END_YEAR = currentYear + 20;
  yearSelects.forEach(sel => populateSelect(sel, START_YEAR, END_YEAR));

  hourSelects.forEach(sel => populateSelect(sel, 0, 23, true));
  minuteSelects.forEach(sel => populateSelect(sel, 0, 59, true));
  secondSelects.forEach(sel => populateSelect(sel, 0, 59, true));
}


function setSelects(section, dt) {
  const pad = n => n; 
  document.getElementById(`day${section}`).value = dt.getDate();
  document.getElementById(`month${section}`).value = dt.getMonth() + 1;
  document.getElementById(`year${section}`).value = dt.getFullYear();
  document.getElementById(`hour${section}`).value = dt.getHours();
  document.getElementById(`minute${section}`).value = dt.getMinutes();
  document.getElementById(`second${section}`).value = dt.getSeconds();
}


function isValidDate(year, month, day) {
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

function calculateDifference() {
  const d1 = {
    day: parseInt(document.getElementById('day1').value, 10),
    month: parseInt(document.getElementById('month1').value, 10),
    year: parseInt(document.getElementById('year1').value, 10),
    hour: parseInt(document.getElementById('hour1').value, 10),
    minute: parseInt(document.getElementById('minute1').value, 10),
    second: parseInt(document.getElementById('second1').value, 10),
  };
  const d2 = {
    day: parseInt(document.getElementById('day2').value, 10),
    month: parseInt(document.getElementById('month2').value, 10),
    year: parseInt(document.getElementById('year2').value, 10),
    hour: parseInt(document.getElementById('hour2').value, 10),
    minute: parseInt(document.getElementById('minute2').value, 10),
    second: parseInt(document.getElementById('second2').value, 10),
  };

  const resultEl = document.getElementById('result');


  for (const key in d1) {
    if (isNaN(d1[key])) {
      resultEl.textContent = 'Please fill all Date 1 fields.';
      return;
    }
  }
  for (const key in d2) {
    if (isNaN(d2[key])) {
      resultEl.textContent = 'Please fill all Date 2 fields.';
      return;
    }
  }

 
  if (!isValidDate(d1.year, d1.month, d1.day)) {
    resultEl.textContent = 'Date 1 is invalid. Please check the date values.';
    return;
  }
  if (!isValidDate(d2.year, d2.month, d2.day)) {
    resultEl.textContent = 'Date 2 is invalid. Please check the date values.';
    return;
  }

  
  const date1 = new Date(d1.year, d1.month - 1, d1.day, d1.hour, d1.minute, d1.second);
  const date2 = new Date(d2.year, d2.month - 1, d2.day, d2.hour, d2.minute, d2.second);

  if (date2 < date1) {
    resultEl.textContent = 'Date 2 must be after Date 1.';
    return;
  }

  
  let years = date2.getFullYear() - date1.getFullYear();
  let months = date2.getMonth() - date1.getMonth();
  let days = date2.getDate() - date1.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(date2.getFullYear(), date2.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

 
  const diffMs = date2 - date1;
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalSeconds / 3600;
  const totalDays = Math.floor(totalSeconds / 86400);
  const totalMonths = years * 12 + months + days / 30; 

 
  resultEl.innerHTML = `
    <div><strong>-:</strong> ${years} years, ${months} months, ${days} days</div>
    <div><strong>-:</strong> ${totalDays} days</div>
    <div><strong>-:</strong> ${totalMonths.toFixed(2)} months</div>
    <div><strong>-:</strong> ${totalHours.toFixed(2)} hours</div>
    <div><strong>-:</strong> ${totalMinutes.toFixed(2)} minutes</div>
    <div><strong>-:</strong> ${totalSeconds.toLocaleString()} seconds</div>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  initSelects();

  
  const now1Btn = document.getElementById('now1Btn');
  const now2Btn = document.getElementById('now2Btn');
  if (now1Btn) now1Btn.addEventListener('click', () => { setSelects(1, new Date()); });
  if (now2Btn) now2Btn.addEventListener('click', () => { setSelects(2, new Date()); });

  document.getElementById('calculateBtn').addEventListener('click', calculateDifference);
});
