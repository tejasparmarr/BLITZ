const { jsPDF } = window.jspdf;


const qrCodeContainer = document.getElementById("qrcode");
const qrShadow = document.getElementById("qr-shadow");
const textInput = document.getElementById("text-input");
const sizeInput = document.getElementById("size-input");
const sizeDisplay = document.getElementById("size-display");
const errorCorrection = document.getElementById("error-correction");
const fgColorInput = document.getElementById("fg-color");
const bgColorInput = document.getElementById("bg-color");
const transparentBgCheckbox = document.getElementById("transparent-bg");
const dotStyleSelect = document.getElementById("dot-style");
const eyeStyleSelect = document.getElementById("eye-style");
const logoUpload = document.getElementById("logo-upload");
const downloadFormatSelect = document.getElementById("download-format");
const downloadBtn = document.getElementById("download-btn");

let logoDataUrl = null;


const qrCode = new QRCodeStyling({
  width: parseInt(sizeInput.value),
  height: parseInt(sizeInput.value),
  data: "",
  image: "",
  dotsOptions: {
    color: fgColorInput.value,
    type: dotStyleSelect.value,
  },
  backgroundOptions: {
    color: bgColorInput.value,
  },
  cornersSquareOptions: {
    type: eyeStyleSelect.value,
    color: fgColorInput.value,
  },
  cornersDotOptions: {
    type: eyeStyleSelect.value,
    color: fgColorInput.value,
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 5,
    imageSize: 0.15,
  },
  qrOptions: {
    errorCorrectionLevel: errorCorrection.value,
  },
});


qrCode.append(qrCodeContainer);


function updateSizeDisplay() {
  sizeDisplay.textContent = `${sizeInput.value}px`;
}


function updateQRCode() {
  updateSizeDisplay();

  const size = parseInt(sizeInput.value);
  const transparent = transparentBgCheckbox.checked;
  const bgColor = transparent ? "transparent" : bgColorInput.value;
  const eyeType = ["square", "circle", "diamond"].includes(eyeStyleSelect.value)
    ? eyeStyleSelect.value
    : "square";

  qrCode.update({
    width: size,
    height: size,
    data: textInput.value,
    image: logoDataUrl || "",
    dotsOptions: {
      color: fgColorInput.value,
      type: dotStyleSelect.value,
    },
    backgroundOptions: {
      color: bgColor,
    },
    cornersSquareOptions: {
      type: eyeType,
      color: fgColorInput.value,
    },
    cornersDotOptions: {
      type: eyeType,
      color: fgColorInput.value,
    },
    qrOptions: {
      errorCorrectionLevel: errorCorrection.value,
    },
  });

  setTimeout(updateQRShadow, 150);
}


logoUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    logoDataUrl = null;
    updateQRCode();
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    logoDataUrl = event.target.result;
    updateQRCode();
  };
  reader.readAsDataURL(file);
});


[
  textInput,
  sizeInput,
  errorCorrection,
  fgColorInput,
  bgColorInput,
  transparentBgCheckbox,
  dotStyleSelect,
  eyeStyleSelect,
].forEach(el => {
  el.addEventListener("input", updateQRCode);
});


updateQRCode();


downloadBtn.addEventListener("click", async () => {
  let format = (downloadFormatSelect.value || "").toLowerCase();
  if (format === "odf") format = "pdf"; 

  try {
    if (format === "png") {
      const blob = await qrCode.getRawData("png");
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "qr_code.png");
      URL.revokeObjectURL(url);

    } else if (format === "jpg" || format === "jpeg") {
      
      const pngBlob = await qrCode.getRawData("png");
      const pngUrl = URL.createObjectURL(pngBlob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((jpgBlob) => {
          const jpgUrl = URL.createObjectURL(jpgBlob);
          triggerDownload(jpgUrl, "qr_code.jpg");
          URL.revokeObjectURL(jpgUrl);
          URL.revokeObjectURL(pngUrl);
        }, "image/jpeg", 0.92);
      };
      img.onerror = () => {
        URL.revokeObjectURL(pngUrl);
        alert("Failed to create JPG from QR.");
      };
      img.src = pngUrl;

    } else if (format === "svg") {
      const svg = await qrCode.getRawData("svg");
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "qr_code.svg");
      URL.revokeObjectURL(url);

    } else if (format === "pdf") {
      
      const pngBlob = await qrCode.getRawData("png");
      const reader = new FileReader();
      reader.onload = function(event) {
        const imgData = event.target.result; 
        const width = qrCode.options.width || 512;
        const height = qrCode.options.height || 512;

        const pdf = new jsPDF({
          orientation: width >= height ? "landscape" : "portrait",
          unit: "pt",
          format: [width, height]
        });

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("qr_code.pdf");
      };
      reader.readAsDataURL(pngBlob);

    } else {
      alert("Unknown format selected.");
    }
  } catch (err) {
    alert("Error downloading QR code: " + err);
    console.error(err);
  }
});


function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


function updateQRShadow() {
  if (!qrShadow) return;

  const qrRect = qrCodeContainer.getBoundingClientRect();
  const shadowPadding = 30;

  let width = qrRect.width - shadowPadding;
  let height = qrRect.height - shadowPadding;

  width = Math.max(180, width);
  height = Math.max(180, height);

  qrShadow.style.width = `${width}px`;
  qrShadow.style.height = `${height}px`;
}
