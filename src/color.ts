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

import { Disposable } from "./dispose"


type ColorData = [number, number, number, number] | Array<number>

/**
 * computes the square width and height of a buffer to hold the given length.
 * @param {number} length the length to compute.
 * @returns {{width, height}}
 */
export const compute_texture_dimensions = (length: number): { width: number, height: number } => {
  let x = Math.ceil(Math.sqrt(length))
  x = (x < 4) ? 4 : x;
  return { width: x, height: x }
}

/**
 * Color1D
 * 
 * A 1 dimentional color buffer.
 */
export class Color1D implements Disposable {
  public type          : "Color1D"
  public context       : WebGL2RenderingContext
  public framebuf      : WebGLFramebuffer
  public width         : number
  public texture       : WebGLTexture
  public textureWidth  : number
  public textureHeight : number
  public textureData   : Uint8Array
  public data          : Uint8Array

  /**
   * creates a new Color1D color buffer.
   * @param {WebGL2RenderingContext} context the webgl rendering context.
   * @param {WebGLFrameBuffer} framebuf the webgl framebuffer. 
   * @param {number} length the length of this data array.
   * @returns {Color1D}
   */
  constructor(context: WebGL2RenderingContext, framebuf: WebGLFramebuffer, length: number) {
    const { width, height } = compute_texture_dimensions(length)
    this.type          = "Color1D"
    this.context       = context
    this.framebuf      = framebuf
    this.width         = length
    this.textureWidth  = width
    this.textureHeight = height
    this.textureData   = new Uint8Array((width * height) * 4)
    this.data          = new Uint8Array(this.textureData.buffer, 0, (length * 4))
    this.texture       = this.context.createTexture()
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S,     this.context.CLAMP_TO_EDGE)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T,     this.context.CLAMP_TO_EDGE)
    this.context.bindTexture(this.context.TEXTURE_2D, null)
    this.push()
  }

  /**
   * gets the value at the given index.
   * @param {number} x the index offset.
   * @returns {ColorData}
   */
  public get(x: number): ColorData {
    const index = (x * 4)
    return [
      this.data[index + 0],
      this.data[index + 1],
      this.data[index + 2],
      this.data[index + 3]
    ]
  }

  /**
   * sets the value at the given index.
   * @param {number} x the index offset.
   * @param {ColorData} v the value to set.
   * @returns {this}
   */
  public set(x: number, c: ColorData): this {
    const index = (x * 4)
    this.data[index + 0] = c[0]
    this.data[index + 1] = c[1]
    this.data[index + 2] = c[2]
    this.data[index + 3] = c[3]
    return this
  }
  /**
   * applies a interior mutable map to this buffer.
   * @param {Function} func the map function.
   * @returns {this}
   */
  public map(func: (x: number) => ColorData): this {
    for(let x = 0; x < this.width; x++) {
      this.set(x, func(x))
    } return this
  }
  /**
   * pushes local data to the GPU.
   * @returns {void}
   */
  public push(): this {
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.texImage2D (this.context.TEXTURE_2D,
      0,                          // level of detail.
      this.context.RGBA,          // internal format.
      this.textureWidth,          // width  - related to s on textures.
      this.textureHeight,         // height - related to t on textures.
      0,                          // always 0 in OpenGL ES.
      this.context.RGBA,          // format for each pixel.
      this.context.UNSIGNED_BYTE, // data type for each chanel.
      this.textureData            // image data in the described format, or null.
    )
    this.context.bindTexture(this.context.TEXTURE_2D, null)
    return this
  }

  /**
   * pulls data from the GPU.
   * @returns {this}
   */
  public pull(): this {
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.framebuf);
    this.context.framebufferTexture2D(
      this.context.FRAMEBUFFER,
      this.context.COLOR_ATTACHMENT0,
      this.context.TEXTURE_2D,
      this.texture,
      0)
    
    if (this.context.checkFramebufferStatus(this.context.FRAMEBUFFER) != this.context.FRAMEBUFFER_COMPLETE) {
       console.warn("Color1D: unable to read array due to incomplete framebuffer attachement")
    }
    this.context.readPixels(0, 0, 
      this.textureWidth, 
      this.textureHeight, 
      this.context.RGBA, 
      this.context.UNSIGNED_BYTE, 
      this.textureData, 
      0)
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, null)
    return this
  }
  /**
   * disposes of this object.
   * @returns {void}
   */
  public dispose(): void {
    this.context.deleteTexture(this.texture)
  }
}
/**
 * Color2D
 * 
 * A 2 dimentional color buffer.
 */
