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
// gpu-map-index: 
// 
// tests that the thread indexer is being passed the correct
// indices. Here we write the thread index out on float
// buffer targets and explicitly verify the results across
// a number of passes.
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`gpu-map-index: index1D-X ${width}x${height}x${depth}`, test => {

    const program = context.createProgram(`
      [float] thread (int x) {
        thread[0] = float(x);
      }
    `)

    const output = context.createFloat1D(width)
    program.execute([output], {})
    output.pull()

    for(let x = 0; x < width; x++) {
      test.assert(output.get(x) === x, `output[${x}] got: ${output.get(x)} expect: ${x}`)
    }

    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-index: index2D-X ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y) {
        thread[0] = float(x);
      }
    `)
    const output = context.createFloat2D(width, height)
    program.execute([output], {})
    output.pull()

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert(output.get(x, y) === x, `output[${x}, ${y}] got: ${output.get(x, y)} expect: ${x}`)
      }
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-index: index2D-Y ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y) {
        thread[0] = float(y);
      }
    `)

    const output = context.createFloat2D(width, height)
    program.execute([output], {})
    output.pull()
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert(output.get(x, y) === y, `output[${x}, ${y}] got: ${output.get(x, y)} expect: ${y}`)
      }
    }

    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-index: index3D-X ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y, int z) {
        thread[0] = float(x);
      }
    `)
    const output = context.createFloat3D(width, height, depth)
    program.execute([output], {})
    output.pull()

    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert(output.get(x, y, z) === x, `output[${x}, ${y}, ${z}] got: ${output.get(x, y, z)} expect: ${x}`)
        }
      }
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-index: index3D-Y ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y, int z) {
        thread[0] = float(y);
      }
    `)
    const output = context.createFloat3D(width, height, depth)
    program.execute([output], {})
    output.pull()
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert(output.get(x, y, z) === y, `output[${x}, ${y}, ${z}] got: ${output.get(x, y, z)} expect: ${y}`)
        }
      }
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-index: index3D-Z ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float] thread (int x, int y, int z) {
        thread[0] = float(z);
      }
    `)
    const output = context.createFloat3D(width, height, depth)
    program.execute([output], {})
    output.pull()
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert(output.get(x, y, z) === z, `output[${x}, ${y}, ${z}] got: ${output.get(x, y, z)} expect: ${z}`)
        }
      }
    }
    output.dispose()
    program.dispose()
  })
}


