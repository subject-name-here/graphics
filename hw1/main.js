const baseState = {
    h : 3,
    w : 4,
    canvasWidth : 1024,
    canvasHeight : 768
};

const movementState = {
    xOffset : 0,
    yOffset : 0,
    zoom : 1
};

const programInfo = {};

const settings = {};

main();

function main() {
    const canvas = document.querySelector('#canvas');
    canvas.width = baseState.canvasWidth;
    canvas.height = baseState.canvasHeight;
    programInfo.canvas = canvas;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }
    programInfo.gl = gl;

    programInfo.shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    gl.useProgram(programInfo.shaderProgram);

    const vertexPosition = gl.getAttribLocation(programInfo.shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    programInfo.vertexPosition = vertexPosition;

    const plotPosition = gl.getAttribLocation(programInfo.shaderProgram, "aPlotPosition");
    gl.enableVertexAttribArray(plotPosition);
    programInfo.plotPosition = plotPosition;

    settings.iterations = gl.getUniformLocation(programInfo.shaderProgram, "iterations");
    settings.za = gl.getUniformLocation(programInfo.shaderProgram, "za");
    settings.zb = gl.getUniformLocation(programInfo.shaderProgram, "zb");
    settings.infinity = gl.getUniformLocation(programInfo.shaderProgram, "infinity");

    function render() {
        drawScene();
        requestAnimationFrame(render);
    }
    initBuffer();
    createTexture();
    initMouseCallback(canvas);
    updateSettings();
    requestAnimationFrame(render);
}

function initBuffer() {
    const gl = programInfo.gl;
    programInfo.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.vertexPositionBuffer);
    const vertices = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function drawScene() {
    const gl = programInfo.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.vertexPositionBuffer);
    gl.vertexAttribPointer(programInfo.vertexPosition, 2, gl.FLOAT, false, 0, 0);

    let positions = [];
    const baseVertices = [
        2, 1.5,
        -2, 1.5,
        2, -1.5,
        -2, -1.5,
    ];
    baseVertices.forEach((val, i) => {
        let offset = i % 2 ? movementState.yOffset : movementState.xOffset;
        positions.push(val / movementState.zoom + offset);
    });

    let plotPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plotPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(programInfo.plotPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(plotPositionBuffer);
}

// CONTROLS

function initMouseCallback(canvas) {
    let scope = this;

    function onMouseWheel(event) {
        event.preventDefault();

        let delta = 1 + Math.abs(event.deltaY * 0.02);
        if (event.deltaY > 0){
            delta = 1 / delta;
        }
        let pos = eventToFracCoords(event);
        let oldZoom = movementState.zoom;
        movementState.zoom *= delta;
        movementState.xOffset += pos[0] / oldZoom - pos[0] / movementState.zoom;
        movementState.yOffset -= pos[1] / oldZoom - pos[1] / movementState.zoom;
    }

    function onMouseDown(event) {
        scope.isKeyPressed = true;
        scope.mousePosition = eventToFracCoords(event);
    }

    function onMouseMove(event) {
        if (!scope.isKeyPressed) {
            return;
        }
        event.preventDefault();

        let curMousePosition = eventToFracCoords(event);
        let prevMousePosition = scope.mousePosition;
        let deltaX = prevMousePosition[0] - curMousePosition[0];
        let deltaY = prevMousePosition[1] - curMousePosition[1];
        movementState.xOffset += deltaX / movementState.zoom;
        movementState.yOffset -= deltaY / movementState.zoom;

        scope.mousePosition = curMousePosition
    }

    function onMouseUp() {
        scope.isKeyPressed = false;
    }

    canvas.addEventListener('wheel', onMouseWheel, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
}

function eventToFracCoords(event) {
    let rect = programInfo.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    let fracX = -baseState.w / 2 + x / baseState.canvasWidth * baseState.w;
    let fracY = -baseState.h / 2 + y / baseState.canvasHeight * baseState.h;
    return [fracX, fracY]
}

// SETTINGS

function updateSettings() {
    let iterations = document.getElementById("iterations").value;
    let za = document.getElementById("za").value;
    let zb = document.getElementById("zb").value;
    let infinity = document.getElementById("infinity").value;

    const gl = programInfo.gl;
    gl.uniform1i(settings.iterations, iterations);
    gl.uniform1f(settings.za, za);
    gl.uniform1f(settings.zb, zb);
    gl.uniform1f(settings.infinity, infinity);

    drawScene();
}

function createTexture() {
    const gl = programInfo.gl;

    let gradient = new Uint8Array([255, 127, 63, 0, 0, 128]);
    programInfo.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, programInfo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 2, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, gradient);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, programInfo.texture);

    let samplerLoc = gl.getUniformLocation(programInfo.shaderProgram, "sampler");
    gl.uniform1i(samplerLoc, 0);
}
