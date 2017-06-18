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
// gpu-copy-one: 
//
// these tests test that 1 input image can be copies to an
// output image by way of a compute program. this indirectly
// tests that the thread indexers are correct, and that the
// buffer sampler select() operation is sampling correctly.
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {

  runner.describe(`gpu-copy-one: float1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float1D input;
      [float] thread (int x) {
        thread[0] = input[x];
      }
    `)
    const input   = context.createFloat1D(width).map(x => Math.floor(Math.random() * 512)).push()
    const output0 = context.createFloat1D(width)
    program.execute([output0], { input })
    output0.pull()

    for(let x = 0; x < width; x++) {
      test.assert( input.get(x) === output0.get(x), `output0[${x}] got: ${output0.get(x)} expect: ${input.get(x)}`)
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })

  runner.describe(`gpu-copy-one: float2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float2D input;
      [float] thread (int x, int y) {
        thread[0] = input[x][y];
      }
    `)
    const input   = context.createFloat2D(width, height).map(x => Math.floor(Math.random() * 512)).push()
    const output0 = context.createFloat2D(width, height)
    program.execute([output0], { input })
    output0.pull()
    
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert( input.get(x, y) === output0.get(x, y), `output0[${x}] got: ${output0.get(x, y)} expect: ${input.get(x, y)}`)
      }
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })

  runner.describe(`gpu-copy-one: float3D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Float3D input;
      [float] thread (int x, int y, int z) {
        thread[0] = input[x][y][z];
      }
    `)

    const input   = context.createFloat3D(width, height, depth).map(x => Math.floor(Math.random() * 512)).push()
    const output0 = context.createFloat3D(width, height, depth)
    program.execute([output0], { input })
    output0.pull()

    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert( input.get(x, y, z) === output0.get(x, y, z), `output0[${x}, ${y}, ${z}] got: ${output0.get(x, y, z)} expect: ${input.get(x, y, z)}`)
        }
      }
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })

  runner.describe(`gpu-copy-one: color1D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Color1D input;
      [color] thread (int x) {
        thread[0] = input[x];
      }
    `)

    const input   = context.createColor1D(width).map(x => [
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256)
    ]).push()

    const output0 = context.createColor1D(width)
    program.execute([output0], { input })
    output0.pull()

    for(let x = 0; x < width; x++) {
      test.equal(input.get(x), output0.get(x), `output0[${x}] got: ${output0.get(x)} expect: ${input.get(x)}`)
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })

  runner.describe(`gpu-copy-one: color2D ${width}x${height}x${depth}`, test => {
    const program = context.createProgram(`
      uniform Color2D input;
      [color] thread (int x, int y) {
        thread[0] = input[x][y];
      }
    `)

    const input   = context.createColor2D(width, height).map(x => [
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256)
    ]).push()

    const output0 = context.createColor2D(width, height)
    program.execute([output0], { input })
    output0.pull()
    
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.equal( input.get(x, y), output0.get(x, y), `output0[${x}, ${y}] got: ${output0.get(x, y)} expect: ${input.get(x, y)}`)
      }
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })

  runner.describe(`gpu-copy-one: color3D ${width}x${height}x${depth}`, test => {
    
    const program = context.createProgram(`
      uniform Color3D input;
      [color] thread (int x, int y, int z) {
        thread[0] = input[x][y][z];
      }
    `)
    
    const input   = context.createColor3D(width, height, depth).map(x => [
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256), 
      Math.floor(Math.random() * 256)
    ]).push()

    const output0 = context.createColor3D(width, height, depth)
    program.execute([output0], { input })
    output0.pull()
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.equal( input.get(x, y, z), output0.get(x, y, z), `output0[${x}, ${y}, ${z}] got: ${output0.get(x, y, z)} expect: ${input.get(x, y, z)}`)
        }
      }
    }

    output0.dispose()
    input.dispose()
    program.dispose()
  })
}





