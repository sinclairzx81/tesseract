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

import {reflect} from "./reflect"

export class TestContext {
  public _ok     : boolean  = true
  public _errors : string[] = []

  /**
   * returns if this context is ok.
   * @returns {boolean}
   */
  public ok(): boolean {
    return this._ok
  }

  /**
   * returns if this context is ok.
   * @returns {boolean}
   */
  public errors(): string[] {
    return this._errors
  }

  /**
   * asserts that a condition is true.
   * @param {boolean} cond the condition.
   * @param {string} message optional message on fail.
   * @returns {void}
   */
  public assert(cond: boolean, message: string = "") : void {
    if (!cond) {
      this._ok = false
      if (this._errors.length < 16 && message.length > 0) {
        this._errors.push(message)
      }
      return
    }
  }

  /**
   * tests that the given values are equal.
   * @param {any} a the left value.
   * @param {any} a the right value.
   * @param {string} message optional message on fail.
   * @return {void}
   */
  public equal(a: any, b: any, message: string = "") {
    const t0 = reflect(a)
    const t1 = reflect(b)
    if (t0 !== t1) {
      this._ok = false
      return
    }
    if (t0 === "array") {
      if (a.length !== b.length) {
        this._ok = false
        if (this._errors.length < 16 && message.length > 0) {
          this._errors.push(message)
        }
        return
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          this._ok = false
          if (this._errors.length < 16 && message.length > 0) {
            this._errors.push(message)
          }
          return
        }
      }
    } else {
      if (a !== b) {
        this._ok = false
        if (this._errors.length < 16 && message.length > 0) {
          this._errors.push(message)
        }
        return
      }
    }
  }
}