export class Color2D implements Disposable {
  public type          : "Color2D"
  public context       : WebGL2RenderingContext
  public framebuf      : WebGLFramebuffer
  public width         : number
  public height        : number
  public texture       : WebGLTexture
  public textureWidth  : number
  public textureHeight : number
  public textureData   : Uint8Array
  public data          : Uint8Array

  /**
   * creates a new Color2D color buffer.
   * @param {WebGL2RenderingContext} context the webgl rendering context.
   * @param {WebGLFrameBuffer} framebuf the webgl framebuffer. 
   * @param {number} width the width of this data. 
   * @param {number} height the height of this data.
   * @returns {Color2D}
   */
  constructor(context: WebGL2RenderingContext, framebuf: WebGLFramebuffer, width: number, height: number) {
    this.type          = "Color2D"
    this.context       = context
    this.framebuf      = framebuf
    this.width         = width
    this.height        = height
    this.textureWidth  = width
    this.textureHeight = height
    this.textureData   = new Uint8Array(width * height * 4)
    this.data          = new Uint8Array(this.textureData.buffer)
    this.texture       = this.context.createTexture()
    this.context.bindTexture  (this.context.TEXTURE_2D, this.texture)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S,     this.context.CLAMP_TO_EDGE)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T,     this.context.CLAMP_TO_EDGE)
    this.context.bindTexture  (this.context.TEXTURE_2D, null)
    this.push()
  }
  /**
   * gets the value at the given index.
   * @param {number} x the x offset.
   * @param {number} y the y offset.
   * @returns {ColorData}
   */
  public get(x: number, y: number): ColorData {
    const index = (x + (y * this.width)) * 4
    return [
      this.data[index + 0],
      this.data[index + 1],
      this.data[index + 2],
      this.data[index + 3]
    ]
  }
  /**
   * sets the value at the given index.
   * @param {number} x the x offset.
   * @param {number} y the y offset.
   * @param {number} v the value to set.
   * @returns {this}
   */
  public set(x: number, y: number, c: ColorData): this {
    const index = (x + (y * this.width)) * 4
    this.data[index + 0] = c[0]
    this.data[index + 1] = c[1]
    this.data[index + 2] = c[2]
    this.data[index + 3] = c[3]
    return this
  }

  /**
   * applies a interior mutable map to this buffer.
   * @param {Function} func the map function.
   * @returns {this}
   */
  public map(func: (x: number, y: number) => ColorData): this {
    for(let y = 0; y < this.height; y++) {
      for(let x = 0; x < this.width; x++) {
        this.set(x, y, func(x, y))
      }
    } return this
  }

  /**
   * pushes local data to the GPU.
   * @returns {this}
   */
  public push(): this {
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.texImage2D (this.context.TEXTURE_2D,
      0,                           // level of detail.
      this.context.RGBA,           // internal format.
      this.textureWidth,           // width  - related to s on textures.
      this.textureHeight,          // height - related to t on textures.
      0,                           // always 0 in OpenGL ES.
      this.context.RGBA,           // format for each pixel.
      this.context.UNSIGNED_BYTE,  // data type for each chanel.
      this.textureData             // image data in the described format, or null.
    )
    this.context.bindTexture(this.context.TEXTURE_2D, null)
    return this
  }
  /**
   * pulls data from the GPU.
   * @returns {this}
   */
  public pull(): this {
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.framebuf);
    this.context.framebufferTexture2D(
      this.context.FRAMEBUFFER,
      this.context.COLOR_ATTACHMENT0,
      this.context.TEXTURE_2D,
      this.texture,
      0)
    
    if (this.context.checkFramebufferStatus(this.context.FRAMEBUFFER) != this.context.FRAMEBUFFER_COMPLETE) {
       console.warn("Color2D: unable to read array due to incomplete framebuffer attachement")
    }
    this.context.readPixels(0, 0, 
      this.textureWidth, 
      this.textureHeight, 
      this.context.RGBA, 
      this.context.UNSIGNED_BYTE, 
      this.textureData,
      0)
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, null)
    return this
  }
  /**
   * disposes of this object.
   * @returns {void}
   */
  public dispose(): void {
    this.context.deleteTexture(this.texture)
  }
}

/**
 * Color3D
 * 
 * A 3 dimensional color buffer.
 */
