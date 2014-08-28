(function() {
  'use strict';
  var CanvasRenderer, app,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CanvasRenderer = (function() {
    CanvasRenderer.prototype.debug = false;

    CanvasRenderer.prototype.getVertexShaderSource = function() {
      return "		attribute vec3 aVertexPosition;		uniform mat4 uMVMatrix;		uniform mat4 uPMatrix;		void main(void) {			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);		}		";
    };

    CanvasRenderer.prototype.getFragmentShaderSource = function() {
      return "		precision mediump float;		void main(void) {			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);		}		";
    };

    CanvasRenderer.prototype.getShader = function(shaderType) {
      var shader, source;
      shader = null;
      source = null;
      if (shaderType === "fragment") {
        shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        source = this.getFragmentShaderSource();
      } else if (shaderType === "vertex") {
        shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        source = this.getVertexShaderSource();
      } else {
        return null;
      }
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.log(this.gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    CanvasRenderer.prototype.initShaders = function() {
      var fragmentShader, vertexShader;
      fragmentShader = this.getShader("fragment");
      vertexShader = this.getShader("vertex");
      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);
      if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
        console.log("Couldn't initialize shaders");
        return false;
      }
      this.gl.useProgram(this.shaderProgram);
      this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
      this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
      this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
      this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
      return true;
    };

    CanvasRenderer.prototype.setMatrixUniforms = function() {
      this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
      return this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    };

    function CanvasRenderer() {
      this.drawScene = __bind(this.drawScene, this);
      this.start = __bind(this.start, this);
      this.initBuffers = __bind(this.initBuffers, this);
      this.initGL = __bind(this.initGL, this);
      this.logGLCall = __bind(this.logGLCall, this);
      this.setMatrixUniforms = __bind(this.setMatrixUniforms, this);
      this.initShaders = __bind(this.initShaders, this);
      this.getShader = __bind(this.getShader, this);
      this.getFragmentShaderSource = __bind(this.getFragmentShaderSource, this);
      this.getVertexShaderSource = __bind(this.getVertexShaderSource, this);
      this.triangleVertexPositionBuffer = null;
      this.squareVertexPositionBuffer = null;
      this.mvMatrix = mat4.create();
      this.pMatrix = mat4.create();
      this.gl = null;
      this.shaderProgram = null;
    }

    CanvasRenderer.prototype.logGLCall = function(call, args) {
      return console.log("gl." + call + " " + WebGLDebugUtils.glFunctionArgsToString(call, args));
    };

    CanvasRenderer.prototype.initGL = function(canvasId) {
      var canvas, gl;
      canvas = document.getElementById(canvasId);
      if (canvas === null) {
        console.log("Couldn't retrieve canvas from DOM");
        return null;
      }
      if (this.debug) {
        gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"), void 0, this.logGLCall);
      } else {
        gl = canvas.getContext("webgl");
      }
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
      if (gl === null) {
        console.log("Couldn't retrieve WebGL context");
        return null;
      } else {
        console.log("Drawing buffer is (" + gl.drawingBufferWidth + "x" + gl.drawingBufferHeight + ")");
        return gl;
      }
    };

    CanvasRenderer.prototype.initBuffers = function() {
      var vertices;
      this.triangleVertexPositionBuffer = this.gl.createBuffer();
      vertices = [0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
      this.triangleVertexPositionBuffer.itemSize = 3;
      this.triangleVertexPositionBuffer.numItems = 3;
      this.squareVertexPositionBuffer = this.gl.createBuffer();
      vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
      this.squareVertexPositionBuffer.itemSize = 3;
      return this.squareVertexPositionBuffer.numItems = 4;
    };

    CanvasRenderer.prototype.start = function() {
      var textElem;
      textElem = document.getElementById("ptag");
      textElem.innerHTML = "Initializing...";
      this.gl = this.initGL("canvas");
      if (this.gl === null) {
        console.log("initGL failed!");
        textElem.innerHTML = "WebGL initialization failed :(";
        return;
      }
      console.log("initialized!");
      textElem.innerHTML = "WebGL initialized!";
      if (!this.initShaders()) {
        return;
      }
      this.initBuffers();
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.enable(this.gl.DEPTH_TEST);
      return this.drawScene();
    };

    CanvasRenderer.prototype.drawScene = function() {
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
      mat4.identity(this.mvMatrix);
      mat4.translate(this.mvMatrix, [-1.0, 0.0, -7.0]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.triangleVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      this.setMatrixUniforms();
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangleVertexPositionBuffer.numItems);
      mat4.translate(this.mvMatrix, [3.0, 0.0, 0.0]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      this.setMatrixUniforms();
      return this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
    };

    return CanvasRenderer;

  })();

  app = new CanvasRenderer();

  app.start();

}).call(this);

/*
//@ sourceMappingURL=coffeewebgl01.js.map
*/