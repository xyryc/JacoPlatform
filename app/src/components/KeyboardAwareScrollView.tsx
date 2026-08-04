import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  UIManager,
  findNodeHandle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  keyboardGap?: number;
};

const getFocusedInput = () => {
  const state = TextInput.State as unknown as {
    currentlyFocusedInput?: () => unknown;
    currentlyFocusedField?: () => number | null;
  };

  return state.currentlyFocusedInput?.() || state.currentlyFocusedField?.() || null;
};

export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  (
    {
      children,
      keyboardGap = 18,
      keyboardShouldPersistTaps = "handled",
      onScroll,
      onStartShouldSetResponderCapture,
      scrollEventThrottle = 16,
      automaticallyAdjustKeyboardInsets = Platform.OS === "ios",
      ...props
    },
    forwardedRef
  ) => {
    const scrollRef = useRef<ScrollView>(null);
    const scrollYRef = useRef(0);
    const keyboardTopRef = useRef<number | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(forwardedRef, () => scrollRef.current as ScrollView);

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const scrollFocusedInputIntoView = useCallback((attempt = 0) => {
      const keyboardTop = keyboardTopRef.current;
      const focusedInput = getFocusedInput();
      const inputHandle =
        typeof focusedInput === "number" ? focusedInput : findNodeHandle(focusedInput as any);

      if (!keyboardTop || !inputHandle || !scrollRef.current) {
        if (attempt < 4) {
          clearRetryTimer();
          retryTimerRef.current = setTimeout(() => scrollFocusedInputIntoView(attempt + 1), 80);
        }
        return;
      }

      UIManager.measureInWindow(inputHandle, (_x, y, _width, height) => {
        const inputBottom = y + height;
        const visibleBottom = keyboardTop - keyboardGap;
        const coveredByKeyboard = inputBottom > visibleBottom;
        const aboveViewport = y < keyboardGap;

        if (!coveredByKeyboard && !aboveViewport) return;

        const nextY = coveredByKeyboard
          ? scrollYRef.current + inputBottom - visibleBottom
          : Math.max(0, scrollYRef.current + y - keyboardGap);

        scrollRef.current?.scrollTo({ y: nextY, animated: true });
      });
    }, [keyboardGap]);

    useEffect(() => {
      const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

      const showSubscription = Keyboard.addListener(showEvent, (event) => {
        keyboardTopRef.current = event.endCoordinates.screenY;
        clearRetryTimer();
        retryTimerRef.current = setTimeout(() => scrollFocusedInputIntoView(), Platform.OS === "ios" ? 80 : 140);
      });

      const hideSubscription = Keyboard.addListener(hideEvent, () => {
        keyboardTopRef.current = null;
        clearRetryTimer();
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
        clearRetryTimer();
      };
    }, [scrollFocusedInputIntoView]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    };

    const handleStartShouldSetResponderCapture = (...args: Parameters<NonNullable<ScrollViewProps["onStartShouldSetResponderCapture"]>>) => {
      clearRetryTimer();
      retryTimerRef.current = setTimeout(() => scrollFocusedInputIntoView(), 80);
      return onStartShouldSetResponderCapture?.(...args) ?? false;
    };

    return (
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handleScroll}
        onStartShouldSetResponderCapture={handleStartShouldSetResponderCapture}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

KeyboardAwareScrollView.displayName = "KeyboardAwareScrollView";