export class Color3D implements Disposable {
  public type          : "Color3D"
  public context       : WebGL2RenderingContext
  public framebuf      : WebGLFramebuffer
  public width         : number
  public height        : number
  public depth         : number
  public texture       : WebGLTexture
  public textureWidth  : number
  public textureHeight : number
  public textureData   : Uint8Array
  public data          : Uint8Array

  /**
   * creates a new Float3D float buffer.
   * @param {WebGL2RenderingContext} context the webgl rendering context.
   * @param {WebGLFrameBuffer} framebuf the webgl framebuffer. 
   * @param {number} width the width of this data. 
   * @param {number} height the height of this data.
   * @param {number} depth the height of this data.
   * @returns {Float3D}
   */
  constructor(context: WebGL2RenderingContext, framebuf: WebGLFramebuffer, width: number, height: number, depth: number) {
    const size = compute_texture_dimensions(width * height * depth);
    this.type          = "Color3D"
    this.context       = context
    this.framebuf      = framebuf
    this.width         = width
    this.height        = height
    this.depth         = depth
    this.textureWidth  = size.width
    this.textureHeight = size.height
    this.textureData   = new Uint8Array (size.width * size.height * 4)
    this.data          = new Uint8Array (this.textureData.buffer, 0, (width * height * depth) * 4)
    this.texture       = this.context.createTexture()
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S,     this.context.CLAMP_TO_EDGE)
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T,     this.context.CLAMP_TO_EDGE)
    this.context.bindTexture(this.context.TEXTURE_2D, null)
    this.push()
  }
  /**
   * gets the value at the given index.
   * @param {number} x the x offset.
   * @param {number} y the y offset.
   * @returns {number}
   */
  public get(x: number, y: number, z: number): ColorData {
    const index = (x + (y * this.width) + (z * (this.width * this.height))) * 4
    return [
      this.data[index + 0],
      this.data[index + 1],
      this.data[index + 2],
      this.data[index + 3]
    ]
  }

  /**
   * sets the value at the given index.
   * @param {number} x the x offset.
   * @param {number} y the y offset.
   * @param {number} v the value to set.
   * @returns {this}
   */
  public set(x: number, y: number, z: number, c: ColorData): this {
    const index = (x + (y * this.width) + (z * (this.width * this.height))) * 4
    this.data[index + 0] = c[0]
    this.data[index + 1] = c[1]
    this.data[index + 2] = c[2]
    this.data[index + 3] = c[3]
    return this
  }
  /**
   * applies a interior mutable map to this buffer.
   * @param {Function} func the map function.
   * @returns {this}
   */
  public map(func: (x: number, y: number, z: number) => ColorData): this {
    for(let z = 0; z < this.depth; z++) {
      for(let y = 0; y < this.height; y++) {
        for(let x = 0; x < this.width; x++) {
          this.set(x, y, z, func(x, y, z))
        }
      }
    } return this
  }
  /**
   * pushes local data to the GPU.
   * @returns {this}
   */
  public push(): this {
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.texImage2D (this.context.TEXTURE_2D,
      0,                                      // level of detail.
      this.context.RGBA,                      // internal format.
      this.textureWidth,                      // width  - related to s on textures.
      this.textureHeight,                     // height - related to t on textures.
      0,                                      // always 0 in OpenGL ES.
      this.context.RGBA,                      // format for each pixel.
      this.context.UNSIGNED_BYTE,             // data type for each chanel.
      this.textureData                        // image data in the described format, or null.
    )
    this.context.bindTexture(this.context.TEXTURE_2D, null)
    return this
  }
  /**
   * pulls data from the GPU.
   * @returns {this}
   */
  public pull(): this {
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.framebuf);
    this.context.framebufferTexture2D(
      this.context.FRAMEBUFFER,
      this.context.COLOR_ATTACHMENT0,
      this.context.TEXTURE_2D,
      this.texture,
      0)
    
    if (this.context.checkFramebufferStatus(this.context.FRAMEBUFFER) != this.context.FRAMEBUFFER_COMPLETE) {
       console.warn("Color3D: unable to read array due to incomplete framebuffer attachement")
    }
    this.context.readPixels(0, 0, 
      this.textureWidth, 
      this.textureHeight, 
      this.context.RGBA, 
      this.context.UNSIGNED_BYTE, 
      this.textureData, 
      0)
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, null)
    return this
  }
  /**
   * disposes of this object.
   * @returns {void}
   */
  public dispose(): void {
    this.context.deleteTexture(this.texture)
  }
}