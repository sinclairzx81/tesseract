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
// gpu-map-prop: 
//
// tests writing buffer uniform properties to the program.
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`gpu-uniform: integer`, test => {
    const program = context.createProgram(`
      uniform int value;
      [float] thread (int x) {
        thread[0] = float(value);
      }
    `)

    const expect = 122
    const output = context.createFloat1D(16)
    program.execute([output], {
      value: expect
    })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(expect === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${expect}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float`, test => {
    const program = context.createProgram(`
      uniform float value;
      [float] thread (int x) {
        thread[0] = value;
      }
    `)

    const expect = 122
    const output = context.createFloat1D(16)
    program.execute([output], {
      value: expect
    })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(expect === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${expect}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float1D - width`, test => {
    const program = context.createProgram(`
      uniform Float1D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)

    const width  = 12
    const input  = context.createFloat1D(width)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float2D - width`, test => {
    const program = context.createProgram(`
      uniform Float2D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)

    const width  = 16
    const height = 8
    const input  = context.createFloat2D(width, height)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float2D - height`, test => {
    const program = context.createProgram(`
      uniform Float2D input;

      [float] thread (int x) {
        thread[0] = float(input.height);
      }
    `)

    const width  = 16
    const height = 8
    const input  = context.createFloat2D(width, height)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(height === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float3D - width`, test => {
    const program = context.createProgram(`
      uniform Float3D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)
    
    const width  = 16
    const height = 8
    const depth  = 4

    const input  = context.createFloat3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: float3D - height`, test => {
    const program = context.createProgram(`
      uniform Float3D input;

      [float] thread (int x) {
        thread[0] = float(input.height);
      }
    `)

    const width  = 16
    const height = 8
    const depth  = 4
    const input  = context.createFloat3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(height === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })
  runner.describe(`gpu-uniform: float3D - depth`, test => {
    const program = context.createProgram(`
      uniform Float3D input;
      
      [float] thread (int x) {
        thread[0] = float(input.depth);
      }
    `)

    const width  = 16
    const height = 8
    const depth  = 4
    const input  = context.createFloat3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { 
      input: input 
    })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(depth === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: color1D - width`, test => {
    const program = context.createProgram(`
      uniform Color1D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)

    const width  = 12
    const input  = context.createColor1D(width)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: color2D - width`, test => {
    const program = context.createProgram(`
      uniform Color2D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)

    const width  = 16
    const height = 8
    const input  = context.createColor2D(width, height)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: color2D - height`, test => {
    const program = context.createProgram(`
      uniform Color2D input;

      [float] thread (int x) {
        thread[0] = float(input.height);
      }
    `)

    const width  = 16
    const height = 8
    const input  = context.createColor2D(width, height)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(height === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: color3D - width`, test => {
    const program = context.createProgram(`
      uniform Color3D input;

      [float] thread (int x) {
        thread[0] = float(input.width);
      }
    `)
    
    const width  = 16
    const height = 8
    const depth  = 4

    const input  = context.createColor3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(width === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })

  runner.describe(`gpu-uniform: color3D - height`, test => {
    const program = context.createProgram(`
      uniform Color3D input;

      [float] thread (int x) {
        thread[0] = float(input.height);
      }
    `)

    const width  = 16
    const height = 8
    const depth  = 4
    const input  = context.createColor3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { input: input })
    output.pull()

    for(let x = 0; x < output.width; x++) {
      test.assert(height === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })
  runner.describe(`gpu-uniform: color3D - depth`, test => {
    const program = context.createProgram(`
      uniform Color3D input;

      [float] thread (int x) {
        thread[0] = float(input.depth);
      }
    `)

    const width  = 16
    const height = 8
    const depth  = 4
    const input  = context.createColor3D(width, height, depth)
    const output = context.createFloat1D(16)
    program.execute([output], { 
      input: input 
    })
    output.pull()
    
    for(let x = 0; x < output.width; x++) {
      test.assert(depth === output.get(x), `output[${x}]  got: ${output.get(x)} expect: ${width}`)
    }
    output.dispose()
    program.dispose()
  })
}
