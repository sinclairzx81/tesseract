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

//---------------------------------------------------------------------
//
// tesseract-compute plane.
//  
// A full screen quad rendered across the output viewport. The coordinates
// for the quad pass through the vertex shader without transformation, however
// the viewport is adjusted to match the output dimensions.
//
// 
//
//  (-1,-1)   (1,-1)     
//   [0]--------[3]       
//    | \        |         
//    |  \       |         
//    |   \      |      
//    |    \     |        
//    |     \    |        
//    |      \   |
//    |       \  |
//    |        \ |
//    |         \|       
//   [1]--------[2]      
//  (-1, 1)    (1, 1)    
//
//-------------------------------------------------------------------

export class Plane {
  public position: WebGLBuffer
  public texcoord: WebGLBuffer
  public indices : WebGLBuffer

  /**
   * creates a new compute plane.
   * @param {WebGL2RenderingContext} context the webgl2 rendering context.
   * @returns {Plane}
   */
  constructor(private context: WebGL2RenderingContext) {
    this.position = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.position)
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array([
       -1.0,-1.0, 0.0, 
       -1.0, 1.0, 0.0, 
        1.0, 1.0, 0.0, 
        1.0,-1.0, 0.0
    ]), this.context.STATIC_DRAW)
    this.texcoord = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.texcoord)
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0
    ]), this.context.STATIC_DRAW)
    this.indices = this.context.createBuffer()
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.indices)
    this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, new Uint16Array([
      0, 1, 2, 2, 3, 0
    ]), this.context.STATIC_DRAW)
  }
  /**
   * disposes of this plane.
   */
  public dispose() : void {
    this.context.deleteBuffer(this.position)
    this.context.deleteBuffer(this.texcoord)
    this.context.deleteBuffer(this.indices)
  }
}
