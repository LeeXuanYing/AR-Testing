let fileInput = document.getElementById("fileInput");
let generateBtn = document.getElementById("generateBtn");

let canvasInput = document.getElementById("canvasInput");
let ctxInput = canvasInput.getContext("2d");

let canvasGray = document.getElementById("canvasGray");
let ctxGray = canvasGray.getContext("2d");

let canvasORB = document.getElementById("canvasORB");
let ctxORB = canvasORB.getContext("2d");

let canvasMarker = document.getElementById("canvasMarker");
let ctxMarker = canvasMarker.getContext("2d");

let generateMarkerBtn = document.getElementById("generateMarkerBtn");
let saveMarkerBtn = document.getElementById("saveMarkerBtn");

let src, orbKeypoints, orbDescriptors;

// Load image
fileInput.addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let img = new Image();
    img.onload = () => {
        canvasInput.width = img.width;
        canvasInput.height = img.height;
        ctxInput.drawImage(img, 0, 0);
        src = cv.imread(canvasInput);
    };
    img.src = URL.createObjectURL(file);
});

// Generate ORB features
function generateORB() {
    if (!src) return alert("Please upload an image first!");

    // Grayscale
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.imshow(canvasGray, gray);

    // ORB Feature Extraction
    orbKeypoints = new cv.KeyPointVector();
    orbDescriptors = new cv.Mat();
    let orb = new cv.ORB(1500, 1.2, 12);
    orb.setFastThreshold(8);
    orb.setEdgeThreshold(5);
    orb.detectAndCompute(gray, new cv.Mat(), orbKeypoints, orbDescriptors);

    // Draw ORB keypoints
    let orbOutput = new cv.Mat();
    cv.drawKeypoints(
        src,
        orbKeypoints,
        orbOutput,
        [0, 255, 0, 255],
        cv.DrawMatchesFlags_DRAW_RICH_KEYPOINTS
    );
    cv.imshow(canvasORB, orbOutput);

    gray.delete();
    orbOutput.delete();
}

// CUSTOM TRACKING FUNCTION
// Tracks marker based on ORB keypoints between two frames
let prevGray = null;
let prevKeypoints = [];

function startTracking(video) {
    const cap = new cv.VideoCapture(video);

    function processFrame() {
        let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame);

        // Convert to gray
        let gray = new cv.Mat();
        cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);

        // Detect ORB keypoints for current frame
        let keypoints = new cv.KeyPointVector();
        let descriptors = new cv.Mat();
        let orb = new cv.ORB(1500, 1.2, 12);
        orb.setFastThreshold(8);
        orb.setEdgeThreshold(5);
        orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

        // CUSTOM TRACKING: find closest keypoints to prev ORB keypoints
        let trackedPoints = [];
        if (prevKeypoints.length > 0) {
            for (let i = 0; i < prevKeypoints.length; i++) {
                let pk = prevKeypoints[i];
                let closest = null;
                let minDist = 1e6;
                for (let j = 0; j < keypoints.size(); j++) {
                    let ck = keypoints.get(j).pt;
                    let dx = pk.x - ck.x;
                    let dy = pk.y - ck.y;
                    let dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        closest = ck;
                    }
                }
                if (closest) trackedPoints.push(closest);
            }
        }

        // Draw tracked points
        for (let i = 0; i < trackedPoints.length; i++) {
            let pt = trackedPoints[i];
            cv.circle(frame, new cv.Point(pt.x, pt.y), 4, [255, 0, 0, 255], 2);
        }

        cv.imshow(canvasMarker, frame);

        // Save current frame keypoints for next frame
        prevKeypoints = [];
        for (let i = 0; i < keypoints.size(); i++) {
            prevKeypoints.push(keypoints.get(i).pt);
        }

        frame.delete();
        gray.delete();
        keypoints.delete();
        descriptors.delete();

        requestAnimationFrame(processFrame);
    }

    processFrame();
}

// Generate marker from ORB keypoints
generateBtn.addEventListener("click", generateORB);

generateMarkerBtn.addEventListener("click", () => {
    if (!canvasORB.width) return alert("Generate ORB features first!");
    canvasMarker.width = canvasORB.width;
    canvasMarker.height = canvasORB.height;
    ctxMarker.drawImage(canvasORB, 0, 0);
});

// Save marker
saveMarkerBtn.addEventListener("click", () => {
    let link = document.createElement("a");
    link.download = "marker.png";
    link.href = canvasMarker.toDataURL();
    link.click();
});

// OpenCV ready
function onOpenCvReady() {
    document.getElementById("status").innerText = "OpenCV loaded.";
}

