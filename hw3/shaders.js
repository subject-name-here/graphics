const vsSource = `
    precision highp float;
    attribute vec4 aVertexPosition;
    attribute vec3 aNormalPosition;
    attribute vec2 aTexturePosition;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    
    varying vec4 cameraSpacePosition;
    varying vec4 truePosition;
    varying vec3 normal;
    varying vec3 lightDirection;
    varying vec2 textureCoord;
    
    const vec4 lightWorldPosition = vec4(20.0, 20.0, 20.0, 1.0);
    
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        
        truePosition = aVertexPosition;
        normal = vec3(uNormalMatrix * vec4(aNormalPosition, 0.0));
        cameraSpacePosition = normalize(uModelViewMatrix * aVertexPosition);
        lightDirection = vec3(uModelViewMatrix * normalize(lightWorldPosition - aVertexPosition));
        textureCoord = aTexturePosition;
    }
`;
const fsSource = `
    precision highp float;
    
    varying vec4 cameraSpacePosition;
    varying vec4 truePosition;
    varying vec3 normal;
    varying vec3 lightDirection;
    varying vec2 textureCoord;
    
    uniform int useTexture;
    uniform sampler2D uSampler;

    const vec3 lightColor = vec3(1.0, 0.5, 0.25);
    
    const float ka = 0.2;
    const float ia = 0.4;
    const float kd = 0.8;
    const float ks = 0.7;
    const float deg = 15.0;

    void main(void) {
        highp float ambient = ka * ia;
        highp float diffuse = max(dot(normal, lightDirection), 0.0);
        
        vec3 viewDirection = normalize(vec3(-cameraSpacePosition));
        highp float specular = max(dot(vec3(normal), normalize(viewDirection + lightDirection)), 0.0);
        specular = pow(specular, deg);
        
        highp float total = ambient + kd * diffuse + ks * specular;
        vec3 total_color = lightColor * total;
        
        if (useTexture == 1) {
            vec4 textureColor = texture2D(uSampler, vec2(textureCoord.s, textureCoord.t));
            total_color = textureColor.rgb * total;
        }
        
        if (useTexture == 2) {
            gl_FragColor = vec4(0.7, 0.8, 1.0, 1.0);
        } else {
            gl_FragColor = vec4(total_color, 1.0);
        }
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

function bindVertexBuffer(gl, buffer, location, numComponents) {
    numComponents = numComponents || 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
        location,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(location);
}