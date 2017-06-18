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

//-----------------------------------------------
// Program Buffer Type
//-----------------------------------------------
type BufferType = 
| Float1D
| Float2D
| Float3D
| Color1D
| Color2D
| Color3D

//-----------------------------------------------
// Program Render Type
//-----------------------------------------------
type Render1D =  {
  type: "1D"
  viewport: { width: number, height: number },
  output  : { width: number }
}
type Render2D = {
  type     : "2D",
  viewport : { width: number, height: number },
  output   : { width: number, height: number }
}
type Render3D = {
  type    : "3D",
  viewport: { width: number, height: number },
  output  : { width: number, height: number, depth: number }
}
type Render = 
  | Render1D 
  | Render2D 
  | Render3D

//-----------------------------------------------
// Program Uniform Type
//-----------------------------------------------
export interface ProgramUniforms {
  [name: string]: BufferType | number
}

export class Program {
  private program       : WebGLProgram
  private vertexshader  : WebGLShader
  private fragmentshader: WebGLShader
  public  script        : Script
  private uniforms      : {[name: string]: any}
  private attributes    : {[name: string]: any}

  /**
   * creates a new compute program.
   * @param {WebGL2RenderingContext} context the webgl rendering context. 
   * @param {WebGLFramebuffer} framebuf the webgl frame buffer. 
   * @param {Plane} plane the plane geometry.
   * @param {string} source the source code for this program.
   * @returns {Program}
   */
  constructor(private context: WebGL2RenderingContext, private framebuf: WebGLFramebuffer, private plane: Plane, source: string) {
    this.script = transform(source)

    this.compileScript   ()
    this.cacheAttributes ()
    this.cacheUniforms   ()
    // console.log("attributes:", JSON.stringify(this.attributes, null, 2))
    // console.log("uniforms:", JSON.stringify(this.uniforms, null, 2))
    // console.log(this.script.vertex.split("\n").map  ((line, index) => index + ":   " + line).join("\n"))
    // console.log(this.script.fragment.split("\n").map((line, index) => index + ":   " + line).join("\n"))
  }

