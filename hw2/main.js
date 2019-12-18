const programInfo = {};
const modelInfo = {};
const buffers = {};
const settings = {
    dissolveThreshold : 0
};

const BATCH_SIZE = 9000;

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
    programInfo.projectionMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uProjectionMatrix');
    programInfo.modelViewMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uModelViewMatrix');
    programInfo.normalMatrix = gl.getUniformLocation(programInfo.shaderProgram, 'uNormalMatrix');
    programInfo.dissolveThreshold = gl.getUniformLocation(programInfo.shaderProgram, 'uThreshold');
    programInfo.ambient = gl.getUniformLocation(programInfo.shaderProgram, 'ka');
    programInfo.diffuse = gl.getUniformLocation(programInfo.shaderProgram, 'kd');
    programInfo.specular = gl.getUniformLocation(programInfo.shaderProgram, 'ks');

    function render() {
        drawScene();
        requestAnimationFrame(render);
    }

    let loader = new THREE.OBJLoader();
    loader.load('models/man.obj', function ( obj ) {
        modelInfo.obj = obj;

        modelInfo.totalLength = obj.children[0].geometry.attributes.position.array.length;
        modelInfo.numOfChunks = Math.ceil(modelInfo.totalLength / BATCH_SIZE);

        modelInfo.positions = obj.children[0].geometry.attributes.position.array.chunk(BATCH_SIZE);
        modelInfo.normals = obj.children[0].geometry.attributes.normal.array.chunk(BATCH_SIZE);

        modelInfo.indices = [];
        for (let i = 0; i < modelInfo.totalLength; i += BATCH_SIZE) {
            let tmp_inner = [];
            for (let j = 0; j < Math.min(BATCH_SIZE, modelInfo.totalLength - i) / 3; j++) {
                tmp_inner.push(j);
            }
            modelInfo.indices.push(new Uint16Array(tmp_inner));
        }

        initBuffers();
        initMouseCallback(canvas);
        updateSettings();
        requestAnimationFrame(render);
    }, function() {}, function(err) {
        console.log(err);
    });
}

function initBuffers() {
    const gl = programInfo.gl;

    buffers.positionBuffer = [];
    buffers.indexBuffer = [];
    buffers.normalBuffer = [];

    for (let i = 0; i < modelInfo.numOfChunks; i++) {
        const positions = modelInfo.positions[i];

        buffers.positionBuffer.push(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const indices = modelInfo.indices[i];

        buffers.indexBuffer.push(gl.createBuffer());
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const normals = modelInfo.normals[i];

        buffers.normalBuffer.push(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }
}

function drawScene() {
    const gl = programInfo.gl;

    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let chunk_ptr = 0; chunk_ptr < modelInfo.numOfChunks; chunk_ptr++) {
        const fieldOfView = Math.PI / 4;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100000.0;

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        const modelViewMatrix = getViewMatrix();

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer[chunk_ptr]);
            gl.vertexAttribPointer(
                programInfo.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(programInfo.vertexPosition);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer[chunk_ptr]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer[chunk_ptr]);
            gl.vertexAttribPointer(
                programInfo.normalPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(programInfo.normalPosition);
        }


        gl.useProgram(programInfo.shaderProgram);

        // Set the shader uniforms

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

        {
            const vertexCount = modelInfo.indices[chunk_ptr].length;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}

function updateSettings() {
    let threshold = document.getElementById("threshold").value;
    programInfo.gl.uniform1f(programInfo.dissolveThreshold, threshold);

    let ka = document.getElementById("ka").value;
    programInfo.gl.uniform1f(programInfo.ambient, ka);

    let kd = document.getElementById("kd").value;
    programInfo.gl.uniform1f(programInfo.diffuse, kd);

    let ks = document.getElementById("ks").value;
    programInfo.gl.uniform1f(programInfo.specular, ks);
}
