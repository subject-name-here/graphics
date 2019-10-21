const vsSource = `
      attribute vec2 aVertexPosition;
      attribute vec2 aPlotPosition;

      varying vec2 vPosition;

      void main(void) {
          gl_Position = vec4(aVertexPosition, 1.0, 1.0);
          vPosition = aPlotPosition;
      }
`;
const fsSource = `
    precision mediump float;
    
    uniform int iterations;
    uniform float za;
    uniform float zb;
    uniform float infinity;
    
    uniform sampler2D sampler;
    
    varying vec2 vPosition;
    
    vec2 f(vec2 z, vec2 c) {
        return vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
    }
    
    void main(void) {
        vec2 z = vec2(za, zb);
        vec2 c = vPosition;
        
        for (int i = 0; i < 256; i++) {
            if (i >= iterations) {
                break;
            }

            z = f(z, c);
            if (z.x * z.x + z.y * z.y > infinity * infinity) {
                float frac = float(i) / float(iterations);
                gl_FragColor = texture2D(sampler, vec2(frac, 0.5));
                return;
            }
        }
        gl_FragColor = texture2D(sampler, vec2(1, 0.5));
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