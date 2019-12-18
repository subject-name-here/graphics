// CONTROLS

const view = {
    x : 0.0,
    y : 0.0,
    z : 1.0
};

function getViewMatrix() {
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, -0.1, -view.z]);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, -view.x * 0.25);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, view.y * 0.25);
    return modelViewMatrix;
}

function setPosition(z) {
    if (z < 0) {
        view.z = -z * 2;
    }
}

function initMouseCallback(canvas) {
    let scope = this;

    function onMouseWheel(event) {
        event.preventDefault();

        let delta = 1 + Math.abs(event.deltaY * 0.02);
        if (event.deltaY > 0){
            delta = 1 / delta;
        }
        view.z *= delta;
    }

    function onMouseDown(event) {
        scope.isKeyPressed = true;
        scope.mousePosition = eventToCoords(event);
    }

    function onMouseMove(event) {
        if (!scope.isKeyPressed) {
            return;
        }
        event.preventDefault();
        let curMousePosition = eventToCoords(event);
        let prevMousePosition = scope.mousePosition;
        let deltaX = prevMousePosition[0] - curMousePosition[0];
        let deltaY = prevMousePosition[1] - curMousePosition[1];
        view.x += deltaX / canvas.width;
        view.y -= deltaY / canvas.height;
    }

    function onMouseUp() {
        scope.isKeyPressed = false;
    }

    canvas.addEventListener('wheel', onMouseWheel, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
}

function eventToCoords(event) {
    let rect = programInfo.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return [x, y]
}