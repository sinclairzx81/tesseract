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
// gpu-reduce: 
// 
// tests a GPU reduce process, reducing from ND to ND-1 by
// summing the input and writing to the output. These tests
// verify buffer width/height/depth properties are accurate.
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`gpu-reduce: float1D->single ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float1D input;
      [float] thread (int x) {
        float sum = 0.0;
        for(int i = 0; i < input.width; i++) {
          sum += input[i];
        }
        thread[0] = sum;
      }
    `)
    const input  = context.createFloat1D(width).map(n => 1).push()
    const output = context.createFloat1D(1)
    program.execute([output], {
      input
    })
    output.pull()

    test.assert(output.get(0) === width)
    input.dispose()
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-reduce: float2D->float1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float2D input;
      [float] thread (int x) {
        float sum = 0.0;
        for(int i = 0; i < input.height; i++) {
          sum += input[i][x];
        }
        thread[0] = sum;
      }
    `)
    const input  = context.createFloat2D(width, height).map(n => 1).push()
    const output = context.createFloat1D(width)
    program.execute([output], {
      input
    })
    output.pull()

    for(let x = 0; x < width; x++) {
      test.assert(output.get(x) === height)
    }

    input.dispose()
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-reduce: float3D->float2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float3D input;
      [float] thread (int x, int y) {
        float sum = 0.0;
        for(int i = 0; i < input.depth; i++) {
          sum += input[x][y][i];
        }
        thread[0] = sum;
      }
    `)

    const input  = context.createFloat3D(width, height, depth).map(n => 1).push()
    const output = context.createFloat2D(width, height)
    program.execute([output], {
      input
    })

    output.pull()
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert(output.get(x, y) === depth)
      }
    }
    
    input.dispose()
    output.dispose()
    program.dispose()
  })
}