let cvReady = false;
let src = null;
let previousPoints = [];

// OpenCV ready
function onOpenCvReady() {
    cvReady = true;
    document.getElementById("status").innerText = "OpenCV Ready!";
}

// Wait until OpenCV loads
if (typeof cv !== "undefined") {
    onOpenCvReady();
} else {
    document.addEventListener("opencvready", onOpenCvReady);
}

// Load image
document.getElementById("imageInput").addEventListener("change", function (e) {

    let file = e.target.files[0];
    let img = new Image();

    img.onload = function () {

        let canvas = document.getElementById("canvasInput");
        let ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        src = cv.imread(canvas);
    };

    img.src = URL.createObjectURL(file);
});

// Grayscale
function processGray() {

    if (!cvReady || !src) return;

    let gray = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.imshow("canvasGray", gray);

    gray.delete();
}

// 🔥 CUSTOM FEATURE TRACKING
function customFeatureTracking() {

    let canvas = document.getElementById("canvasInput");
    let ctx = canvas.getContext("2d");

    let width = canvas.width;
    let height = canvas.height;

    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    let currentPoints = [];
    let threshold = 40;

    // Detect features
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {

            let i = (y * width + x) * 4;

            let center = data[i];
            let right = data[i + 4];
            let bottom = data[i + width * 4];

            if (Math.abs(center - right) > threshold &&
                Math.abs(center - bottom) > threshold) {

                currentPoints.push({ x, y });
            }
        }
    }

    let outCanvas = document.getElementById("canvasOutput");
    let outCtx = outCanvas.getContext("2d");

    outCanvas.width = width;
    outCanvas.height = height;
    outCtx.putImageData(imageData, 0, 0);

    // 🔥 TRACKING
    previousPoints.forEach(prev => {

        let closest = null;
        let minDist = 20;

        currentPoints.forEach(curr => {
            let dx = prev.x - curr.x;
            let dy = prev.y - curr.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closest = curr;
            }
        });

        if (closest) {
            outCtx.beginPath();
            outCtx.moveTo(prev.x, prev.y);
            outCtx.lineTo(closest.x, closest.y);
            outCtx.strokeStyle = "lime";
            outCtx.stroke();
        }
    });

    // Draw points
    currentPoints.forEach(p => {
        outCtx.beginPath();
        outCtx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        outCtx.fillStyle = "red";
        outCtx.fill();
    });

    previousPoints = currentPoints;

    document.getElementById("status").innerText =
        "Custom tracking running!";
}

// Save canvas
function saveImage(canvasId, filename) {
    let canvas = document.getElementById(canvasId);
    let link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}

// 🔥 Marker Generator
document.getElementById("generateMarkerBtn").addEventListener("click", function () {

    if (!src) {
        alert("Upload image first!");
        return;
    }

    let gray = new cv.Mat();
    let edges = new cv.Mat();
    let marker = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(gray, gray);
    cv.Canny(gray, edges, 50, 150);
    cv.addWeighted(gray, 0.7, edges, 0.3, 0, marker);

    cv.imshow("canvasMarker", marker);

    gray.delete();
    edges.delete();
    marker.delete();

    document.getElementById("status").innerText =
        "Feature marker generated!";
});

// Save marker
document.getElementById("saveMarkerBtn").addEventListener("click", function () {
    saveImage("canvasMarker", "marker.png");
});
