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

import { Context }          from "../src/index"
import { TestRunner }       from "./run/index"

//-----------------------------------------------------------
// memory tests run across the GPU
//-----------------------------------------------------------
import * as cpu_getset       from "./cpu/getset"
import * as cpu_map          from "./cpu/map"
import * as gpu_map_index    from "./gpu/map-index"
import * as gpu_map_uniform  from "./gpu/map-uniform"
import * as gpu_map_one      from "./gpu/map-one"
import * as gpu_map_many     from "./gpu/map-many"
import * as gpu_copy_one     from "./gpu/copy-one"
import * as gpu_copy_many    from "./gpu/copy-many"

//-----------------------------------------------------------
// single pass memory test for the given dimension.
//-----------------------------------------------------------
const memory_test_single = (runner:TestRunner, context:Context, width: number, height: number, depth: number) => {
  cpu_getset.create      (runner, context, width, height, depth)
  cpu_map.create         (runner, context, width, height, depth)
  gpu_map_index.create   (runner, context, width, height, depth)
  gpu_map_uniform.create (runner, context, width, height, depth)
  gpu_map_one.create     (runner, context, width, height, depth)
  gpu_map_many.create    (runner, context, width, height, depth)
  gpu_copy_one.create    (runner, context, width, height, depth)
  gpu_copy_many.create   (runner, context, width, height, depth)
}

//-----------------------------------------------------------
// full scan memory test.
//-----------------------------------------------------------
const memory_test_full = (runner: TestRunner, context: Context) => {
  for(let depth = 12; depth < (16 - 1); depth++) {
    for(let height = 12; height < (16 - 1); height++) {
      for(let width = 12; width < (16 - 1); width++) {
        memory_test_single(runner, context, width, height, depth)
      }
    }
  }
}

const runner  = new TestRunner("log")
const context = new Context()
memory_test_full(runner, context)
runner.run()


// const program = context.createProgram(`
//   uniform int     value_int;
//   uniform float   value_float;
//   uniform Float1D value_float1D;
//   uniform Float2D value_float2D;
//   uniform Float3D value_float3D;
//   uniform Color1D value_color1D;
//   uniform Color2D value_color2D;
//   uniform Color3D value_color3D;
  
//   [float] thread(int x) {
//     thread[0] = value_float2D[x][0];
//   }
// `)

// console.log(JSON.stringify(program.script.uniforms, null, 2))
// const output = context.createFloat1D(2)

// const value_int      = 1
// const value_float    = 1
// const value_float1D  = context.createFloat1D(1).map(x => 56).push()
// const value_float2D  = context.createFloat2D(1, 1).map(x => 42).push()
// const value_float3D  = context.createFloat3D(1, 1, 1).map(x => 11).push()
// const value_color1D  = context.createColor1D(1).map(x => [0, 0, 0, 0]).push()
// const value_color2D  = context.createColor2D(1, 1).map(x => [0, 0, 0, 0]).push()
// const value_color3D  = context.createColor3D(1, 1, 1).map(x => [0, 0, 0, 0]).push()

// console.log(program.cache)

// program.execute([output], {
//   value_int,
//   value_float,
//   value_float1D,
//   value_float2D,
//   value_float3D,
//   value_color1D,
//   value_color2D,
//   value_color3D
// })

// console.log(output.pull().data)

