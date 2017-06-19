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

import { Disposable }                from "./dispose"
import { Color1D, Color2D, Color3D } from "./color"
import { Float1D, Float2D, Float3D } from "./float"
import { Program, ProgramUniforms}   from "./program"
import { Plane  }                    from "./plane"

type ProgramArrayType = 
  | Float1D
  | Float2D
  | Float3D
  | Color1D
  | Color2D
  | Color3D

export class Context implements Disposable {
  private framebuf : WebGLFramebuffer
  private plane    : Plane
  
  /**
   * creates a new compute context using the given webgl2 rendering context. If no
   * context is given, a new rendering context is created on a hidden element.
   * @param {WebGL2RenderingContext} context the webgl rendering context.
   * @returns {Context}
   */
  constructor(private context: WebGL2RenderingContext = undefined) {
    if(context === undefined) {
      const canvas = document.createElement("canvas")
      this.context = canvas.getContext("webgl2", { 
        alpha     : false,
        depth     : false, 
        antialias : false 
      })
    }
    this.framebuf      = this.context.createFramebuffer()
    this.plane         = new Plane (this.context)
  }

  /**
   * creates a compute program.
   * @param {any} uniforms the uniforms for this program.
   * @param {string} source the glsl micro code for this program.
   * @returns {ComputeProgram}
   */
  public createProgram(source: string): Program {
    return new Program(this.context, this.framebuf, this.plane, source)
  }

  /**
   * creates Data1D buffer.
   * @param {number} length the length of this buffer.
   * @returns {Data1D}
   */
  public createColor1D(length: number) : Color1D {
    return new Color1D(this.context, this.framebuf, length)
  }

  /**
   * creates Data2D buffer.
   * @param {number} width the width of this buffer.
   * @param {number} height the height of this buffer.
   * @returns {Data2D}
   */
  public createColor2D(width: number, height: number) : Color2D {
    return new Color2D(this.context, this.framebuf, width, height)
  }

  /**
   * creates Data3D buffer.
   * @param {number} width the width of this buffer.
   * @param {number} height the height of this buffer.
   * @param {number} depth the depth of this buffer.
   * @returns {Data3D}
   */
  public createColor3D(width: number, height: number, depth: number) : Color3D {
    return new Color3D(this.context, this.framebuf, width, height, depth)
  }

  /**
   * creates Data1D buffer.
   * @param {number} length the length of this buffer.
   * @returns {Data1D}
   */
  public createFloat1D(length: number) : Float1D {
    return new Float1D(this.context, this.framebuf, length)
  }

  /**
   * creates Data2D buffer.
   * @param {number} width the width of this buffer.
   * @param {number} height the height of this buffer.
   * @returns {Data2D}
   */
  public createFloat2D(width: number, height: number) : Float2D {
    return new Float2D(this.context, this.framebuf, width, height)
  }

  /**
   * creates Data3D buffer.
   * @param {number} width the width of this buffer.
   * @param {number} height the height of this buffer.
   * @param {number} depth the depth of this buffer.
   * @returns {Data3D}
   */
  public createFloat3D(width: number, height: number, depth: number) : Float3D {
    return new Float3D(this.context, this.framebuf, width, height, depth)
  }
  
  /**
   * disposes this compute context.
   * @returns {void}
   */
  public dispose() : void {
    this.context.deleteFramebuffer(this.framebuf)
    this.plane.dispose()
  }
}