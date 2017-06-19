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
//
// memory tests run across the GPU
//
//-----------------------------------------------------------
import * as cpu_getset       from "./cpu/getset"
import * as cpu_map          from "./cpu/map"
import * as gpu_map_index    from "./gpu/map-index"
import * as gpu_map_uniform  from "./gpu/map-uniform"
import * as gpu_map_one      from "./gpu/map-one"
import * as gpu_map_many     from "./gpu/map-many"
import * as gpu_copy_one     from "./gpu/copy-one"
import * as gpu_copy_many    from "./gpu/copy-many"
import * as gpu_reduce       from "./gpu/gpu-reduce"

//-----------------------------------------------------------
//
// single pass memory test for the given dimension.
//
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
  gpu_reduce.create      (runner, context, width, height, depth)
}

//-----------------------------------------------------------
//
// full scan memory test.
//
//-----------------------------------------------------------
const memory_test_full = (runner: TestRunner, context: Context) => {
  const min = 1
  const max = 4
  for(let depth = min; depth < max; depth++) {
    for(let height = min; height < max; height++) {
      for(let width = min; width < max; width++) {
        memory_test_single(runner, context, width, height, depth)
      }
    }
  }
}

const runner  = new TestRunner("log")
const context = new Context()
memory_test_full(runner, context)
runner.run()



