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
// map: tests the CPU buffer map() function. depends heavily
// on get/set. Here we are testing the mapping is working as
// expected. 
//
//-----------------------------------------------------------
export const create = (runner: TestRunner, context: Context, width: number, height: number, depth: number) => {
  runner.describe(`cpu-map: float1D ${width}x${height}x${depth}`, test => {
    let   count = 0
    const input = context.createFloat1D(width).map(x => {
      const result = count
      count += 1;
      return result
    })

    count = 0
    for(let x = 0; x < width; x++) {
      test.assert(input.get(x) === count, `input[${x}] got ${input.get(x)} expected ${count}`)
      count += 1
    }
    input.dispose()
  })

  runner.describe(`cpu-map: float2D ${width}x${height}x${depth}`, test => {
    let count    = 0
    const input  = context.createFloat2D(width, height).map((x, y) => {
      const result = count
      count += 1;
      return result
    })
    
    count = 0
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        test.assert(input.get(x, y) === count, `input[${x}, ${y}] got ${input.get(x, y)} expected ${count}`)
        count += 1
      }
    }
    
    input.dispose()
  })

  runner.describe(`cpu-map: float3D ${width}x${height}x${depth}`, test => {
    let count    = 0
    const input  = context.createFloat3D(width, height, depth).map((x, y, z) => {
      const result = count
      count += 1;
      return result
    })
    count = 0
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          test.assert(input.get(x, y, z) === count, `input[${x}, ${y}, ${z}] got ${input.get(x, y, z)} expected ${count}`)
          count += 1
        }
      }
    }
    input.dispose()
  })

  runner.describe(`cpu-map: color1D ${width}x${height}x${depth}`, test => {
    let   count = 0
    const input = context.createColor1D(width).map(x => {
      const result = [(count % 256), (count % 256), (count % 256), (count % 256)]
      count += 1;
      return result
    })

    count = 0
    for(let x = 0; x < width; x++) {
      const expect = [(count % 256), (count % 256), (count % 256), (count % 256)]
      test.equal(input.get(x), expect, `input.get(${x}) returned ${input.get(x)} expected ${expect}`)
      count += 1
    }

    input.dispose()
  })

  runner.describe(`cpu-map: color2D ${width}x${height}x${depth}`, test => {
    let count    = 0
    const input  = context.createColor2D(width, height).map((x, y) => {
      const result = [(count % 256), (count % 256), (count % 256), (count % 256)]
      count += 1;
      return result
    })
    
    count = 0
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        const expect = [(count % 256), (count % 256), (count % 256), (count % 256)]
        test.equal(input.get(x, y), expect, `input[${x}, ${y}] got ${input.get(x, y)} expected ${count}`)
        count += 1
      }
    }
    
    input.dispose()
  })

  runner.describe(`cpu-map: color3D ${width}x${height}x${depth}`, test => {
    let count    = 0
    const input  = context.createColor3D(width, height, depth).map((x, y, z) => {
      const result = [(count % 256), (count % 256), (count % 256), (count % 256)]
      count += 1;
      return result
    })

    count = 0
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          const expect = [(count % 256), (count % 256), (count % 256), (count % 256)]
          test.equal(input.get(x, y, z), expect, `input[${x}, ${y}, ${z}] got ${input.get(x, y, z)} expected ${count}`)
          count += 1
        }
      }
    }
    input.dispose()
  })
}



