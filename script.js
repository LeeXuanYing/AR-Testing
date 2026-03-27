let cvReady = false;
let src = null;

// OpenCV ready
function onOpenCvReady() {
    console.log("OpenCV loaded");
    cvReady = true;
    document.getElementById("status").innerText =
        "OpenCV Ready! Upload an image.";
}

// Upload image
document.getElementById("fileInput").addEventListener("change", function (e) {
    let file = e.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (event) {
        let img = new Image();

        img.onload = function () {

            // ORIGINAL IMAGE
            let inputCanvas = document.getElementById("canvasInput");
            inputCanvas.width = img.width;
            inputCanvas.height = img.height;
            let ctx = inputCanvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // Prepare processing canvas
            let tempCanvas = document.createElement("canvas");
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCanvas.getContext("2d").drawImage(img, 0, 0);

            try {
                if (src) src.delete();
                src = cv.imread(tempCanvas);

                document.getElementById("status").innerText =
                    "Image loaded! Click Generate Features.";
            } catch (err) {
                console.error(err);
                document.getElementById("status").innerText =
                    "Error loading image.";
            }
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

// Generate features
document.getElementById("generateBtn").addEventListener("click", function () {

    if (!cvReady) {
        alert("OpenCV still loading...");
        return;
    }

    if (!src) {
        alert("Upload an image first!");
        return;
    }

    // GRAYSCALE
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.imshow("canvasGray", gray);

    // ORB FEATURE DETECTION
    let keypoints = new cv.KeyPointVector();
    let descriptors = new cv.Mat();
    let orb = new cv.ORB();

    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    // DRAW FEATURES
    let output = new cv.Mat();
    cv.drawKeypoints(src, keypoints, output, [255, 0, 0, 255]);
    cv.imshow("canvasOutput", output);

    let count = keypoints.size();

    // AR OBJECT SWITCH
    let cube = document.getElementById("cube");
    let sphere = document.getElementById("sphere");
    let cone = document.getElementById("cone");

    cube.setAttribute("visible", false);
    sphere.setAttribute("visible", false);
    cone.setAttribute("visible", false);

    if (count < 100) {
        cube.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Few features (${count}) → Cube`;
    } else if (count < 300) {
        sphere.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Medium features (${count}) → Sphere`;
    } else {
        cone.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Many features (${count}) → Cone`;
    }

    // CLEANUP
    gray.delete();
    keypoints.delete();
    descriptors.delete();
    output.delete();
});
