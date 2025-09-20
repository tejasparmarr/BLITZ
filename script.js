const passwordInput = document.getElementById("password");
const strengthMsg = document.getElementById("strength-message");
const togglePasswordBtn = document.getElementById("toggle-password");
const copyBtn = document.getElementById("copy-btn");
const generatedPwdInput = document.getElementById("generated-password");
const generateBtn = document.getElementById("generate-btn");
const strengthProgress = document.getElementById("strength-progress");

passwordInput.addEventListener("input", function () {
  const pwd = this.value;

  const lengthCriteria = document.getElementById("length-criteria");
  const uppercaseCriteria = document.getElementById("uppercase-criteria");
  const lowercaseCriteria = document.getElementById("lowercase-criteria");
  const numberCriteria = document.getElementById("number-criteria");
  const specialCriteria = document.getElementById("special-criteria");

  if (pwd.length === 0) {
  
    strengthMsg.textContent = "Strength: —";
    strengthMsg.className = "";
    strengthProgress.style.width = "0%";
    strengthProgress.style.backgroundColor = "transparent";

    [lengthCriteria, uppercaseCriteria, lowercaseCriteria, numberCriteria, specialCriteria].forEach(e => e.classList.remove("met"));
    return;
  }

  
  if (pwd.length >= 8) lengthCriteria.classList.add("met");
  else lengthCriteria.classList.remove("met");

  if (/[A-Z]/.test(pwd)) uppercaseCriteria.classList.add("met");
  else uppercaseCriteria.classList.remove("met");

  if (/[a-z]/.test(pwd)) lowercaseCriteria.classList.add("met");
  else lowercaseCriteria.classList.remove("met");

  if (/[0-9]/.test(pwd)) numberCriteria.classList.add("met");
  else numberCriteria.classList.remove("met");

  if (/[^A-Za-z0-9]/.test(pwd)) specialCriteria.classList.add("met");
  else specialCriteria.classList.remove("met");

 
  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^A-Za-z0-9]/.test(pwd)) strength++;

  let progressWidth = 0;
  let progressColor = "#ef4444"; 
  let strengthText = "Weak";
  let strengthClass = "weak";

  if (strength <= 2) {
    progressWidth = 20;
    progressColor = "#ef4444";
    strengthText = "Weak";
    strengthClass = "weak";
  } else if (strength === 3 || strength === 4) {
    progressWidth = 60;
    progressColor = "#facc15";
    strengthText = "Medium";
    strengthClass = "medium";
  } else {
    if (pwd.length >= 15) progressWidth = 100;
    else progressWidth = 90;
    progressColor = "#22c55e";
    strengthText = "Strong";
    strengthClass = "strong";
  }

  strengthMsg.textContent = "Strength: " + strengthText;
  strengthMsg.className = strengthClass;
  strengthProgress.style.backgroundColor = progressColor;

  
  strengthProgress.style.width = "0%";
  setTimeout(() => {
    strengthProgress.style.width = progressWidth + "%";
  }, 50);
});

togglePasswordBtn.addEventListener("click", function () {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  const svgPath = this.querySelector('svg path, svg circle');
  if(type === "text") {
    svgPath.style.stroke = '#3b82f6';
  } else {
    svgPath.style.stroke = '#a3c4f3';
  }
});

copyBtn.addEventListener("click", function () {
  if (generatedPwdInput.value) {
    generatedPwdInput.select();
    generatedPwdInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(generatedPwdInput.value).then(() => {
      copyBtn.textContent = "✅";
      setTimeout(() => (copyBtn.textContent = "📋"), 1500);
    });
  }
});

generateBtn.addEventListener("click", function () {
  const includeLetters = document.getElementById("include-letters").checked;
  const includeNumbers = document.getElementById("include-numbers").checked;
  const includeSpecial = document.getElementById("include-special").checked;

  let charset = "";

  if (includeLetters) charset += "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charset += "0123456789";
  if (includeSpecial) charset += "!@#$%^&*()";

  if (charset.length === 0) {
    alert("Please select at least one character type!");
    return;
  }

  let password = "";
  const length = 12;

  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  generatedPwdInput.value = password;
});
