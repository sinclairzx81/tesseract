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

//-----------------------------------------------------------------------//
//                                                                       //
//  tesseract compute script transform                                   //
//                                                                       //
//  the following script transforms the tesseract thread function,       //
//  uniform buffers and indexing hints into a GLSL vertex and fragment   //
//  shaders.                                                             //
//                                                                       //
//  this script is also responsible for extracting meta information      //
//  about the script that the program uses during its binding process.   //
//                                                                       //
//-----------------------------------------------------------------------//
//                                                                       //
//  uniform Float2D matrix;  <- [expand]                                 //
//  uniform Float1D input;   <- [expand]                                 //
//                                                                       //
//  [outputs targets]   [indexing mode]                                  //
//         |                  |                                          //
//  [float, color] thread (int o) {                                      //
//                                                                       //
//    float sum = 0.0;    [rewrite]                                      //
//                            |                                          //
//    for(let i = 0; i < input.width; i++) {                             //
//                                                                       //
//      sum += input[i] * matrix[i][o];                                  //
//                   |             |                                     //
//               [rewrite]     [rewrite]                                 //
//    }                                                                  //
//                                                                       //
//    thread[0] = sum; <-- [write float on red channel]                  //
//                                                                       //
//    thread[1] = vec4(0, 0, 0, 0);                                      //
//  }                                                                    //
//                                                                       //
//-----------------------------------------------------------------------//

type MatchResult = { 
  literal  : string, 
  captures : string[] 
}
const matcher = (_expr: string = "") => {
  const extract = (code: string, regex: RegExp): Array<MatchResult> => {
    const buffer = []
    while (true) {
      const match = regex.exec(code)
      if (!match) {
        return buffer
      } else {
        if(match[0].length === 0) throw Error("zero length match.")
        code = code.substr(match.index + match[0].length)
        const literal  = match.shift()
        const captures = match;
        buffer.push({ literal, captures })
      }
    }
  };
  return {
    literal           : (x: string) => matcher(_expr + x),
    alphanumeric      : () => matcher(_expr + "\\w+"),
    numberic          : () => matcher(_expr + "[0-9]+"),
    anything          : () => matcher(_expr + ".*"),
    codeblock         : () => matcher(_expr + "[\\w\\s\\+\\-\\*\\/%\\(\),:;]+"),
    space             : () => matcher(_expr + "\\s"),
    space_optional    : () => matcher(_expr + "\\s*"),
    space_mandated    : () => matcher(_expr + "\\s+"),
    colon             : () => matcher(_expr + ":"),
    semicolon         : () => matcher(_expr + ";"),
    dot               : () => matcher(_expr + "\\."),
    comma             : () => matcher(_expr + "\\,"),
    bracket_open      : () => matcher(_expr + "\\["),
    bracket_close     : () => matcher(_expr + "\\]"),
    parentheses_open  : () => matcher(_expr + "\\("),
    parentheses_close : () => matcher(_expr + "\\)"),
    curly_open        : () => matcher(_expr + "\\{"),
    curly_close       : () => matcher(_expr + "\\}"),
    capture           : (_inner: any) => matcher(_expr + "(" + _inner.expr() + ")"),
    upto              : (_inner: any) => matcher(_expr + _inner.expr() + "?"),
    anyof             : (_inner: Array<any>) => matcher(_expr + "[" + _inner.map(n => n.expr()).join("|") + "]*"),
    optional          : (_inner: any) => matcher(_expr + "[" + _inner.expr() + "]*"),
    expr              : () => _expr,
    match             : (s: string) =>  extract(s, new RegExp(_expr))
  }
}

