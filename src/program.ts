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

import { Plane   }                    from "./plane"
import { Float1D, Float2D, Float3D  } from "./float"
import { Color1D, Color2D, Color3D  } from "./color"
import { Script, transform }          from "./script"

type BufferType = 
| Float1D
| Float2D
| Float3D
| Color1D
| Color2D
| Color3D

type UniformType = 
| BufferType 
| number

export interface ProgramUniforms {
  [name: string]: UniformType
}

/**
 * Program
 * 
 * Tesseract compute program.
 */
export class Program {
  private program       : WebGLProgram
  private vertexshader  : WebGLShader
  private fragmentshader: WebGLShader
  public  script        : Script
  public  cache: {
    uniforms      : {[name: string]: any},
    attributes    : {[name: string]: any}
  }

  /**
   * creates a new compute program.
   * @param {WebGL2RenderingContext} context the webgl rendering context. 
   * @param {WebGLFramebuffer} framebuf the webgl frame buffer. 
   * @param {Plane} plane the plane geometry.
   * @param {string} source the source code for this program.
   * @returns {this}
   */
  constructor(private context: WebGL2RenderingContext, private framebuf: WebGLFramebuffer, private plane: Plane, source: string) {
    this.script = transform(source)
    this.compile()
  }

  /**
   * compiles the parsed compute script and caches the attribute 
   * and uniform values. 
   * @returns {void}
   */
  private compile() : void {

    //---------------------------------------------------
    //
    // PROGRAM: COMPILE AND LINK
    //
    //---------------------------------------------------
    this.program      = this.context.createProgram()
    this.vertexshader = this.context.createShader(this.context.VERTEX_SHADER)
    this.context.shaderSource  (this.vertexshader, this.script.vertex)
    this.context.compileShader (this.vertexshader)
    if (this.context.getShaderParameter(this.vertexshader, this.context.COMPILE_STATUS) === false) {
      console.warn(this.context.getShaderInfoLog(this.vertexshader))
      this.context.deleteShader(this.vertexshader)
      return
    }
    this.fragmentshader = this.context.createShader(this.context.FRAGMENT_SHADER)
    this.context.shaderSource (this.fragmentshader, this.script.fragment)
    this.context.compileShader(this.fragmentshader)
    if (this.context.getShaderParameter(this.fragmentshader, this.context.COMPILE_STATUS) === false) {
      console.warn(this.context.getShaderInfoLog(this.fragmentshader))
      this.context.deleteShader(this.fragmentshader)
      return
    }
    this.context.attachShader (this.program, this.vertexshader)
    this.context.attachShader (this.program, this.fragmentshader)
    this.context.linkProgram  (this.program)

    //---------------------------------------------------
    //
    // PROGRAM: CACHE ATTRIBUTES AND UNIFORMS
    //
    //---------------------------------------------------
    this.cache = { attributes: {}, uniforms: {} }
    this.cache.attributes["nc_thread_position"]      = this.context.getAttribLocation (this.program, "nc_thread_position")  
    this.cache.attributes["nc_thread_texcoord"]      = this.context.getAttribLocation (this.program, "nc_thread_texcoord")
    this.cache.uniforms["nc_thread_viewport_width"]  = this.context.getUniformLocation(this.program, "nc_thread_viewport_width")
    this.cache.uniforms["nc_thread_viewport_height"] = this.context.getUniformLocation(this.program, "nc_thread_viewport_height")
    this.cache.uniforms["nc_thread_output_width"]    = this.context.getUniformLocation(this.program, "nc_thread_output_width")
    this.cache.uniforms["nc_thread_output_height"]   = this.context.getUniformLocation(this.program, "nc_thread_output_height")
    this.cache.uniforms["nc_thread_output_depth"]    = this.context.getUniformLocation(this.program, "nc_thread_output_depth")
    this.script.uniforms.forEach(script_uniform => {
      switch(script_uniform.type) {
        case "int":
        case "float": {
          this.cache.uniforms[script_uniform.name] = this.context.getUniformLocation(this.program, script_uniform.name)
          break;
        }
        case "Color1D":
        case "Float1D":{
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_texture`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureWidth`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureHeight`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_width`)
          break;
        }
        case "Color2D": 
        case "Float2D":{
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_texture`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureWidth`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureHeight`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_width`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`]        = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_height`)
          break;
        }
        case "Color3D":
        case "Float3D":  {
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_texture`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureWidth`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_textureHeight`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_width`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`]        = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_height`)
          this.cache.uniforms[`nc_uniform_${script_uniform.name}_depth`]         = this.context.getUniformLocation(this.program, `nc_uniform_${script_uniform.name}_depth`)
          break;
        }
      }
    })
  }

  /**
   * executes this program, writing to the given outputs.
   * @param {Array<BufferType>} outputs the output targets.
   * @param {ProgramUniforms} uniforms the uniforms to execute.
   * @returns {void}
   */
  public execute(outputs: Array<BufferType>, uniforms: ProgramUniforms): void {

    //---------------------------------------------------
    //
    // TYPECHECK: INPUT / OUTPUT
    //
    //---------------------------------------------------
    const typecheck = this.typecheck(outputs, uniforms)
    if(!typecheck.success) {
      console.warn(typecheck.errors.join("\n"))
      throw Error("unable to execute.")
    }

    //---------------------------------------------------
    //
    // FRAMEBUFFER: BEGIN
    //
    //---------------------------------------------------
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.framebuf)
    this.context.drawBuffers    (outputs.map((output, index) => this.context.COLOR_ATTACHMENT0 + index))
    outputs.forEach((output, index) => {
      this.context.framebufferTexture2D (
        this.context.FRAMEBUFFER, 
        this.context.COLOR_ATTACHMENT0 + index, 
        this.context.TEXTURE_2D, 
        output.texture, 
        0);
      if(!(this.context.checkFramebufferStatus(this.context.FRAMEBUFFER) === this.context.FRAMEBUFFER_COMPLETE)) {
        console.warn(`unable to attach output[${index}] as render target.`)
        return
      }
    })
    
    //---------------------------------------------------
    //
    // PROGRAM: BEGIN
    //
    //---------------------------------------------------
    this.context.useProgram (this.program)

    //---------------------------------------------------
    //
    // PROGRAM: THREAD UNIFORMS
    //
    //---------------------------------------------------
    const output = outputs[0]
    switch(output.type) {
      case "Float1D":
      case "Color1D":
        this.context.viewport (0, 0, output.textureWidth, output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_width"],  output.textureWidth)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_height"], output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_width"],    output.width)
        break;
      case "Float2D":
      case "Color2D":
        this.context.viewport (0, 0, output.textureWidth, output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_width"],  output.textureWidth)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_height"], output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_width"],    output.width)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_height"],   output.height)
        break;
      case "Float3D":
      case "Color3D":
        this.context.viewport (0, 0, output.textureWidth, output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_width"],  output.textureWidth)
        this.context.uniform1i(this.cache.uniforms["nc_thread_viewport_height"], output.textureHeight)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_width"],    output.width)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_height"],   output.height)
        this.context.uniform1i(this.cache.uniforms["nc_thread_output_depth"],    output.depth)
        break;
    }

    //---------------------------------------------------
    //
    // PROGRAM: USER UNIFORMS
    //
    //---------------------------------------------------
    let texture_index = 0
    this.script.uniforms.forEach(script_uniform => {
      if(uniforms[script_uniform.name] === undefined) return
      switch(script_uniform.type) {
        case "float": {
          this.context.uniform1f(this.cache.uniforms[script_uniform.name], uniforms[script_uniform.name] as number);
          break;
        }
        case "int": {
          this.context.uniform1i(this.cache.uniforms[script_uniform.name], uniforms[script_uniform.name] as number);
          break;
        }
        case "Color1D":
        case "Float1D": {
          const data = uniforms[script_uniform.name] as Color1D | Float1D
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`])  { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`],  data.textureWidth) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`]) { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`], data.textureHeight) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`])         { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`],         data.width) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]) {
            this.context.uniform1i     (this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`], texture_index)
            this.context.activeTexture (this.context.TEXTURE0 + texture_index)
            this.context.bindTexture   (this.context.TEXTURE_2D, data.texture)
            texture_index += 1
          }
          break;
        }
        case "Color2D": 
        case "Float2D": {
          const data = uniforms[script_uniform.name] as Color2D | Float2D
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`])  { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`],  data.textureWidth) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`]) { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`], data.textureHeight) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`])         { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`],         data.width) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`])        { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`],        data.height) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]) {
            this.context.uniform1i    (this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`], texture_index)
            this.context.activeTexture(this.context.TEXTURE0 + texture_index)
            this.context.bindTexture  (this.context.TEXTURE_2D, data.texture)
            texture_index += 1
          }

          break;
        }
        case "Color3D":
        case "Float3D": {
          const data = uniforms[script_uniform.name] as Color3D | Float3D
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`])  { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureWidth`],  data.textureWidth) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`]) { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_textureHeight`], data.textureHeight) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`])         { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_width`],         data.width) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`])        { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_height`],        data.height) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_depth`])         { this.context.uniform1i  (this.cache.uniforms[`nc_uniform_${script_uniform.name}_depth`],         data.depth) }
          if(this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`]) {
            this.context.uniform1i    (this.cache.uniforms[`nc_uniform_${script_uniform.name}_texture`], texture_index)
            this.context.activeTexture(this.context.TEXTURE0 + texture_index)
            this.context.bindTexture  (this.context.TEXTURE_2D, data.texture)
            texture_index += 1
          }
          break;
        }
      }
    })

    //---------------------------------------------------
    //
    // PROGRAM: BIND & RENDER GEOMETRIES
    //
    //---------------------------------------------------
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.position)
    this.context.enableVertexAttribArray(this.cache.attributes["nc_thread_position"])
    this.context.vertexAttribPointer(this.cache.attributes["nc_thread_position"], 3, this.context.FLOAT, false, 0, 0)
    if(this.cache.attributes["nc_thread_texcoord"] !== -1) {
      this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.texcoord)
      this.context.enableVertexAttribArray(this.cache.attributes["nc_thread_texcoord"])
      this.context.vertexAttribPointer(this.cache.attributes["nc_thread_texcoord"], 2, this.context.FLOAT, false, 0, 0)
    }
    this.context.bindBuffer  (this.context.ELEMENT_ARRAY_BUFFER, this.plane.indices)
    this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0)

    //---------------------------------------------------
    //
    // FRAMBUFFER: END
    //
    //---------------------------------------------------
    outputs.forEach((_, index) => {
      this.context.framebufferTexture2D (
        this.context.FRAMEBUFFER, 
        this.context.COLOR_ATTACHMENT0 + index, 
        this.context.TEXTURE_2D, 
        null, 
        0);
    })
    this.context.bindFramebuffer (this.context.FRAMEBUFFER, null)
  }

  /**
   * preforms type checking on this programs inputs and outputs. types are
   * checked against the program transpilers output.
   * @param {Array<BufferType>} outputs the outputs
   * @param {ProgramUniform} uniforms the uniforms
   * @returns {boolean}
   */
  private typecheck(outputs: Array<BufferType>, uniforms: ProgramUniforms): { success: boolean, errors: string[] } {
    const errors = []

    //---------------------------------------------------
    //
    // OUTPUT
    //
    //---------------------------------------------------
    
    // check output length matches that of the shader. 
    if(this.script.thread.outputs.length !== outputs.length) {
      errors.push(`typecheck: expected ${this.script.thread.outputs.length} outputs, ${outputs.length} given.`)
    }
    // check the output buffers matches the expected dimensions defined by the shader.
    outputs.forEach((output, index) => {
      if(output.type.indexOf(this.script.thread.indexing) === -1) {
        errors.push(`typecheck: a ${outputs[index].type} is an invalid output for ${this.script.thread.indexing} indexed thread functions.`)
      }
    })
    // check that all output buffers are the same dimension.
    if(!outputs.every(output => outputs[0].textureWidth === output.textureWidth && outputs[0].textureHeight === output.textureHeight)) {
      errors.push(`typecheck: all output dimensions must be the same for all outputs.`)
    }

    //---------------------------------------------------
    //
    // INPUT
    //
    //---------------------------------------------------
    
    // (optional) check that all uniforms have been assigned.
    // this.script.uniforms.forEach(script_uniform => {
    //   if(uniforms[script_uniform.name] === undefined) {
    //     errors.push(`typecheck: a binding uniform ${script_uniform.type} ${script_uniform.name} not given.`)
    //   }
    // })

    // check that all uniforms are of the correct type.
    this.script.uniforms.forEach(script_uniform => {
      if(uniforms[script_uniform.name] === undefined) return
      const uniform = uniforms[script_uniform.name] as any
      switch(script_uniform.type) {
        case "int":
        case "float":   if(typeof uniform !== "number")  errors.push(`typecheck: ${script_uniform.name} is invalid. Expected ${script_uniform.type}.`); break;
        case "Float1D": if(uniform.type   !== "Float1D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
        case "Color1D": if(uniform.type   !== "Color1D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
        case "Float2D": if(uniform.type   !== "Float2D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
        case "Color2D": if(uniform.type   !== "Color2D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
        case "Float3D": if(uniform.type   !== "Float3D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
        case "Color3D": if(uniform.type   !== "Color3D") errors.push(`typecheck: uniform ${script_uniform.name} is invalid. Expected ${script_uniform.type}, got ${uniform.type}.`); break;
      }
    })
    return {
      success: errors.length === 0,
      errors : errors
    }
  }

  /**
   * disposes of this program.
   * @returns {void}
   */
  public dispose() : void {
    this.context.deleteShader (this.vertexshader)
    this.context.deleteShader (this.fragmentshader)
    this.context.deleteProgram(this.program)
  }
}



