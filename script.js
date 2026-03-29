let fileInput = document.getElementById("fileInput");
let generateBtn = document.getElementById("generateBtn");

let canvasInput = document.getElementById("canvasInput");
let canvasGray = document.getElementById("canvasGray");
let canvasORB = document.getElementById("canvasORB");

let saveGrayBtn = document.getElementById("saveGrayBtn");
let saveORBBtn = document.getElementById("saveORBBtn");

let src;

// Load image
fileInput.addEventListener("change", (e) => {
    let file = e.target.files[0];
    let img = new Image();

    img.onload = () => {
        canvasInput.width = img.width;
        canvasInput.height = img.height;
        canvasInput.getContext("2d").drawImage(img, 0, 0);
        src = cv.imread(canvasInput);
    };

    img.src = URL.createObjectURL(file);
});

// Generate ORB Features
generateBtn.addEventListener("click", () => {
    if (!src) return alert("Upload image first");

    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.imshow(canvasGray, gray);

    let kp = new cv.KeyPointVector();
    let desc = new cv.Mat();

    let orb = new cv.ORB(1000, 1.2, 8);
    orb.detectAndCompute(gray, new cv.Mat(), kp, desc);

    let out = new cv.Mat();
    cv.drawKeypoints(src, kp, out, [255,0,0,255]);

    cv.imshow(canvasORB, out);

    gray.delete(); kp.delete(); desc.delete(); out.delete();
});

// Save
saveGrayBtn.onclick = () => download(canvasGray, "gray.png");
saveORBBtn.onclick = () => download(canvasORB, "orb.png");

function download(canvas, name) {
    let link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL();
    link.click();
}

function onOpenCvReady() {
    document.getElementById("status").innerText = "OpenCV Ready";
}
