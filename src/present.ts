/*--------------------------------------------------------------------------

tesseract - gpgpu compute library for javascript

The MIT License (MIT)

Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import { Disposable }                 from "./dispose"
import { Plane   }                    from "./plane"
import { Float1D, Float2D, Float3D  } from "./float"
import { Color1D, Color2D, Color3D  } from "./color"

type BufferType = 
| Float1D
| Float2D
| Float3D
| Color1D
| Color2D
| Color3D

/**
 * Present
 * 
 * Presenting device used to output buffers (texture) to the windows framebuffer.
 */
export class Present implements Disposable {
  private program       : WebGLProgram
  private vertexshader  : WebGLShader
  private fragmentshader: WebGLShader
  public  cache   : {
    uniforms      : {[name: string]: any},
    attributes    : {[name: string]: any}
  }
  
  /**
   * constructs a new Present object.
   * @param {WebGL2RenderingContext} context the gl rendering context.
   * @param {Plane} plane the plane to render.
   * @returns {Present}
   */
  constructor(private context: WebGL2RenderingContext, private plane: Plane) {
    this.program      = this.context.createProgram()
    this.vertexshader = this.context.createShader(this.context.VERTEX_SHADER)
    this.context.shaderSource  (this.vertexshader, [
      "#version 300 es",
      "precision highp float;",
      "",
      "in  vec3 nc_present_position;",
      "in  vec2 nc_present_texcoord;",
      "out vec2 nc_present_uv;",
      "",
      "void main() {",
      "  nc_present_uv  = nc_present_texcoord;",
      "",
      "  gl_Position = vec4 (",
      "    nc_present_position.x,",
      "    nc_present_position.y,",
      "    nc_present_position.z,", 
      "    1.0);",
      "}"
    ].join("\n"))
    this.context.compileShader (this.vertexshader)
    if (this.context.getShaderParameter(this.vertexshader, this.context.COMPILE_STATUS) === false) {
      console.warn(this.context.getShaderInfoLog(this.vertexshader))
      this.context.deleteShader(this.vertexshader)
      return
    }
    this.fragmentshader = this.context.createShader(this.context.FRAGMENT_SHADER)
    this.context.shaderSource (this.fragmentshader, [
      "#version 300 es",
      "precision highp   float;",
      "uniform sampler2D nc_present_texture;",
      "in      vec2      nc_present_uv;",
      "layout(location = 0) out vec4 nc_present_output;",
      "",
      "void main() {",
      "  nc_present_output = texture(nc_present_texture, nc_present_uv);",
      "}"
    ].join("\n"))
    this.context.compileShader(this.fragmentshader)
    if (this.context.getShaderParameter(this.fragmentshader, this.context.COMPILE_STATUS) === false) {
      console.warn(this.context.getShaderInfoLog(this.fragmentshader))
      this.context.deleteShader(this.fragmentshader)
      return
    }
    this.context.attachShader (this.program, this.vertexshader)
    this.context.attachShader (this.program, this.fragmentshader)
    this.context.linkProgram  (this.program)

    // cache attributes.
    this.cache = { attributes: {}, uniforms: {} }
    this.cache.attributes["nc_present_position"]  = this.context.getAttribLocation (this.program, "nc_present_position")  
    this.cache.attributes["nc_present_texcoord"]  = this.context.getAttribLocation (this.program, "nc_present_texcoord")
    this.cache.uniforms  ["nc_present_texture"]   = this.context.getUniformLocation(this.program, "nc_present_texture")
  }

  /**
   * presents this buffer to the windows pixelbuffer.
   * @param {BufferType} buffer the buffer to present.
   * @returns {void} 
   */
  public present(buffer: BufferType): void {

    //-----------------------------------------
    // bind this program.
    //-----------------------------------------
    this.context.useProgram (this.program)

    //-----------------------------------------
    // bind texture to render.
    //-----------------------------------------
    this.context.uniform1i    (this.cache.uniforms[`nc_present_texture`], 0)
    this.context.activeTexture(this.context.TEXTURE0)
    this.context.bindTexture  (this.context.TEXTURE_2D, buffer.texture)

    //-----------------------------------------
    // bind vertex / index attributes.
    //-----------------------------------------
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.position)
    this.context.enableVertexAttribArray(this.cache.attributes["nc_present_position"])
    this.context.vertexAttribPointer(this.cache.attributes["nc_present_position"], 3, this.context.FLOAT, false, 0, 0)
    if(this.cache.attributes["nc_present_texcoord"] !== -1) {
      this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.texcoord)
      this.context.enableVertexAttribArray(this.cache.attributes["nc_present_texcoord"])
      this.context.vertexAttribPointer(this.cache.attributes["nc_present_texcoord"], 2, this.context.FLOAT, false, 0, 0)
    }
    this.context.bindBuffer  (this.context.ELEMENT_ARRAY_BUFFER, this.plane.indices)
    this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0)
  }

  /**
   * disposes of this object.
   * @returns {void}
   */
  public dispose() : void {
    this.context.deleteShader (this.vertexshader)
    this.context.deleteShader (this.fragmentshader)
    this.context.deleteProgram(this.program)
  }
}