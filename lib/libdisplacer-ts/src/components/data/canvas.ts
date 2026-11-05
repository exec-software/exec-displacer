import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

const DEFAULT_VERTEX = `attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`

const DEFAULT_FRAGMENT = `precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 color = vec3(0.18, 0.11, 0.27) + 0.05 * sin(uv.x * 10.0 + uTime) * sin(uv.y * 8.0 - uTime * 0.5);
  gl_FragColor = vec4(color, 1.0);
}`

export class DisplacerCanvas extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; }
  `

  @property({ type: String }) fragment = DEFAULT_FRAGMENT
  @property({ type: String }) vertex = DEFAULT_VERTEX
  @property({ type: Number }) opacity = 1.0
  @property({ type: Boolean }) animated = true

  private _gl: WebGLRenderingContext | null = null
  private _program: WebGLProgram | null = null
  private _raf = 0
  private _start = 0
  private _resizeObserver: ResizeObserver | null = null

  connectedCallback() {
    super.connectedCallback()
    this._resizeObserver = new ResizeObserver(() => this._resize())
  }

  firstUpdated() {
    const canvas = this.shadowRoot?.querySelector('canvas')
    if (!canvas) return
    this._gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!this._gl) return
    this._resizeObserver?.observe(canvas)
    this._resize()
    this._compile()
    if (this.animated) this._startAnim()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    cancelAnimationFrame(this._raf)
    this._resizeObserver?.disconnect()
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('fragment') || changed.has('vertex')) {
      this._compile()
    }
  }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }

  private _resize() {
    const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement
    const gl = this._gl
    if (!canvas || !gl) return
    const w = canvas.clientWidth * devicePixelRatio
    const h = canvas.clientHeight * devicePixelRatio
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h
      gl.viewport(0, 0, w, h)
    }
  }

  private _compile() {
    const gl = this._gl; if (!gl) return
    const prog = this._createProgram(gl, this.vertex, this.fragment)
    if (prog) { gl.useProgram(prog); this._program = prog }
  }

  private _createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
    const vShader = this._compileShader(gl, gl.VERTEX_SHADER, vs)
    const fShader = this._compileShader(gl, gl.FRAGMENT_SHADER, fs)
    if (!vShader || !fShader) return null
    const prog = gl.createProgram()!
    gl.attachShader(prog, vShader); gl.attachShader(prog, fShader)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl.deleteProgram(prog); return null }
    return prog
  }

  private _compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, src); gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null }
    return shader
  }

  private _startAnim() {
    this._start = performance.now()
    const loop = (now: number) => {
      this._raf = requestAnimationFrame(loop)
      const gl = this._gl; if (!gl) return
      const t = (now - this._start) / 1000
      const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return
      // Set up a full-screen quad
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
      const aPos = gl.getAttribLocation(this._program!, 'aPosition')
      if (aPos >= 0) { gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0) }
      // Uniforms
      const uTime = gl.getUniformLocation(this._program!, 'uTime')
      const uRes = gl.getUniformLocation(this._program!, 'uResolution')
      if (uTime) gl.uniform1f(uTime, t)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.deleteBuffer(buf)
    }
    this._raf = requestAnimationFrame(loop)
  }
}

customElements.define('ds-canvas', DisplacerCanvas)

declare global {
  interface HTMLElementTagNameMap {
    'ds-canvas': DisplacerCanvas
  }
}
