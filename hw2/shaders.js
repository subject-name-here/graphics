const vsSource = `
    precision highp float;
    attribute vec4 aVertexPosition;
    attribute vec3 aNormalPosition;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    
    varying vec4 cameraSpacePosition;
    varying vec4 truePosition;
    varying vec3 normal;
    varying vec3 lightDirection;
    
    const vec4 lightWorldPosition = vec4(200.0, 200.0, 200.0, 1.0);
    
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        
        truePosition = aVertexPosition;
        normal = vec3(uNormalMatrix * vec4(aNormalPosition, 0.0));
        cameraSpacePosition = normalize(uModelViewMatrix * aVertexPosition);
        lightDirection = vec3(uModelViewMatrix * normalize(lightWorldPosition - aVertexPosition));
    }
`;
const fsSource = `
    precision highp float;` + perlinNoiseGenerator + `
    
    varying vec4 cameraSpacePosition;
    varying vec4 truePosition;
    varying vec3 normal;
    varying vec3 lightDirection;
    
    uniform float uThreshold;

    const vec3 lightColor = vec3(1.0, 0.5, 0.25);
    
    const float ke = 0.0;
    uniform float ka;
    const float ia = 0.4;
    uniform float kd;
    uniform float ks;
    const float deg = 15.0;

    void main(void) {
        if (cnoise(vec3(truePosition)) >= uThreshold) {
            discard;
        } 
    
        highp float ambient = ke + ka * ia;
        highp float diffuse = max(dot(normal, lightDirection), 0.0);
        
        vec3 viewDirection = normalize(vec3(-cameraSpacePosition));
        highp float specular = max(dot(vec3(normal), normalize(viewDirection + lightDirection)), 0.0);
        specular = pow(specular, deg);
        
        highp float total = ambient + kd * diffuse + ks * specular;
        vec3 total_color = lightColor * total;
        gl_FragColor = vec4(total_color, 1.0);

        // gl_FragColor = vec4(normal + position, 1.0); - just cool light
    }
`;


function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}