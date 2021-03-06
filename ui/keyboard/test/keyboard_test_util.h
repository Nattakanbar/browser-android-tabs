// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef UI_KEYBOARD_TEST_KEYBOARD_TEST_UTIL_H_
#define UI_KEYBOARD_TEST_KEYBOARD_TEST_UTIL_H_

#include "ui/keyboard/keyboard_ui.h"

namespace gfx {
class Rect;
}

namespace keyboard {

// Waits until the keyboard is fully shown, with no pending animations.
bool WaitUntilShown();

// Waits until the keyboard starts to hide, with possible pending animations.
bool WaitUntilHidden();

// Returns true if the keyboard is about to show or already shown.
bool IsKeyboardShowing();

// Returns true if the keyboard is about to hide or already hidden.
bool IsKeyboardHiding();

// Gets the calculated keyboard bounds from |root_bounds|. The keyboard height
// may be specified by |keyboard_height|, or a default height is used.
gfx::Rect KeyboardBoundsFromRootBounds(const gfx::Rect& root_bounds,
                                       int keyboard_height = 100);

}  // namespace keyboard

#endif  // UI_KEYBOARD_TEST_KEYBOARD_TEST_UTIL_H_
