### tesseract

A webgl 2.0 gpgpu compute library for JavaScript.

```typescript
const context = tesseract.createContext()

const program = context.createProgram(`
  [float] thread (int x) {
    thread[0] = float(x);
  }
`)

const output = context.createFloat1D([1024])

program.execute([output], {})

console.log(output.pull().data) 

// -> [0, 1, 2, 3, ...]
```

### overview

tesseract is a gpgpu compute library built against the webgl 2.0 graphics api. The library hides away the details of webgl, offering instead a simplified programming model that provides simple integer offset addressing into graphics buffers on the GPU. The library was written primarily to help assist with accellerating large vector / matrix multiplication and to assist with image map / reduce for convolution neural networks.

tesseract supports:
- 1D, 2D and 3D color and float buffer types with mapping to GLSL 300 es shader profiles.
- A simplified shader entry point ```thread``` function with resolved integer indexing to the output target.
- Integer based addressing into glsl buffers via ```[]``` syntax. 
- supports automatic 32-bit float encode/decode into RGBA for float buffer read back.
- complete support for multiple render targets (MRT) output buffers.

tesseract is a work in progress, and offered as is for anyone who finds it useful or interesting.

### building the project

tesseract is written with typescript. You can build the standalone with the following.

```
npm install typescript -g
npm install typescript-bundle -g
npm run build
```
the test project can be built with.
```
npm run build-test
```

### the thread function

tesseract programs are parsed GLSL 300 es fragment shaders. Each program defines a ```thread()``` function that is used to define the input indexing and output of the program. An example of a thread function is as follows.

```javascript
const program = context.createProgram(`
[float, color] thread (int x, int y) {
  thread[0] = 1.0; 
  thread[1] = vec4(1.0, 1.0, 1.0, 1.0);
}
`)

// outputs
const output0 = context.createFloat2D(1024, 1024)
const output1 = context.createColor2D(1024, 1024)
program.execute([output0, output1], {})
output0.pull()
output1.pull()

```
tesseract interprets this program in the following way..
- the program is only applicable for 2D buffer targets as defined by the ```(int x, int y)``` arguments.
- the program outputs to 2 buffer targets as defined by the ```[float, color]``` return type.
- the first output must be a ```Float2D``` buffer type, the second output must be a ```Color2D``` buffer type.

### thread uniforms

Like regular shaders, tesseract supports passing uniforms. tesseract provides a convienent indexer syntax which looks up the pixel integer offset of the given uniform. The following adds two buffers.

```javascript
const program = context.createProgram(`
  uniform Float1D a;
  uniform Float1D b;
  uniform float   c;

  [float] thread (int x) {
    thread[0] = a[x] + b[x] + c;
  }
`)

const a = context.createFloat1D(4096).map(x => 1).push()
const b = context.createFloat1D(4096).map(x => 2).push()
const c = 2

const output = context.createFloat1D(4096)
program.execute([output], {a, b, c})

output.pull() 

console.log(output.data) // [5, 5, 5, 5, 5, ...]
```

### buffer encoding scheme

tesseract encodes all buffers in TEXTURE_2D buffers (even 3D buffers) for generality, and currently supports 1D, 2D and 3D buffer float and color variants. Future updates to this project may allow for arbituary dimensionality of arrays.

buffers are encoded using a row major 2D encoding scheme. 

### floating point precision

tesseract currently encodes / decodes 32 bit numbers inside RGBA unsigned byte values (the only supported texture read interface for webgl). Because of this encoding, there is a loss of precision during this encode / decode phase.

Users should be aware of this precision if evaluating tesseract for simulations. 

