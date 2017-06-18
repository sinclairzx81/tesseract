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
// gpu-map-one: 
//
// tests writing computed values from a program into single
// target buffer. Additionally, this test helps verify that 
// glsl optimizations are factored in around the lack of use
// of the thread functions indexer.
//
// note: the input attribute nc_thread_texcoord will be 
// optimized away as a result of not using the thread
// indexer. See condition around nc_thread_texcoord in
// program execute()
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`gpu-map-one: float1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x) {
        thread[0] = 123.0;
      }
    `)

    const expect = 123
    const output = context.createFloat1D(width)

    program.execute([output], {})
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(expect === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${expect}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-one: float2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y) {
        thread[0] = 123.0;
      }
    `)

    const expect = 123;
    const output = context.createFloat2D(width, height)
    program.execute([output], {})
    output.pull()
    for(let y = 0; y < output.height; y++) {
      for(let x = 0; x < output.width; x++) {
        test.assert(expect === output.get(x, y), `output[${x}, ${y}]  got: ${output.get(x, y)} expect: ${expect}`)
      }
    }
    output.dispose()
    program.dispose()
  })
  runner.describe(`gpu-map-one: float3D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y, int z) {
        thread[0] = 123.0;
      }
    `)
    const expect = 123
    const output = context.createFloat3D(width, height, depth)
    program.execute([output], {})
    output.pull()
    for(let z = 0; z < output.depth; z++) {
      for(let y = 0; y < output.height; y++) {
        for(let x = 0; x < output.width; x++) {
          test.assert(expect === output.get(x, y, z), `output[${x}, ${y}, ${z}]  got: ${output.get(x, y, z)} expect: ${expect}`)
        }
      }
    }
    output.dispose()
    program.dispose()
  })
  runner.describe(`gpu-map-one: color1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color] thread (int x) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
      }
    `)
    const expect = [255, 0, 255, 0]
    const output = context.createColor1D(width)
    program.execute([output], {})
    output.pull()
    for(let x = 0; x < output.width; x++) {
      test.equal(expect, output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${expect}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-one: color2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color] thread (int x, int y) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
      }
    `)
    const expect = [255, 0, 255, 0];
    const output = context.createColor2D(width, height)
    program.execute([output], {})
    output.pull()
    for(let y = 0; y < output.height; y++) {
      for(let x = 0; x < output.width; x++) {
        test.equal(expect, output.get(x, y), `output[${x}, ${y}]  got: ${output.get(x, y)} expect: ${expect}`)
      }
    }
    output.dispose()
    program.dispose()
  })
  runner.describe(`gpu-map-one: color3D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color] thread (int x, int y, int z) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
      }
    `)

    const expect = [255, 0, 255, 0];
    const output = context.createColor3D(width, height, depth)
    program.execute([output], {})
    output.pull()
    for(let z = 0; z < output.depth; z++) {
      for(let y = 0; y < output.height; y++) {
        for(let x = 0; x < output.width; x++) {
          test.equal(expect, output.get(x, y, z), `output[${x}, ${y}, ${z}]  got: ${output.get(x, y, z)} expect: ${expect}`)
        }
      }
    }
    output.dispose()
    program.dispose()
  })
}
