/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import {unescape} from './index';

describe('util.unescape', () => {
  it('should unescape octal correctly', () => {
    expect(unescape('\\001\\002\\343').length).toBe(3);
  });

  it('should unescape special chars', () => {
    expect(unescape('\\001\\377\\n\\"\\\\\\r\\\'').length).toBe(7);
    expect(unescape(
               '\\001\\000\\000\\000\\r\\000\\000' +
               '\\000\\r\\000\\000\\000\\000\\002\\000\\000')
               .length)
        .toBe(16);
  });
});