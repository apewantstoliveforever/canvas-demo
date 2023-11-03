window.onload = function () {
    var canvas = new fabric.Canvas('canvas');

    var selectedCircles = [];
    var selectedShapes = [];
    var connectingLines = []; // Danh sách chứa các đường nối
    var connectingInProgress = false;
    var addConnectOn = false;


    const fileUpload = document.getElementById('fileUpload');

    fileUpload.addEventListener('change', function () {
        const file = fileUpload.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const dataURL = e.target.result;

                fabric.Image.fromURL(dataURL, function (img) {
                    // Center the image on the canvas
                    img.set({
                        left: canvas.width / 2,
                        top: canvas.height / 2
                    });
                    canvas.add(img);
                    canvas.renderAll();
                });
            };

            reader.readAsDataURL(file);
        }
    });

    // Function to check if a connecting line already exists
    function hasConnectingLine(obj1, obj2) {
        for (var i = 0; i < connectingLines.length; i++) {
            var line = connectingLines[i];
            if (
                (line.obj1 === obj1 && line.obj2 === obj2) ||
                (line.obj1 === obj2 && line.obj2 === obj1)
            ) {
                return true;
            }
        }
        return false;
    }

    // Function to check if object exists in connectingLines
    function checkObjectInConnectingLines(obj) {
        for (var i = 0; i < connectingLines.length; i++) {
            var line = connectingLines[i];
            if (line.obj1 === obj || line.obj2 === obj) {
                return true;
            }
        }
        return false;
    }
    //Function return other object in connectingLines
    function getOtherObjectInConnectingLines(obj) {
        for (var i = 0; i < connectingLines.length; i++) {
            var line = connectingLines[i];
            if (line.obj1 === obj) {
                return line.obj2;
            }
            else if (line.obj2 === obj) {
                return line.obj1;
            }
        }
    }


    // Function to calculate the center point of a circle
    function getCircleCenter(circle) {
        return {
            left: circle.left + circle.radius,
            top: circle.top + circle.radius
        };
    }

    function getObjectCenter(obj) {
        if (!obj.left || !obj.top) {
            return
        }
        return {
            left: obj.left + obj.width / 2,
            top: obj.top + obj.height / 2
        };
    }

    function checkOverlap(obj1, obj2) {
        const isOverlapping = obj1.intersectsWithObject(obj2);
        if (isOverlapping) {
            console.log('overlapping')
        }
        else {
            console.log('not overlapping')
        }
        //change color
        obj1.set('fill', isOverlapping ? 'green' : 'blue');
        return isOverlapping;
    }

    // Function to create a line between the centers of two circles
    function connectCircles(circle1, circle2) {
        var center1 = getCircleCenter(circle1);
        var center2 = getCircleCenter(circle2);
            var line = new fabric.Line([center1.left, center1.top, center2.left, center2.top], {
                fill: 'red',
                stroke: 'red',
                strokeWidth: 5,
                selectable: false,
                hoverCursor: "default",
                evented: false
            });
            connectingLines.push({
                obj1: circle1,
                obj2: circle2,
                line: line
            });
            canvas.add(line);
            console.log(connectingLines)
            circle1.on('moving', function () {
                updateLine(line, circle1, '1');
            });
            circle2.on('moving', function () {
                updateLine(line, circle2, '2');
            });
            circle1.on('scaling', function () {
                updateLine(line, circle1, '1');
            });
            circle2.on('scaling', function () {
                updateLine(line, circle2, '2');
            });
    }

    //connect 2 shapes
    function connectShapes(shape1, shape2) {
        var center1 = getObjectCenter(shape1);
        var center2 = getObjectCenter(shape2);
        var line = new fabric.Line([center1.left, center1.top, center2.left, center2.top], {
            fill: 'red',
            stroke: 'red',
            strokeWidth: 5,
            selectable: false,
            hoverCursor: "default",
            evented: false
        });
        connectingLines.push({
            obj1: shape1,
            obj2: shape2,
            line: line
        });
        canvas.add(line);
        console.log('connectingLines', connectingLines)
        shape1.on('moving', function () {
            updateLine(line, shape1, '1');
        });
        shape2.on('moving', function () {
            updateLine(line, shape2, '2');
        });
        shape1.on('scaling', function () {
            updateLine(line, shape1, '1');
        });
        shape2.on('scaling', function () {
            updateLine(line, shape2, '2');
        });
    }

    function updateLine(line, obj, point) {
        const centerPoint = obj.getCenterPoint();
        line.set({
            [`x${point}`]: centerPoint.x,
            [`y${point}`]: centerPoint.y
        });
    }

    // Event handler when a circle is clicked
    canvas.on('mouse:down', function (options) {

        if (options.target && options.target.type === 'circle') {
            //if in selectedCirclees already, remove it
            if (selectedCircles.includes(options.target)) {
                selectedCircles.splice(selectedCircles.indexOf(options.target), 1);
            }
            else {
                selectedCircles.push(options.target);
            }
            if (selectedCircles.length === 2) {
                if (!hasConnectingLine(selectedCircles[0], selectedCircles[1]) && selectedCircles[0] !== selectedCircles[1] && addConnectOn) {
                    connectCircles(selectedCircles[0], selectedCircles[1]);
                }
                selectedCircles = [];

            }
        }
        else {
            //if in selectedShapes already, remove it
            if (selectedShapes.includes(options.target)) {
                selectedShapes.splice(selectedShapes.indexOf(options.target), 1);
            }
            else {
                selectedShapes.push(options.target);
            }
            if (selectedShapes.length === 2) {
                if (!hasConnectingLine(selectedShapes[0], selectedShapes[1]) && selectedShapes[0] !== selectedShapes[1] && addConnectOn) {
                    connectShapes(selectedShapes[0], selectedShapes[1]);
                }
                selectedShapes = [];
            }
        }
    });
    canvas.on('object:moving', function (e) {
        //check if object in connectingLines
        const obj = e.target;
        if (checkObjectInConnectingLines(obj)) {
            const otherObj = getOtherObjectInConnectingLines(obj);
            checkOverlap(obj, otherObj);
        }
    });

    canvas.on('object:over', function (e) {
        if (connectingInProgress) {
            console.log('connectingInProgress')
            var obj1 = selectedCircles[0] || selectedShapes[0];
            var obj2 = e.target;

            if (obj1 && obj2 && !hasConnectingLine(obj1, obj2)) {
                // Hiển thị thông báo
                alert("Connected!");
                console.log('not connected')

                connectingInProgress = false;
            }
            else {
                console.log('connected')
            }
        }
    });


    // Function to add a circle to the canvas
    function addCircle() {
        var circle = new fabric.Circle({
            left: Math.random() * canvas.width,
            top: Math.random() * canvas.height,
            radius: 30,
            fill: 'blue',
            selectable: true
        });
        canvas.add(circle);
    }
    function unSelect() {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }

    function addConnect() {
        addConnectOn = !addConnectOn;
        console.log(addConnectOn)
    }


    // Button click event to add circles
    document.getElementById('unSelectButton').addEventListener('click', unSelect);
    document.getElementById('addCircleButton').addEventListener('click', addCircle);
    document.getElementById('addConnectButton').addEventListener('click', addConnect);
    canvas.setWidth(800); // Set the width to 800
    canvas.setHeight(600); // Set the height to 600
}