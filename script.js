let cvReady = false;
let src = null;

// OpenCV loaded callback
function onOpenCvReady() {
    console.log("OpenCV loaded");
    cvReady = true;
    document.getElementById("status").innerText = "OpenCV Ready! Upload an image.";
}

// Handle image upload
document.getElementById("fileInput").addEventListener("change", function(e) {
    let file = e.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            // Use the visible canvas
            let canvas = document.getElementById('canvasOutput');
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Read image into OpenCV
            try {
                if (src) src.delete();
                src = cv.imread(canvas); // src now contains the image
                document.getElementById("status").innerText = "Image loaded! Click Generate Features.";
            } catch (err) {
                console.error(err);
                document.getElementById("status").innerText = "Failed to load image. Try a smaller file.";
            }
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Generate Features button
document.getElementById("generateBtn").addEventListener("click", function() {
    if (!cvReady) {
        alert("OpenCV is still loading, please wait...");
        return;
    }

    if (!src) {
        alert("Upload an image first!");
        return;
    }

    // Convert to grayscale
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Detect keypoints with ORB
    let keypoints = new cv.KeyPointVector();
    let descriptors = new cv.Mat();
    let orb = new cv.ORB();
    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    // Draw keypoints on canvas
    let output = new cv.Mat();
    cv.drawKeypoints(gray, keypoints, output, [255, 0, 0, 255]);
    cv.imshow('canvasOutput', output);

    // Clean up
    gray.delete();
    keypoints.delete();
    descriptors.delete();
    output.delete();

    document.getElementById("status").innerText = `Features generated: ${keypoints.size()} keypoints`;
});
