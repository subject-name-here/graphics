// CONTROLS

const view = {
    x : 0.0,
    y : 0.0,
    z : 8.0
};

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


// MATRICES GETTERS

function getProjectionMatrix() {
    let gl = programInfo.gl;
    const fieldOfView = Math.PI / 4;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100000.0;

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    return projectionMatrix;
}

function getViewMatrix() {
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -view.z]);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, -view.x * 0.25);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, view.y * 0.25);
    return modelViewMatrix;
}