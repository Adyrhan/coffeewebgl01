'use strict'

class CanvasRenderer
	debug: false
	getVertexShaderSource: =>
		"
		attribute vec3 aVertexPosition;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;

		void main(void) {
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
		}
		"

	getFragmentShaderSource: =>
		"
		precision mediump float;

		void main(void) {
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
		"

	getShader: (shaderType) =>
		shader = null
		source = null
		if shaderType == "fragment"
			shader = @gl.createShader @gl.FRAGMENT_SHADER
			source = @getFragmentShaderSource()
		else if shaderType == "vertex"
			shader = @gl.createShader @gl.VERTEX_SHADER
			source = @getVertexShaderSource()
		else
			return null

		@gl.shaderSource shader, source
		@gl.compileShader shader

		if !@gl.getShaderParameter shader, @gl.COMPILE_STATUS
			console.log @gl.getShaderInfoLog shader
			return null

		shader

	initShaders: =>
		fragmentShader = @getShader "fragment"
		vertexShader = @getShader "vertex"

		@shaderProgram = @gl.createProgram()

		@gl.attachShader @shaderProgram, vertexShader
		@gl.attachShader @shaderProgram, fragmentShader
		@gl.linkProgram @shaderProgram

		if !@gl.getProgramParameter @shaderProgram, @gl.LINK_STATUS
			console.log "Couldn't initialize shaders"
			return false

		@gl.useProgram @shaderProgram

		@shaderProgram.vertexPositionAttribute = @gl.getAttribLocation @shaderProgram, "aVertexPosition"
		@gl.enableVertexAttribArray @shaderProgram.vertexPositionAttribute

		@shaderProgram.pMatrixUniform = @gl.getUniformLocation @shaderProgram, "uPMatrix"
		@shaderProgram.mvMatrixUniform = @gl.getUniformLocation @shaderProgram, "uMVMatrix"

		true

	setMatrixUniforms: =>
		@gl.uniformMatrix4fv @shaderProgram.pMatrixUniform, false, @pMatrix
		@gl.uniformMatrix4fv @shaderProgram.mvMatrixUniform, false, @mvMatrix

	constructor: ->
		@triangleVertexPositionBuffer = null
		@squareVertexPositionBuffer = null
		@mvMatrix = mat4.create()
		@pMatrix = mat4.create()
		@gl = null
		@shaderProgram = null
	
	logGLCall: (call, args) =>
		console.log "gl."+call+" "+ WebGLDebugUtils.glFunctionArgsToString(call, args)

	initGL: (canvasId) => 
		canvas = document.getElementById canvasId
		
		if canvas is null
			console.log "Couldn't retrieve canvas from DOM"
			return null

		if @debug
			gl = WebGLDebugUtils.makeDebugContext canvas.getContext("webgl"), undefined, @logGLCall
		else
			gl = canvas.getContext("webgl")
		
		gl.viewportWidth = canvas.width
		gl.viewportHeight = canvas.height

		if gl is null
			console.log "Couldn't retrieve WebGL context"
			return null
		else
			console.log "Drawing buffer is ("+gl.drawingBufferWidth+"x"+gl.drawingBufferHeight+")"
			gl

	initBuffers: =>
		@triangleVertexPositionBuffer = @gl.createBuffer()
		
		vertices = [
			0.0,  1.0, 0.0,
		   -1.0, -1.0, 0.0,
			1.0, -1.0, 0.0
		]
		
		@gl.bindBuffer @gl.ARRAY_BUFFER, @triangleVertexPositionBuffer
		@gl.bufferData @gl.ARRAY_BUFFER, new Float32Array(vertices), @gl.STATIC_DRAW 
		@triangleVertexPositionBuffer.itemSize = 3
		@triangleVertexPositionBuffer.numItems = 3

		@squareVertexPositionBuffer = @gl.createBuffer()

		vertices = [
			1.0, 1.0, 0.0,
			-1.0, 1.0, 0.0,
			1.0, -1.0, 0.0,
			-1.0, -1.0, 0.0
		]

		@gl.bindBuffer @gl.ARRAY_BUFFER, @squareVertexPositionBuffer
		@gl.bufferData @gl.ARRAY_BUFFER, new Float32Array(vertices), @gl.STATIC_DRAW
		@squareVertexPositionBuffer.itemSize = 3
		@squareVertexPositionBuffer.numItems = 4

	start: =>
		textElem = document.getElementById "ptag"
		textElem.innerHTML = "Initializing..."

		@gl = @initGL "canvas"
		if @gl is null
			console.log "initGL failed!"
			textElem.innerHTML = "WebGL initialization failed :("
			return

		console.log "initialized!"
		textElem.innerHTML = "WebGL initialized!"

		if !@initShaders()
			return
		@initBuffers()

		@gl.clearColor 0.0, 0.0, 0.0, 1.0
		@gl.enable @gl.DEPTH_TEST

		@drawScene()

	drawScene: =>
		@gl.viewport 0, 0, @gl.viewportWidth, @gl.viewportHeight
		@gl.clear @gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT
		
		mat4.perspective 45, @gl.viewportWidth / @gl.viewportHeight, 0.1, 100.0, @pMatrix
		
		mat4.identity @mvMatrix

		mat4.translate @mvMatrix, [-1.0, 0.0, -7.0]
		@gl.bindBuffer @gl.ARRAY_BUFFER, @triangleVertexPositionBuffer
		@gl.vertexAttribPointer @shaderProgram.vertexPositionAttribute, @triangleVertexPositionBuffer.itemSize, @gl.FLOAT, false, 0, 0
		@setMatrixUniforms()
		@gl.drawArrays @gl.TRIANGLES, 0, @triangleVertexPositionBuffer.numItems

		mat4.translate @mvMatrix, [3.0, 0.0, 0.0]
		@gl.bindBuffer @gl.ARRAY_BUFFER, @squareVertexPositionBuffer
		@gl.vertexAttribPointer @shaderProgram.vertexPositionAttribute, @squareVertexPositionBuffer.itemSize, @gl.FLOAT, false, 0, 0
		@setMatrixUniforms()
		@gl.drawArrays @gl.TRIANGLE_STRIP, 0, @squareVertexPositionBuffer.numItems

app = new CanvasRenderer()
app.start()