type IndexingType = "error" | "1D" | "2D" | "3D"
type OutputType   = "color" | "float"
interface ThreadFunctionDefinition {
  indexing : IndexingType
  outputs  : OutputType[]
}
export const read_program_thread_function = (code): ThreadFunctionDefinition => {
  const expression = matcher()
  .bracket_open()
  .capture(matcher().codeblock())
  .bracket_close()
  .space_optional()
  .literal("thread")
  .space_optional()
  .parentheses_open()
  .capture(matcher().codeblock())
  .parentheses_close()
  const results = expression.match(code)
  if(results.length === 0) {
    return {
      indexing  : "error",
      outputs: [],
    }
  }
  const outputs = results[0].captures[0].split(",").map(n => n.trim()) as OutputType[]
  for(let i = 0; i < outputs.length; i++) {
    if(outputs[i] !== "float" && outputs[i] !== "color") {
      return {
        indexing  : "error",
        outputs: [],
      }
    }
  }
  const argumentCount = results[0].captures[1].split(",").length
  let indexing:IndexingType = "error"
  switch(argumentCount) {
    case 1: indexing = "1D"; break;
    case 2: indexing = "2D"; break;
    case 3: indexing = "3D"; break;
    default: indexing = "error"; break;
  }
  return {
    indexing: indexing,
    outputs : outputs
  }
}
export const read_program_uniforms = (code): Array<{type: string, name: string}> => {
  const expression = matcher()
    .literal("uniform")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .upto(matcher().semicolon())
  return expression.match(code).map(match => ({
    type: match.captures[0],
    name: match.captures[1]
  }))
}
export const replace_thread_output_indexer = (code: string) => {
  const results = 
    matcher()
    .bracket_open()
    .capture( matcher().codeblock() )
    .bracket_close()
    .space_optional()
    .literal("thread")
    .space_optional()
    .parentheses_open()
    .codeblock() 
    .parentheses_close()
    .space_optional()
    .curly_open()
    .match(code)
  const outputs = results[0].captures[0].split(",").map(n => n.trim())
  return outputs.reduce((code, output, index) => {
    return matcher()
    .literal("thread")
    .space_optional()
    .bracket_open()
    .space_optional()
    .capture(matcher().literal(index.toString()))
    .space_optional()
    .bracket_close()  
    .match(code).reduce((acc, match) => {
      switch(output) {
        case "float": return acc.replace(match.literal, `nc_thread_output_${index}.r`);
        case "color": return acc.replace(match.literal, `nc_thread_output_${index}`);
      }
      return acc;
    }, code)
  }, code)  
}
export const replace_thread_output_dimensions = (code: string) => {
  return code.replace(/thread.width/g,  "nc_thread_output_width")
             .replace(/thread.height/g, "nc_thread_output_height")
             .replace(/thread.depth/g,  "nc_thread_output_depth")
}
export const replace_thread_signature = (code: string) => {
  const results = 
   matcher()
  .bracket_open()
  .codeblock()
  .bracket_close()
  .space_optional()
  .literal("thread")
  .space_optional()
  .parentheses_open()
  .capture(matcher().codeblock())
  .parentheses_close()
  .match(code)
  return results.reduce((acc, extraction) => {
    return acc.replace(extraction.literal, `void thread(${extraction.captures[0]})`)
  }, code)
}
export const replace_float1D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_float1D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `nc_decode (
          texture ( 
            nc_uniform_${name}_texture,
            nc_select_1D (
              nc_uniform_${name}_textureWidth,
              nc_uniform_${name}_textureHeight,
              nc_uniform_${name}_width,
              ${result.captures[0]}
            )
          )
        )`)
    }, acc)
  }, code)
}
export const replace_float1D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_float2D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_height;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_float2D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `nc_decode (
          texture ( 
            nc_uniform_${name}_texture,
            nc_select_2D (
              nc_uniform_${name}_textureWidth,
              nc_uniform_${name}_textureHeight,
              nc_uniform_${name}_width,
              nc_uniform_${name}_height,
              ${result.captures[0]},
              ${result.captures[1]}
            )
          )
        )`)
    }, acc)
  }, code)
}
export const replace_float2D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_float2D_height = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("height").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_height`), acc)
  }, code)
}
export const replace_float3D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_height;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_depth;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_float3D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `nc_decode(
          texture( 
            nc_uniform_${name}_texture,
            nc_select_3D (
              nc_uniform_${name}_textureWidth,
              nc_uniform_${name}_textureHeight,
              nc_uniform_${name}_width,
              nc_uniform_${name}_height,
              nc_uniform_${name}_depth,
              ${result.captures[0]},
              ${result.captures[1]},
              ${result.captures[2]}
            )
          )
        )`)
    }, acc)
  }, code)
}
export const replace_float3D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_float3D_height = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("height").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_height`), acc)
  }, code)
}
export const replace_float3D_depth = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Float3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("depth").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_depth`), acc)
  }, code)
}
export const replace_color1D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_color1D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `texture( 
        nc_uniform_${name}_texture,
        nc_select_1D (
          nc_uniform_${name}_textureWidth,
          nc_uniform_${name}_textureHeight,
          nc_uniform_${name}_width,
          ${result.captures[0]}
        )
      )`)
    }, acc)
  }, code)
}
export const replace_color1D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color1D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_color2D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_height;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_color2D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `texture( 
        nc_uniform_${name}_texture,
        nc_select_2D (
          nc_uniform_${name}_textureWidth,
          nc_uniform_${name}_textureHeight,
          nc_uniform_${name}_width,
          nc_uniform_${name}_height,
          ${result.captures[0]},
          ${result.captures[1]}
        )
      )`)
    }, acc)
  }, code)
}
export const replace_color2D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_color2D_height = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color2D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("height").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_height`), acc)
  }, code)
}
export const replace_color3D_uniform = (code: string) => {
  const results = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
  return results.reduce((acc, result) => {
    const replacement = ["\n"]
    replacement.push(`uniform sampler2D nc_uniform_${result.captures[0]}_texture;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureWidth;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_textureHeight;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_width;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_height;`)
    replacement.push(`uniform int       nc_uniform_${result.captures[0]}_depth;`)
    return acc.replace(result.literal, replacement.join("\n"))
  }, code)
}
export const replace_color3D_indexer = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher()
      .literal(name)
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .space_optional()
      .bracket_open()
      .capture(matcher().codeblock())
      .bracket_close()
      .match(acc)
    
    return results.reduce((acc, result) => {
      return acc.replace(result.literal, `texture( 
          nc_uniform_${name}_texture,
          nc_select_3D (
            nc_uniform_${name}_textureWidth,
            nc_uniform_${name}_textureHeight,
            nc_uniform_${name}_width,
            nc_uniform_${name}_height,
            nc_uniform_${name}_depth,
            ${result.captures[0]},
            ${result.captures[1]},
            ${result.captures[2]}
          )
        )`)
    }, acc)
  }, code)
}
export const replace_color3D_width = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("width").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_width`), acc)
  }, code)
}
export const replace_color3D_height = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("height").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_height`), acc)
  }, code)
}
export const replace_color3D_depth = (code: string) => {
  const names = matcher()
    .literal("uniform")
    .space_mandated()
    .literal("Color3D")
    .space_mandated()
    .capture(matcher().alphanumeric())
    .space_optional()
    .semicolon()
    .match(code)
    .map(n => n.captures[0])
  
  return names.reduce((acc, name) => {
    const results = matcher().literal(name).dot().literal("depth").match(acc)  
    return results.reduce((acc, result) => 
      acc.replace(result.literal, `nc_uniform_${name}_depth`), acc)
  }, code)
}

