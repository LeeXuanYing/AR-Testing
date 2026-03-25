let src = null;

document.getElementById('uploadImage').addEventListener('change', function(e) {

    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.getElementById('canvasOutput');
            let ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            src = cv.imread(canvas);
        }
        img.src = event.target.result;
    }

    reader.readAsDataURL(file);
});

function generateFeatures() {

    if (!src) {
        alert("Upload image first!");
        return;
    }

    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    let keypoints = new cv.KeyPointVector();
    let descriptors = new cv.Mat();

    let orb = new cv.ORB();
    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    let output = new cv.Mat();
    cv.drawKeypoints(gray, keypoints, output, [255, 0, 0, 255]);

    cv.imshow('canvasOutput', output);

    gray.delete();
    keypoints.delete();
    descriptors.delete();
    output.delete();
}

function saveImage() {
    let canvas = document.getElementById("canvasOutput");
    let link = document.createElement("a");
    link.download = "features.png";
    link.href = canvas.toDataURL();
    link.click();
}


// 🔥 Change AR Object
document.getElementById("objectSelector").addEventListener("change", function() {

    let obj = document.getElementById("arObject");
    let value = this.value;

    if (value === "box") {
        obj.setAttribute("geometry", "primitive: box");
        obj.setAttribute("material", "color: red");
    }

    if (value === "sphere") {
        obj.setAttribute("geometry", "primitive: sphere");
        obj.setAttribute("material", "color: blue");
    }

    if (value === "cone") {
        obj.setAttribute("geometry", "primitive: cone");
        obj.setAttribute("material", "color: green");
    }
});