  /**
   * compiles and links this program.
   * @returns {void}
   */
  private compileScript() : void {
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
  }
  /**
   * caches vertex shader input attributes.
   * @returns {void}
   */
  private cacheAttributes(): void {
    this.attributes = {}
    this.attributes["nc_thread_position"] = this.context.getAttribLocation(this.program, "nc_thread_position")  
    this.attributes["nc_thread_texcoord"] = this.context.getAttribLocation(this.program, "nc_thread_texcoord") 
  }
  /**
   * caches fragment shader uniforms.
   * @returns {void}
   */
  private cacheUniforms(): void {
    this.uniforms = {}
    // kernel uniforms
    this.uniforms["nc_thread_viewport_width"]  = this.context.getUniformLocation(this.program, "nc_thread_viewport_width")
    this.uniforms["nc_thread_viewport_height"] = this.context.getUniformLocation(this.program, "nc_thread_viewport_height")
    this.uniforms["nc_thread_output_width"]    = this.context.getUniformLocation(this.program, "nc_thread_output_width")
    this.uniforms["nc_thread_output_height"]   = this.context.getUniformLocation(this.program, "nc_thread_output_height")
    this.uniforms["nc_thread_output_depth"]    = this.context.getUniformLocation(this.program, "nc_thread_output_depth")
    // extracted uniforms
    this.script.uniforms.forEach(uniform => {
      switch(uniform.type) {
        case "int":
        case "float": {
          this.uniforms[uniform.name] = this.context.getUniformLocation(this.program, uniform.name)
          break;
        }
        case "Color1D":
        case "Float1D":{
          this.uniforms[`nc_uniform_${uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          this.uniforms[`nc_uniform_${uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          this.uniforms[`nc_uniform_${uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          this.uniforms[`nc_uniform_${uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)
          break;
        }
        case "Color2D": 
        case "Float2D":{
          this.uniforms[`nc_uniform_${uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          this.uniforms[`nc_uniform_${uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          this.uniforms[`nc_uniform_${uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          this.uniforms[`nc_uniform_${uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)
          this.uniforms[`nc_uniform_${uniform.name}_height`]        = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_height`)
          break;
        }
        case "Color3D":
        case "Float3D":  {
          this.uniforms[`nc_uniform_${uniform.name}_texture`]       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          this.uniforms[`nc_uniform_${uniform.name}_textureWidth`]  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          this.uniforms[`nc_uniform_${uniform.name}_textureHeight`] = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          this.uniforms[`nc_uniform_${uniform.name}_width`]         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)
          this.uniforms[`nc_uniform_${uniform.name}_height`]        = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_height`)
          this.uniforms[`nc_uniform_${uniform.name}_depth`]         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_depth`)
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
    if(!this.validate(outputs)) return
   
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.framebuf)
    for(let i = 0; i < outputs.length; i++) {
      this.context.framebufferTexture2D (this.context.FRAMEBUFFER, this.context.COLOR_ATTACHMENT0 + i, this.context.TEXTURE_2D, outputs[i].texture, 0);
      if(!(this.context.checkFramebufferStatus(this.context.FRAMEBUFFER) === this.context.FRAMEBUFFER_COMPLETE)) {
        console.warn(`unable to attach output[${i}] as render target.`)
        return
      }
    }
    
    this.context.drawBuffers (outputs.map((output, index) => this.context.COLOR_ATTACHMENT0 + index))


    const output = outputs[0]
    switch(output.type) {
      case "Float1D":
      case "Color1D":
        this.render({
          type: "1D",
          viewport: { width: output.textureWidth, height: output.textureHeight},
          output  : { width: output.width }
        }, uniforms)
        break;
      case "Float2D":
      case "Color2D":
        this.render({
          type: "2D",
          viewport: { width: output.textureWidth, height: output.textureHeight},
          output  : { width: output.width, height: output.height  }
        }, uniforms)
        break;
      case "Float3D":
      case "Color3D":
        this.render({
          type: "3D",
          viewport: { width: output.textureWidth, height: output.textureHeight},
          output  : { width: output.width, height: output.height, depth: output.depth }
        }, uniforms)
        break;
    }

    for(let i = 0; i < outputs.length; i++) {
      this.context.framebufferTexture2D (this.context.FRAMEBUFFER, this.context.COLOR_ATTACHMENT0 + i, this.context.TEXTURE_2D, null, 0);
    };
    this.context.bindFramebuffer (this.context.FRAMEBUFFER,  null)
  }

  /**
   * executes this program, rendering to the [0] channel.
   * @param {[number, number]} size the size of the kernel.
   * @param {any} uniforms the uniforms to pass to the kernel.
   * @returns {void}
   */
  private render(render: Render, uniforms: ProgramUniforms) : void {
    this.context.useProgram (this.program)
    
    // kernel uniforms
    switch(render.type) {
      case "1D":
        this.context.viewport (0, 0, render.viewport.width, render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_width"],  render.viewport.width)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_height"], render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_output_width"],    render.output.width)
        break;
      case "2D":
        this.context.viewport (0, 0, render.viewport.width, render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_width"],  render.viewport.width)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_height"], render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_output_width"],    render.output.width)
        this.context.uniform1i(this.uniforms["nc_thread_output_height"],   render.output.height)
        break;
      case "3D":
        this.context.viewport (0, 0, render.viewport.width, render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_width"],  render.viewport.width)
        this.context.uniform1i(this.uniforms["nc_thread_viewport_height"], render.viewport.height)
        this.context.uniform1i(this.uniforms["nc_thread_output_width"],    render.output.width)
        this.context.uniform1i(this.uniforms["nc_thread_output_height"],   render.output.height)
        this.context.uniform1i(this.uniforms["nc_thread_output_depth"],    render.output.depth)
        break;
    }

    // user defined uniforms.
    let texture_index = 0
    this.script.uniforms.forEach(uniform => {
      if(uniforms[uniform.name] === undefined) return
      switch(uniform.type) {
        case "float": {
          const location = this.context.getUniformLocation(this.program, uniform.name)
          this.context.uniform1f(location, uniforms[uniform.name] as number);
          break;
        }
        case "int": {
          const location = this.context.getUniformLocation(this.program, uniform.name)
          this.context.uniform1i(location, uniforms[uniform.name] as number);
          break;
        }
        case "Color1D":
        case "Float1D": {
          const data = uniforms[uniform.name] as Color1D | Float1D
          const texture       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          const textureWidth  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          const textureHeight = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          const width         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)

          this.context.activeTexture(this.context.TEXTURE0 + texture_index)
          this.context.bindTexture  (this.context.TEXTURE_2D, data.texture)
          this.context.uniform1i    (texture, texture_index)
          texture_index += 1
          this.context.uniform1i    (textureWidth,  data.textureWidth)
          this.context.uniform1i    (textureHeight, data.textureHeight)
          this.context.uniform1i    (width,         data.width)
          break;
        }
        case "Color2D": 
        case "Float2D": {
          const data = uniforms[uniform.name] as Color2D | Float2D
          const texture       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          const textureWidth  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          const textureHeight = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          const width         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)
          const height        = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_height`)
          this.context.activeTexture(this.context.TEXTURE0 + texture_index)
          this.context.bindTexture  (this.context.TEXTURE_2D, data.texture)
          this.context.uniform1i    (texture, texture_index)
          texture_index += 1
          this.context.uniform1i  (textureWidth,  data.textureWidth)
          this.context.uniform1i  (textureHeight, data.textureHeight)
          this.context.uniform1i  (width,         data.width)
          this.context.uniform1i  (height,        data.height)
          break;
        }
        case "Color3D":
        case "Float3D": {
          const data = uniforms[uniform.name] as Color3D | Float3D
          const texture       = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_texture`)
          const textureWidth  = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureWidth`)
          const textureHeight = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_textureHeight`)
          const width         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_width`)
          const height        = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_height`)
          const depth         = this.context.getUniformLocation(this.program, `nc_uniform_${uniform.name}_depth`)

          
          this.context.activeTexture(this.context.TEXTURE0 + texture_index)
          this.context.bindTexture  (this.context.TEXTURE_2D, data.texture)
          this.context.uniform1i    (texture, texture_index)
          texture_index += 1
          this.context.uniform1i  (textureWidth,  data.textureWidth)
          this.context.uniform1i  (textureHeight, data.textureHeight)
          this.context.uniform1i  (width,         data.width)
          this.context.uniform1i  (height,        data.height)
          this.context.uniform1i  (depth,         data.depth)
          break;
        }
      }
    })
    
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.position)
    this.context.enableVertexAttribArray(this.attributes["nc_thread_position"])
    this.context.vertexAttribPointer(this.attributes["nc_thread_position"], 3, this.context.FLOAT, false, 0, 0)
    
    if(this.attributes["nc_thread_texcoord"] !== -1) {
      
      this.context.bindBuffer(this.context.ARRAY_BUFFER, this.plane.texcoord)
      this.context.enableVertexAttribArray(this.attributes["nc_thread_texcoord"])
      this.context.vertexAttribPointer(this.attributes["nc_thread_texcoord"], 2, this.context.FLOAT, false, 0, 0)
    }
    // bind buffer and render.
    this.context.bindBuffer  (this.context.ELEMENT_ARRAY_BUFFER, this.plane.indices)
    this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0)
  }

  /**
   * preforms preflight validation checks on the outputs provided to execute. outputs
   * are cross referenced with the programs thread function, and against
   * each other when checking output dimensions.
   * @param {Array<BufferType>} outputs the outputs to check.
   * @returns {boolean}
   */
  private validate(outputs: Array<BufferType>): boolean {
    // validate output length..
    if(this.script.thread.outputs.length !== outputs.length) {
      console.warn(`program.execute(): expected ${this.script.thread.outputs.length} outputs, ${outputs.length} given.`)
      return false
    }
    // validate output indexing.
    for(let i = 0; i < outputs.length; i++) {
      if(outputs[i].type.indexOf(this.script.thread.indexing) === -1) {
        console.warn(`program.execute(): a ${outputs[i].type} is an invalid output for ${this.script.thread.indexing} indexed thread functions.`)
        return false
      }
    }
    // validate output dimensions.
    for(let i = 1; i < outputs.length; i++) {
      if(outputs[0].textureWidth  !== outputs[i].textureWidth ||
         outputs[0].textureHeight !== outputs[i].textureHeight) {
        console.warn(`program.execute(): all output dimensions must be the same for all outputs.`)
        for(let j = 0; j < outputs.length; j++) {
          const output = outputs[j]
          console.warn(`program.execute(): - [${j}] - ${output.type} -> ${output.textureWidth}x${output.textureHeight}`)
        }
        return false
      }
    }
    return true
  }

  /**
   * disposes of this program.
   * @returns {void}
   */
  public dispose() : void {
    this.context.deleteProgram(this.program)
  }
}