const endianness = (() => {
  const b = new ArrayBuffer(4);
  const a = new Uint32Array(b);
  const c = new Uint8Array(b);
  a[0] = 0xdeadbeef;
  if (c[0] === 0xef) return 'LE';
  if (c[0] === 0xde) return 'BE';
  throw new Error('unknown endianness');
})();


export const get_thread_directives = () => [
  "#version 300 es",
  "precision highp float;",
  ""
].join("\n")

export const get_thread_integer_mod = () => [
  "vec2 nc_int_mod(vec2 x, float y) {",
  "  vec2 res = floor(mod(x, y));",
  "  return res * step(1.0 - floor(y), -res);",
  "}",
  "vec3 nc_int_mod(vec3 x, float y) {",
  "  vec3 res = floor(mod(x, y));",
  "  return res * step(1.0 - floor(y), -res);",
  "}",
  "vec4 nc_int_mod(vec4 x, vec4 y) {",
  "  vec4 res = floor(mod(x, y));",
  "  return res * step(1.0 - floor(y), -res);",
  "}",
  "highp float nc_int_mod(highp float x, highp float y) {",
  "  highp float res = floor(mod(x, y));",
  "  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);",
  "}",
  "highp int nc_int_mod(highp int x, highp int y) {",
  "  return int(nc_int_mod(float(x), float(y)));",
  "}",
  ""
].join("\n")

