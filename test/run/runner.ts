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

import { TestContext } from "./context"
import { Logger, ConsoleLogger, ElementLogger } from "./logger"
import { ready } from "./ready"

export interface Test {
  name: string
  func: (context: TestContext) => void
}
export class TestRunner {
  private tests : Test[]
  private logger: Logger
  constructor(private elementid: string) {
    this.tests = []
  }
  public describe(name: string, func: (context: TestContext) => void) {
    this.tests.push({ name: name, func: func })
  }
  public run(): void {
    ready(() => {
      const element = document.getElementById(this.elementid)
      const logger = (element !== null)
        ? new ElementLogger(element)
        : new ConsoleLogger()

      const next = () => {
        if (this.tests.length === 0) {
          logger.log("complete")
        } else {
          const test = this.tests.shift()
          try {
            const context = new TestContext()
            const start = new Date()
            test.func(context)
            const end   = new Date()
            const delta = end.getTime() - start.getTime()
            if (context.ok()) {
              logger.log(`${test.name} ok - ${delta}ms`)
              setTimeout(() => next(), 1)
            } else {
              logger.log(`${test.name} fail`)
              context.errors().forEach(error => logger.log(` - ${error}`))
            }
          } catch (e) {
            logger.log(`${test.name}` + " exception " + e.message)
          }
        }
      }
      next()
    })

  }
}