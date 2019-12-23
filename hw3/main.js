const programInfo = {};
const rtt = {};
const modelInfo = {};
const buffers = {};

const waves = [];

main();

function main() {
    const canvas = document.querySelector('#canvas');
    programInfo.canvas = canvas;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    programInfo.gl = gl;

    programInfo.shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo.normalPosition = gl.getAttribLocation(programInfo.shaderProgram, 'aNormalPosition');
    programInfo.vertexPosition = gl.getAttribLocation(programInfo.shaderProgram, 'aVertexPosition');
    programInfo.texturePosition = gl.getAttribLocation(programInfo.shaderProgram, 'aTexturePosition');

    programInfo.projectionMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uProjectionMatrix');
    programInfo.modelViewMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uModelViewMatrix');
    programInfo.normalMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uNormalMatrix');

    programInfo.useTextures = gl.getUniformLocation(programInfo.shaderProgram, "useTexture");
    programInfo.samplerUniform = gl.getUniformLocation(programInfo.shaderProgram, "uSampler");

    gl.useProgram(programInfo.shaderProgram);

    function render() {
        checkWaves();
        if (waves.length) {
            if (waves[waves.length - 1].isMain === false && waves[waves.length - 1].time > 1) {
                createWave(true);
            } else if (waves[waves.length - 1].isMain === true && waves[waves.length - 1].time > 0.1) {
                createWave(false);
            }
        } else {
            createWave(true);
        }

        drawScene();
        requestAnimationFrame(render);
    }

    let loader = new THREE.OBJLoader();
    loader.load('models/outer_circle.obj', function ( obj ) {
        fillModelInfo(obj, modelInfo);

        initBuffers();
        initTextureFramebuffer();
        initMouseCallback(canvas);
        initWaves();
        requestAnimationFrame(render);
    }, function() {}, function(err) {
        console.log(err);
    });
}

function initWaves() {
    waves.n = 0;
}

function createWave(isMain) {
    if (waves.n > 20000 && isMain) {
        return;
    }

    waves.push({
        time : 0,
        particles : 768,
        position : [],
        normals : [],
        texture : [],
    });
    let i = waves.length - 1;

    waves[i].n = 0;
    waves[i].isMain = isMain;
    for (let j = 0; j < waves[i].particles; j++) {
        for (let k = 0; k < 3; k++) {
            waves[i].position.push(0.0, 0.0, 0.0);
            waves[i].normals.push(0.0, 0.0, 1.0);
            waves[i].texture.push(0.0, 0.0);
        }

        waves[i].n += 3;
    }
    waves[i].indices = createRange(waves[i].n);

    waves.n += waves[i].n;
}

function checkWaves() {
    if (waves[0] && waves[0].time > 3) {
        let w = waves.splice(0, 1);
        waves.n -= w[0].n;
    }
}

function initBuffers() {
    const gl = programInfo.gl;

    buffers.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.positions), gl.STATIC_DRAW);

    buffers.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelInfo.indices), gl.STATIC_DRAW);

    buffers.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.normals), gl.STATIC_DRAW);

    buffers.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.texture), gl.STATIC_DRAW);

    buffers.innerCircle = {};

    buffers.innerCircle.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.innerCircle.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.innerCircle.positions), gl.STATIC_DRAW);

    buffers.innerCircle.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.innerCircle.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelInfo.innerCircle.indices), gl.STATIC_DRAW);

    buffers.innerCircle.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.innerCircle.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.innerCircle.normals), gl.STATIC_DRAW);

    buffers.innerCircle.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.innerCircle.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelInfo.innerCircle.texture), gl.STATIC_DRAW);
}

function initTextureFramebuffer() {
    let gl = programInfo.gl;
    let rttFramebuffer = gl.createFramebuffer();
    rtt.rttFramebuffer = rttFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = 256;
    rttFramebuffer.height = 256;

    rtt.rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rtt.rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    // gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    let renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rtt.rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


function drawScene() {
    const gl = programInfo.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, rtt.rttFramebuffer);
    drawInnerSceneOnTexture();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = getProjectionMatrix();
    const modelViewMatrix = getViewMatrix();

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    bindVertexBuffer(gl, buffers.positionBuffer, programInfo.vertexPosition);
    bindVertexBuffer(gl, buffers.normalBuffer, programInfo.normalPosition);
    bindVertexBuffer(gl, buffers.textureBuffer, programInfo.texturePosition, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

    // Set shader uniforms

    gl.uniformMatrix4fv(
        programInfo.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.modelViewMatrix,
        false,
        modelViewMatrix);
    gl.uniformMatrix4fv(
        programInfo.normalMatrix,
        false,
        normalMatrix);
    gl.uniform1i(programInfo.useTextures, 0);

    let vertexCount = modelInfo.indices.length;
    let type = gl.UNSIGNED_SHORT;
    let offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);


    // DRAW INNER SCENE
    drawTexture();
}


function drawInnerSceneOnTexture() {
    const gl = programInfo.gl;
    gl.viewport(0, 0, rtt.rttFramebuffer.width, rtt.rttFramebuffer.height);

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // UNIFORMS

    const fieldOfView = Math.PI / 4;
    const aspect = rtt.rttFramebuffer.width / rtt.rttFramebuffer.height;
    const zNear = 0.1;
    const zFar = 100000.0;

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -4.0]);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(
        programInfo.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.modelViewMatrix,
        false,
        modelViewMatrix);
    gl.uniformMatrix4fv(
        programInfo.normalMatrix,
        false,
        normalMatrix);

    gl.uniform1i(programInfo.useTextures, 2);

    // BUFFERS
    setWavesBuffers(waves);
    bindVertexBuffer(gl, buffers.inside.positionBuffer, programInfo.vertexPosition);
    bindVertexBuffer(gl, buffers.inside.normalBuffer, programInfo.normalPosition);
    bindVertexBuffer(gl, buffers.inside.textureBuffer, programInfo.texturePosition, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.inside.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.uniform1i(programInfo.samplerUniform, 0);

    gl.drawElements(gl.POINTS, waves.n, gl.UNSIGNED_SHORT, 0);

    gl.bindTexture(gl.TEXTURE_2D, rtt.rttTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function drawTexture() {
    const gl = programInfo.gl;

    bindVertexBuffer(gl, buffers.innerCircle.positionBuffer, programInfo.vertexPosition);
    bindVertexBuffer(gl, buffers.innerCircle.normalBuffer, programInfo.normalPosition);
    bindVertexBuffer(gl, buffers.innerCircle.textureBuffer, programInfo.texturePosition, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.innerCircle.indexBuffer);

    gl.uniform1i(programInfo.useTextures, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtt.rttTexture);
    gl.uniform1i(programInfo.samplerUniform, 0);

    let vertexCount = modelInfo.innerCircle.indices.length;
    let type = gl.UNSIGNED_SHORT;
    let offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}