export const get_thread_encode_functions = () => [
  "const vec2 MAGIC_VEC        = vec2(1.0, -256.0);",
  "const vec4 SCALE_FACTOR     = vec4(1.0, 256.0, 65536.0, 0.0);",
  "const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536);",
  "",
  "highp float nc_decode(highp vec4 rgba) {",
  (endianness === "BE") ? " rgba.rgba = rgba.abgr;" : "",
  "  rgba *= 255.0;",
  "  vec2 gte128;",
  "  gte128.x = rgba.b >= 128.0 ? 1.0 : 0.0;",
  "  gte128.y = rgba.a >= 128.0 ? 1.0 : 0.0;",
  "  float exponent = 2.0 * rgba.a - 127.0 + dot(gte128, MAGIC_VEC);",
  "  float res = exp2(round(exponent));",
  "  rgba.b = rgba.b - 128.0 * gte128.x;",
  "  res = dot(rgba, SCALE_FACTOR) * exp2(round(exponent-23.0)) + res;",
  "  res *= gte128.y * -2.0 + 1.0;",
  "  return res;",
  "}",
  "",
  "highp vec4 nc_encode(highp float f) {",
  "  highp float F = abs(f);",
  "  highp float sign = f < 0.0 ? 1.0 : 0.0;",
  "  highp float exponent = floor(log2(F));",
  "  highp float mantissa = (exp2(-exponent) * F);",
  "  // exponent += floor(log2(mantissa));",
  "  vec4 rgba = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;",
  "  rgba.rg = nc_int_mod(rgba.rg, 256.0);",
  "  rgba.b = nc_int_mod(rgba.b, 128.0);",
  "  rgba.a = exponent*0.5 + 63.5;",
  "  rgba.ba += vec2(nc_int_mod(exponent+127.0, 2.0), sign) * 128.0;",
  "  rgba = floor(rgba);",
  "  rgba *= 0.003921569; // 1/255",
  (endianness === "BE") ? " rgba.rgba = rgba.abgr;" : "",
  "  return rgba;",
  "}",
  ""
].join("\n")


export const get_thread_select_functions = () => [
  "vec2 nc_select_1D (int textureWidth, int textureHeight, int width, int index_x) {",
  "  float x = float(index_x % textureWidth) + 0.5;",
  "  float y = float(index_x / textureWidth) + 0.5;",
  "  return vec2 (",
  "    x / float(textureWidth),",
  "    y / float(textureHeight)",
     ");",
  "}",
  "",
  "vec2 nc_select_2D (int textureWidth, int textureHeight, int width, int height, int index_x, int index_y) {",
  "  float mx = (1.0 / ( float(textureWidth ) ) );",
  "  float my = (1.0 / ( float(textureHeight) ) );",
  "  float x  = ( float(index_x) + 0.5) * mx;",
  "  float y  = ( float(index_y) + 0.5) * my;",
  "  return vec2(x, y);",
  "}",
  "",
  "vec2 nc_select_3D (int textureWidth, int textureHeight, int width, int height, int depth, int index_x, int index_y, int index_z) {",
  "  int i = index_x + (index_y * width) + (index_z * (width * height));",
  "  float x = float(i % textureWidth) + 0.5;",
  "  float y = float(i / textureWidth) + 0.5;",
  "  return vec2 (",
  "    x / float(textureWidth),",
  "    y / float(textureHeight)",
     ");",
  "}",
  ""
].join("\n")

export const get_thread_uniforms = () => [
  "uniform int   nc_thread_viewport_width;",
  "uniform int   nc_thread_viewport_height;",
  "",
  "uniform int   nc_thread_output_width;",
  "uniform int   nc_thread_output_height;",
  "uniform int   nc_thread_output_depth;",
  "",
  "in      vec2  nc_thread_uv;",
  ""
].join("\n")

export const get_thread_output_register = (thread: ThreadFunctionDefinition) => {
  return thread.outputs.reduce((acc, output, index) => {
    return acc + `layout(location = ${index}) out vec4 nc_thread_output_${index};\n`
  }, "") + "\n"
}

