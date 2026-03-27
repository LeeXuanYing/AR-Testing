let cvReady = false;
let src = null;

// OpenCV ready
function onOpenCvReady() {
    console.log("OpenCV loaded");
    cvReady = true;
    document.getElementById("status").innerText = "OpenCV Ready! Upload an image.";
}

// Upload image
document.getElementById("fileInput").addEventListener("change", function (e) {
    let file = e.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (event) {
        let img = new Image();
        img.onload = function () {
            let canvas = document.getElementById("canvasOutput");
            canvas.width = img.width;
            canvas.height = img.height;

            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            try {
                if (src) src.delete();
                src = cv.imread(canvas);

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

// Generate features + switch 3D object
document.getElementById("generateBtn").addEventListener("click", function () {
    if (!cvReady) {
        alert("OpenCV is still loading...");
        return;
    }

    if (!src) {
        alert("Upload an image first!");
        return;
    }

    // Grayscale
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // ORB features
    let keypoints = new cv.KeyPointVector();
    let descriptors = new cv.Mat();
    let orb = new cv.ORB();
    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    let keypointCount = keypoints.size();

    // Draw features
    let output = new cv.Mat();
    cv.drawKeypoints(gray, keypoints, output, [255, 0, 0, 255]);
    cv.imshow("canvasOutput", output);

    // 🔥 Switch AR objects
    let cube = document.querySelector("#cube");
    let sphere = document.querySelector("#sphere");
    let cone = document.querySelector("#cone");

    cube.setAttribute("visible", false);
    sphere.setAttribute("visible", false);
    cone.setAttribute("visible", false);

    if (keypointCount < 100) {
        cube.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Few features (${keypointCount}) → Cube`;
    } else if (keypointCount < 300) {
        sphere.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Medium features (${keypointCount}) → Sphere`;
    } else {
        cone.setAttribute("visible", true);
        document.getElementById("status").innerText =
            `Many features (${keypointCount}) → Cone`;
    }

    // Cleanup
    gray.delete();
    keypoints.delete();
    descriptors.delete();
    output.delete();
});
