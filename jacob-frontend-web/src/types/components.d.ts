/**
 * This file previously contained manual ambient module declarations for UI components.
 * These have been removed because all components now have proper TypeScript source files
 * with full type information. Ambient module declarations would shadow the real types
 * and cause "Cannot redeclare block-scoped variable" errors under strict mode.
 *
 * If you need to add types for third-party modules that lack TypeScript definitions,
 * add them here using the `declare module '...'` syntax.
 */

import * as React from 'react';

// Generic component type helper — available globally in the project
type CP<E extends React.ElementType = 'div'> = React.ComponentPropsWithRef<E> & {
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
};
