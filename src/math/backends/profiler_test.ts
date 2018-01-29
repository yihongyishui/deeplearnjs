/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {NDArray, Scalar} from '../ndarray';

import {BackendTimer} from './backend';
import {Kernel} from './kernel_registry';
import {Logger, Profiler} from './profiler';
import {TypedArray} from './webgl/tex_util';

class TestBackendTimer implements BackendTimer {
  constructor(private delayMs: number, private queryTimeMs: number) {}

  async time(query: () => NDArray): Promise<number> {
    query();
    return this.queryTimeMs;
  }

  startTimer(): {} {
    return {};
  }
  endTimer(query: {}): {} {
    return {};
  }
  async getQueryTime(query: {}): Promise<number> {
    return new Promise<number>(resolve => {
      setTimeout(() => resolve(this.queryTimeMs), this.delayMs);
    });
  }
}

class TestLogger extends Logger {
  logKernelProfile(
      kernelName: Kernel, result: NDArray, vals: TypedArray, timeMs: number) {}
}

describe('profiler.Profiler', () => {
  it('profiles simple function', doneFn => {
    const delayMs = 5;
    const queryTimeMs = 10;
    const timer = new TestBackendTimer(delayMs, queryTimeMs);
    const logger = new TestLogger();
    const profiler = new Profiler(timer, logger);

    spyOn(timer, 'startTimer').and.callThrough();
    spyOn(timer, 'endTimer').and.callThrough();
    spyOn(timer, 'getQueryTime').and.callThrough();

    spyOn(logger, 'logKernelProfile').and.callThrough();

    const startTimerSpy = timer.startTimer as jasmine.Spy;
    const endTimerSpy = timer.endTimer as jasmine.Spy;
    const getQueryTimeSpy = timer.getQueryTime as jasmine.Spy;

    const logKernelProfileSpy = logger.logKernelProfile as jasmine.Spy;

    let kernelCalled = false;
    const result = 1;
    const resultScalar = Scalar.new(result);

    profiler.profileKernel('MatMul', () => {
      kernelCalled = true;
      return resultScalar;
    });

    setTimeout(() => {
      expect(startTimerSpy.calls.count()).toBe(1);
      expect(endTimerSpy.calls.count()).toBe(1);
      expect(getQueryTimeSpy.calls.count()).toBe(1);

      expect(logKernelProfileSpy.calls.count()).toBe(1);
      expect(logKernelProfileSpy.calls.first().args).toEqual([
        'MatMul', resultScalar, new Float32Array([result]), queryTimeMs
      ]);

      expect(kernelCalled).toBe(true);
      doneFn();
    }, delayMs * 2);
  });

  it('profiles nested kernel', doneFn => {
    const delayMs = 5;
    const queryTimeMs = 10;
    const timer = new TestBackendTimer(delayMs, queryTimeMs);
    const logger = new TestLogger();
    const profiler = new Profiler(timer, logger);

    spyOn(timer, 'startTimer').and.callThrough();
    spyOn(timer, 'endTimer').and.callThrough();
    spyOn(timer, 'getQueryTime').and.callThrough();

    spyOn(logger, 'logKernelProfile').and.callThrough();

    const startTimerSpy = timer.startTimer as jasmine.Spy;
    const endTimerSpy = timer.endTimer as jasmine.Spy;
    const getQueryTimeSpy = timer.getQueryTime as jasmine.Spy;

    const logKernelProfileSpy = logger.logKernelProfile as jasmine.Spy;

    let matmulKernelCalled = false;
    let maxKernelCalled = false;
    const result = 1;
    const resultScalar = Scalar.new(result);

    profiler.profileKernel('MatMul', () => {
      const result = profiler.profileKernel('Max', () => {
        maxKernelCalled = true;
        return resultScalar;
      });
      matmulKernelCalled = true;
      return result;
    });

    setTimeout(() => {
      expect(startTimerSpy.calls.count()).toBe(1);
      expect(endTimerSpy.calls.count()).toBe(1);
      expect(getQueryTimeSpy.calls.count()).toBe(1);

      // Only MatMul should have been logged, nested kernels will be ignored,
      // however the function should be evaluated.
      expect(logKernelProfileSpy.calls.count()).toBe(1);
      expect(logKernelProfileSpy.calls.first().args).toEqual([
        'MatMul', resultScalar, new Float32Array([result]), queryTimeMs
      ]);

      expect(matmulKernelCalled).toBe(true);
      expect(maxKernelCalled).toBe(true);
      doneFn();
    }, delayMs * 2);
  });
});
