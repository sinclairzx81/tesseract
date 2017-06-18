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
// gpu-map-many: 
//
// tests writing computed values from a program into multiple
// target buffers. Additionally, this test helps verify that 
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

  runner.describe(`gpu-map-many: float1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float, float] thread (int x) {
        thread[0] = 123.0;
        thread[1] = 321.0;
      }
    `)
    const expect0 = 123;
    const expect1 = 321;

    const output0 = context.createFloat1D(width)
    const output1 = context.createFloat1D(width)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()
    for(let x = 0; x < output0.width; x++) {
      test.assert(expect0 === output0.get(x), `output0[${x}]  got: ${output0.get(x)} expect: ${expect0}`)
      test.assert(expect1 === output1.get(x), `output1[${x}]  got: ${output1.get(x)} expect: ${expect1}`)
    }
    output0.dispose()
    output1.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-many: float2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float, float] thread (int x, int y) {
        thread[0] = 123.0;
        thread[1] = 321.0;
      }
    `)
    const expect0 = 123;
    const expect1 = 321;

    const output0 = context.createFloat2D(width, height)
    const output1 = context.createFloat2D(width, height)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert(expect0 === output0.get(x, y), `output0[${x}, ${y}]  got: ${output0.get(x, y)} expect: ${expect0}`)
        test.assert(expect1 === output1.get(x, y), `output1[${x}, ${y}]  got: ${output1.get(x, y)} expect: ${expect1}`)
      }
    }

    output0.dispose()
    output1.dispose()
    program.dispose()
  })
  runner.describe(`gpu-map-many: float3D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [float, float] thread (int x, int y, int z) {
        thread[0] = 123.0;
        thread[1] = 321.0;
      }
    `)

    const expect0 = 123;
    const expect1 = 321;

    const output0 = context.createFloat3D(width, height, depth)
    const output1 = context.createFloat3D(width, height, depth)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()
    
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert(expect0 === output0.get(x, y, z), `output0[${x}, ${y}, ${z}]  got: ${output0.get(x, y, z)} expect: ${expect0}`)
          test.assert(expect1 === output1.get(x, y, z), `output1[${x}, ${y}, ${z}]  got: ${output1.get(x, y, z)} expect: ${expect1}`)
        }
      }
    }

    output0.dispose()
    output1.dispose()
    program.dispose()
  })

  runner.describe(`gpu-map-many: color1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color, color] thread (int x) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
        thread[1] = vec4(0.0, 1.0, 0.0, 1.0);
      }
    `)

    const expect0 = [255, 0,   255, 0  ]
    const expect1 = [0,   255, 0,   255]

    const output0 = context.createColor1D(width)
    const output1 = context.createColor1D(width)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()

    for(let x = 0; x < output0.width; x++) {
      test.equal(expect0, output0.get(x), `output0[${x}]  got: ${output0.get(x)} expect: ${expect0}`)
      test.equal(expect1, output1.get(x), `output1[${x}]  got: ${output1.get(x)} expect: ${expect1}`)
    }

    output0.dispose()
    output1.dispose()
    program.dispose()
  })
  runner.describe(`gpu-map-many: color2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color, color] thread (int x, int y) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
        thread[1] = vec4(0.0, 1.0, 0.0, 1.0);
      }
    `)
    const expect0 = [255, 0,   255, 0  ]
    const expect1 = [0,   255, 0,   255]

    const output0 = context.createColor2D(width, height)
    const output1 = context.createColor2D(width, height)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.equal(expect0, output0.get(x, y), `output0[${x}, ${y}]  got: ${output0.get(x, y)} expect: ${expect0}`)
        test.equal(expect1, output1.get(x, y), `output1[${x}, ${y}]  got: ${output1.get(x, y)} expect: ${expect1}`)
      }
    }

    output0.dispose()
    output1.dispose()
    program.dispose()
  })
  
  runner.describe(`gpu-map-many: color3D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      [color, color] thread (int x, int y, int z) {
        thread[0] = vec4(1.0, 0.0, 1.0, 0.0);
        thread[1] = vec4(0.0, 1.0, 0.0, 1.0);
      }
    `)


    const expect0 = [255, 0,   255, 0  ]
    const expect1 = [0,   255, 0,   255]

    const output0 = context.createColor3D(width, height, depth)
    const output1 = context.createColor3D(width, height, depth)
    program.execute([output0, output1], {})
    output0.pull()
    output1.pull()
    
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.equal(expect0, output0.get(x, y, z), `output0[${x}, ${y}, ${z}]  got: ${output0.get(x, y, z)} expect: ${expect0}`)
          test.equal(expect1, output1.get(x, y, z), `output1[${x}, ${y}, ${z}]  got: ${output1.get(x, y, z)} expect: ${expect1}`)
        }
      }
    }

    output0.dispose()
    output1.dispose()
    program.dispose()
  })
}



