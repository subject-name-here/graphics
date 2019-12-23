function fillModelInfo(obj, modelInfo) {
    modelInfo.obj = obj;

    modelInfo.totalLength = obj.children[0].geometry.attributes.position.array.length;

    modelInfo.positions = obj.children[0].geometry.attributes.position.array;
    modelInfo.normals = obj.children[0].geometry.attributes.normal.array;

    modelInfo.texture = [];
    let tmp_inner = [];
    for (let j = 0; j < modelInfo.totalLength / 3; j++) {
        tmp_inner.push(j);
        modelInfo.texture.push(0.0, 0.0);
    }
    modelInfo.indices = new Uint16Array(tmp_inner);

    // Create the inner circle data
    modelInfo.innerCircle = {};
    modelInfo.innerCircle.positions = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    modelInfo.innerCircle.normals = [
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0
    ];
    modelInfo.innerCircle.indices = createRange(6);
    modelInfo.innerCircle.texture = [
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ];
}

function setWavesBuffers(waves) {
    const gl = programInfo.gl;
    buffers.inside = {};

    let position = [];
    let normals = [];
    let texture = [];

    let n = 0;
    for (let i = 0; i < waves.length; i++) {
        for (let j = 0; j < waves[i].particles; j++) {
            let r = waves[i].time;
            let angle = j / waves[i].particles * 2 * Math.PI;
            let x = Math.cos(angle) * r;
            let y = Math.sin(angle) * r;

            waves[i].position[9 * j] = x;
            waves[i].position[9 * j + 1] = y;

            waves[i].position[9 * j + 3] = x - Math.cos(angle) * 0.01;
            waves[i].position[9 * j + 4] = y - Math.cos(angle) * 0.01;

            waves[i].position[9 * j + 6] = x + Math.cos(angle) * 0.01;
            waves[i].position[9 * j + 7] = y + Math.cos(angle) * 0.01;
        }
        waves[i].time += 0.01;
        position = position.concat(waves[i].position);
        normals = normals.concat(waves[i].normals);
        texture = texture.concat(waves[i].texture);
    }

    let indices = createRange(waves.n);

    buffers.inside.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.inside.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

    buffers.inside.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.inside.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    buffers.inside.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.inside.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    buffers.inside.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.inside.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
}
