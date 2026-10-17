import * as React from 'react';

// Platform Shimming
export const Platform = {
  OS: 'ios',
  select: <T extends unknown>(obj: { ios?: T; android?: T; default?: T }): T => {
    return (obj.ios || obj.default) as T;
  },
};

// Helper for flattening React Native styled arrays
export const flattenStyle = (style: any): any => {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    return style.reduce((acc, curr) => {
      return { ...acc, ...flattenStyle(curr) };
    }, {});
  }
  return style;
};

// StyleSheet Shimming - allows standard react-native styling calls to compile cleanly
export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => {
    return styles;
  },
  flatten: (style: any): any => {
    return flattenStyle(style);
  },
  absoluteFillObject: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Dimensions Utility
export const Dimensions = {
  get: (type: 'window' | 'screen') => {
    return {
      width: 375,  // Simulated mobile width
      height: 812, // Simulated mobile height
      scale: 2,
      fontScale: 1,
    };
  },
  addEventListener: () => ({ remove: () => {} }),
};

// Component Shims with TypeScript Type mapping
export const View = React.forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => {
  const resolvedStyle = flattenStyle(style);
  return (
    <div
      ref={ref}
      style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', ...resolvedStyle }}
      {...props}
    >
      {children}
    </div>
  );
});
View.displayName = 'View';

export const SafeAreaView = React.forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => {
  const resolvedStyle = flattenStyle(style) || {};
  const hasPaddingTop = 'paddingTop' in resolvedStyle || 'padding' in resolvedStyle || 'paddingVertical' in resolvedStyle;
  const hasPaddingBottom = 'paddingBottom' in resolvedStyle || 'padding' in resolvedStyle || 'paddingVertical' in resolvedStyle;

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  if (!hasPaddingTop) {
    baseStyle.paddingTop = 'env(safe-area-inset-top)';
  }
  if (!hasPaddingBottom) {
    baseStyle.paddingBottom = 'env(safe-area-inset-bottom)';
  }

  return (
    <div
      ref={ref}
      style={{ ...baseStyle, ...resolvedStyle }}
      {...props}
    >
      {children}
    </div>
  );
});
SafeAreaView.displayName = 'SafeAreaView';

export const ScrollView = React.forwardRef<HTMLDivElement, any>(({
  style,
  children,
  contentContainerStyle,
  horizontal,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  keyboardShouldPersistTaps,
  scrollEnabled,
  ...props
}, ref) => {
  const resolvedStyle = flattenStyle(style);
  const resolvedContentStyle = flattenStyle(contentContainerStyle);
  const isHorizontal = !!horizontal;
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        overflowX: isHorizontal ? 'auto' : 'hidden',
        overflowY: isHorizontal ? 'hidden' : 'auto',
        flex: 1,
        ...resolvedStyle
      }}
      {...props}
    >
      <div style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        ...resolvedContentStyle
      }}>
        {children}
      </div>
    </div>
  );
});
ScrollView.displayName = 'ScrollView';

export const Text = React.forwardRef<HTMLSpanElement, any>(({ style, children, numberOfLines, ...props }, ref) => {
  const resolvedStyle = flattenStyle(style);
  const lineClampStyle: React.CSSProperties = numberOfLines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    : {};

  return (
    <span
      ref={ref}
      style={{ fontFamily: 'sans-serif', ...lineClampStyle, ...resolvedStyle }}
      {...props}
    >
      {children}
    </span>
  );
});
Text.displayName = 'Text';

export const TouchableOpacity = React.forwardRef<HTMLDivElement, any>(({ style, children, activeOpacity = 0.7, onPress, disabled, ...props }, ref) => {
  const resolvedStyle = flattenStyle(style);
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        if (!disabled && onPress) {
          onPress(e);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        outline: 'none',
        transition: 'opacity 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        ...resolvedStyle,
      }}
      onKeyDown={(e) => {
        if (!disabled && onPress && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});
TouchableOpacity.displayName = 'TouchableOpacity';

export const Pressable = React.forwardRef<HTMLDivElement, any>(({ style, children, onPress, disabled, ...props }, ref) => {
  const resolvedStyleRaw = typeof style === 'function' ? style({ pressed: false }) : style;
  const resolvedStyle = flattenStyle(resolvedStyleRaw);
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        if (!disabled && onPress) {
          onPress(e);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        userSelect: 'none',
        ...resolvedStyle,
      }}
      onKeyDown={(e) => {
        if (!disabled && onPress && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});
Pressable.displayName = 'Pressable';

export const Image = React.forwardRef<HTMLImageElement, any>(({ style, source, contentFit = 'cover', ...props }, ref) => {
  const src = source && typeof source === 'object' ? source.uri : source;
  const objectFit = contentFit === 'contain' ? 'contain' : 'cover';
  const resolvedStyle = flattenStyle(style);
  return (
    <img
      ref={ref}
      src={src || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
      referrerPolicy="no-referrer"
      style={{
        objectFit,
        display: 'block',
        ...resolvedStyle,
      }}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        if (!target.dataset.fallback) {
          target.dataset.fallback = 'true';
          target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="16" fill="%2327272a"/%3E%3Ctext x="50%25" y="52%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="28" fill="%2371717a"%3ETV%3C/text%3E%3C/svg%3E';
        }
      }}
      {...props}
    />
  );
});
Image.displayName = 'Image';

export const TextInput = React.forwardRef<HTMLInputElement, any>(({ style, placeholder, placeholderTextColor, onChangeText, value, ...props }, ref) => {
  const resolvedStyle = flattenStyle(style);
  return (
    <input
      ref={ref}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      style={{
        outline: 'none',
        fontFamily: 'sans-serif',
        border: 'none',
        background: 'transparent',
        ...resolvedStyle,
      }}
      {...props}
    />
  );
});
TextInput.displayName = 'TextInput';

export const ActivityIndicator = ({ size = 'small', color = '#ffffff' }: any) => {
  const pixelSize = size === 'large' ? '2.5rem' : '1.25rem';
  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-spin rounded-full border-2"
        style={{
          width: pixelSize,
          height: pixelSize,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </div>
  );
};

export const StatusBar = () => null;

export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    console.log(`Alert: ${title} - ${message}`);
    const confirmed = window.confirm(`${title}\n\n${message || ''}`);
    if (confirmed && buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    } else if (!confirmed && buttons && buttons[1] && buttons[1].onPress) {
      buttons[1].onPress();
    }
  },
};

export const FlatList = React.forwardRef<HTMLDivElement, any>(({ data = [], renderItem, keyExtractor, ...props }, ref) => {
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column' }} {...props}>
      {data.map((item: any, index: number) => {
        const key = keyExtractor ? keyExtractor(item, index) : index.toString();
        return <React.Fragment key={key}>{renderItem({ item, index })}</React.Fragment>;
      })}
    </div>
  );
});
FlatList.displayName = 'FlatList';
