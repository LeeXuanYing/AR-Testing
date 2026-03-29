let markerKP, markerDesc;
let cvReady = false;

// OpenCV ready
function onOpenCvReady() {
    cvReady = true;
    document.getElementById("status").innerText = "Loading marker...";
    loadMarker();
}

// Load marker image
function loadMarker() {
    let img = new Image();
    img.src = "marker1.png"; // PRINT THIS IMAGE

    img.onload = () => {
        let mat = cv.imread(img);

        let gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

        markerKP = new cv.KeyPointVector();
        markerDesc = new cv.Mat();

        let orb = new cv.ORB(1000, 1.2, 8);
        orb.detectAndCompute(gray, new cv.Mat(), markerKP, markerDesc);

        gray.delete(); mat.delete();

        startCamera();
    };
}

// Camera
let video = document.createElement("video");

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        requestAnimationFrame(track);
    });
}

// Hamming Distance
function hamming(a, b) {
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
        let xor = a[i] ^ b[i];
        while (xor) {
            xor &= xor - 1;
            dist++;
        }
    }
    return dist;
}

// Custom Matching
function match(desc1, desc2) {
    let matches = [];

    for (let i = 0; i < desc1.rows; i++) {
        let best = 9999, bestIdx = -1;
        let d1 = desc1.row(i).data;

        for (let j = 0; j < desc2.rows; j++) {
            let d2 = desc2.row(j).data;
            let dist = hamming(d1, d2);

            if (dist < best) {
                best = dist;
                bestIdx = j;
            }
        }

        if (best < 50) matches.push({ q: i, t: bestIdx });
    }

    return matches;
}

// Tracking loop
function track() {

    if (!cvReady || video.readyState !== 4) {
        requestAnimationFrame(track);
        return;
    }

    let canvas = document.getElementById("canvasAR");
    let ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    let frame = cv.imread(canvas);

    let gray = new cv.Mat();
    cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);

    let kp = new cv.KeyPointVector();
    let desc = new cv.Mat();

    let orb = new cv.ORB(1000, 1.2, 8);
    orb.detectAndCompute(gray, new cv.Mat(), kp, desc);

    let matches = match(markerDesc, desc);

    let x = 0, y = 0, count = 0;

    matches.forEach(m => {
        let pt = kp.get(m.t).pt;
        x += pt.x;
        y += pt.y;
        count++;
    });

    if (count > 15) {
        x /= count;
        y /= count;

        draw(ctx, x, y);
        moveCube(x, y, canvas.width, canvas.height);
    }

    frame.delete(); gray.delete(); kp.delete(); desc.delete();

    requestAnimationFrame(track);
}

// Draw tracking point
function draw(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "red";
    ctx.stroke();
}

// Move AR object
function moveCube(x, y, w, h) {
    let cube = document.querySelector("a-box");

    cube.setAttribute("visible", true);
    cube.setAttribute("position", {
        x: (x / w - 0.5),
        y: -(y / h - 0.5),
        z: -1
    });
}
