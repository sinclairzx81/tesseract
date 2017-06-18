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

import {Context}    from "../../src/index"
import {TestRunner} from "../run/index"

//-----------------------------------------------------------
//
// getset: tests cpu buffer get/set indexing. neuron-compute
// encodes its buffers in TEXTURE_2D, these tests validate
// the buffers get/set functions are working as expected and
// data is encoded appropriately.
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`cpu-getset: float1D ${width}x${height}x${depth}`, test => {
    const x     = Math.floor(width / 2)

    const expect = 345
    const input = context.createFloat1D(width);
    input.set(x, expect)
    test.assert(input.get(x) === expect, `input[${x}]: expect ${expect} got ${input.get(x)}`)
    input.dispose()
  })
  runner.describe(`cpu-getset: float2D ${width}x${height}x${depth}`, test => {
    const x      = Math.floor(width  / 2)
    const y      = Math.floor(height / 2)

    const expect  = 345;
    const input  = context.createFloat2D(width, height)
    input.set(x, y, expect)
    test.assert(input.get(x, y) === expect, `input[${x}, ${y}]: expect ${expect} got ${input.get(x, y)}`)
    input.dispose()
  })
  runner.describe(`cpu-getset: float3D ${width}x${height}x${depth}`, test => {
    const x      = Math.floor(width  / 2)
    const y      = Math.floor(height / 2)
    const z      = Math.floor(depth  / 2)

    const expect = 345
    const input  = context.createFloat3D(width, height, depth)
    input.set(x, y, z, expect)
    test.assert(input.get(x, y, z) === expect, `input[${x}, ${y}, ${z}]: expect ${expect} got ${input.get(x, y, z)}`)
    input.dispose()
  })
  runner.describe(`cpu-getset: color1D ${width}x${height}x${depth}`, test => {
    const x      = Math.floor(width  / 2)

    const expect = [12, 43, 11, 2]
    const input  = context.createColor1D(width);
    input.set(x, expect)
    test.equal(input.get(x), expect, `input[${x}]: expect ${expect} got ${input.get(x)}`)
    input.dispose()
  })
  runner.describe(`cpu-getset: color2D ${width}x${height}x${depth}`, test => {
    const x      = Math.floor(width  / 2)
    const y      = Math.floor(height / 2)

    const expect = [12, 43, 11, 2]
    const input  = context.createColor2D(width, height)
    input.set(x, y, expect)
    test.equal(input.get(x, y), expect, `input[${x}, ${y}]: expect ${expect} got ${input.get(x, y)}`)
    input.dispose()
  })
  runner.describe(`cpu-getset: color3D ${width}x${height}x${depth}`, test => {
    const x      = Math.floor(width  / 2)
    const y      = Math.floor(height / 2)
    const z      = Math.floor(depth  / 2)
    
    const expect = [12, 43, 11, 2] 
    const input  = context.createColor3D(width, height, depth)
    input.set(x, y, z, expect)
    test.equal(input.get(x, y, z), expect, `input[${x}, ${y}, ${z}]: expect ${expect} got ${input.get(x, y, z)}`)
    input.dispose()
  })
}