export const get_thread_main = (thread: ThreadFunctionDefinition) => {
  const buffer = []
  switch(thread.indexing) {
    case "1D": 
      buffer.push("void main() {")
      buffer.push("  int x = int( nc_thread_uv.x * float( nc_thread_viewport_width  ) );")
      buffer.push("  int y = int( nc_thread_uv.y * float( nc_thread_viewport_height ) );")
      buffer.push("  int ix = x + ( y * nc_thread_viewport_width );")
      buffer.push("  ")
      buffer.push("  thread (ix);")
      break;
    case "2D":
      buffer.push("void main() {")
      buffer.push("  int ix = int( nc_thread_uv.x * float ( nc_thread_viewport_width  ) );")
      buffer.push("  int iy = int( nc_thread_uv.y * float ( nc_thread_viewport_height ) );")
      buffer.push("  thread(ix, iy);")
      break;
    case "3D":
      buffer.push("void main() {")
      buffer.push("  int x  = int( nc_thread_uv.x * float ( nc_thread_viewport_width  ) );")
      buffer.push("  int y  = int( nc_thread_uv.y * float ( nc_thread_viewport_height ) );")
      buffer.push("  int i  = x + ( y * nc_thread_viewport_width );")
      buffer.push("")
      buffer.push("  int ix = ( i / ( 1                                               ) ) % nc_thread_output_width;") 
      buffer.push("  int iy = ( i / ( nc_thread_output_width                          ) ) % nc_thread_output_height;")
      buffer.push("  int iz = ( i / ( nc_thread_output_width * nc_thread_output_height) ) % nc_thread_output_depth;")
      buffer.push("  thread(ix, iy, iz);")
      break;
  }
  if(thread.indexing !== "error") {
    thread.outputs.forEach((output, index) => {
      switch(output) {
        case "float":
          buffer.push(`  nc_thread_output_${index} = nc_encode(nc_thread_output_${index}.r);`)
          break;
      }
    })
    buffer.push("}")
  }
  return buffer.join("\n")
}

export const get_vertex_program = () => [
  "#version 300 es",
  "precision highp float;",
  "",
  "in  vec3 nc_thread_position;",
  "in  vec2 nc_thread_texcoord;",
  "out vec2 nc_thread_uv;",
  "",
  "void main() {",
  "  nc_thread_uv  = nc_thread_texcoord;",
  "",
  "  gl_Position = vec4 (",
  "    nc_thread_position.x,",
  "    nc_thread_position.y,",
  "    nc_thread_position.z,", 
  "    1.0);",
  "}"
].join("\n")



export interface Script {
  uniforms  : Array<{type: string, name: string}>,
  thread    : ThreadFunctionDefinition
  vertex    : string,
  fragment  : string
}

export const transform = (code: string): any => {
  //-------------------------------------------
  // remove comments
  //-------------------------------------------
  code = code.split("\n").map(line => {
    const index = line.indexOf("//")
    return (index !== -1)
      ? line.slice(0, index)
      : line
  }).join("\n")
  
  //-------------------------------------------
  // inspect
  //-------------------------------------------
  const thread   = read_program_thread_function (code)
  const uniforms = read_program_uniforms        (code)
  if(thread.indexing === "error") {
    throw Error(`program is invalid.`)
  }

  //-------------------------------------------
  // floats
  //-------------------------------------------
  code = replace_float1D_indexer  (code)
  code = replace_float1D_width    (code)
  code = replace_float1D_uniform  (code)
  code = replace_float2D_indexer  (code)
  code = replace_float2D_width    (code)
  code = replace_float2D_height   (code)
  code = replace_float2D_uniform  (code)
  code = replace_float3D_indexer  (code)
  code = replace_float3D_width    (code)
  code = replace_float3D_height   (code)
  code = replace_float3D_depth    (code)
  code = replace_float3D_uniform  (code)

  //-------------------------------------------
  // colors
  //-------------------------------------------
  code = replace_color1D_indexer  (code)
  code = replace_color1D_width    (code)
  code = replace_color1D_uniform  (code)
  code = replace_color2D_indexer  (code)
  code = replace_color2D_width    (code)
  code = replace_color2D_height   (code)
  code = replace_color2D_uniform  (code)
  code = replace_color3D_indexer  (code)
  code = replace_color3D_width    (code)
  code = replace_color3D_height   (code)
  code = replace_color3D_depth    (code)
  code = replace_color3D_uniform  (code)

  //-------------------------------------------
  // thread
  //-------------------------------------------
  code = replace_thread_output_indexer      (code)
  code = replace_thread_output_dimensions   (code)
  code = replace_thread_signature           (code)
  
  const fragment = [
    get_thread_directives(),
    get_thread_uniforms(),
    get_thread_output_register(thread),
    get_thread_integer_mod(),
    get_thread_encode_functions(),
    get_thread_select_functions(),
    code,
    get_thread_main(thread)
  ].join("\n")
  
  return {
    thread   : thread,
    uniforms : uniforms,
    vertex   : get_vertex_program(),
    fragment : fragment
  }
}
