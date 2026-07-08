import * as React from 'react';

// IntersectionObserver wrapper to virtualize list items in the Web simulator
const VirtualizedItem = React.memo(({ children, estimatedItemSize }: { children: React.ReactNode; estimatedItemSize: number }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '350px 0px 350px 0px', // Buffer to render ahead of scroll
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: `${estimatedItemSize}px`,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isVisible ? children : <div style={{ height: `${estimatedItemSize}px` }} />}
    </div>
  );
});

VirtualizedItem.displayName = 'VirtualizedItem';

export const FlashList = React.forwardRef<HTMLDivElement, any>(({
  data = [],
  renderItem,
  keyExtractor,
  estimatedItemSize = 74,
  ListEmptyComponent,
  ListHeaderComponent,
  numColumns = 1,
  onEndReached,
  contentContainerStyle,
  ...props
}, ref) => {
  const resolvedHeader = ListHeaderComponent && (
    typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent
  );

  const resolvedEmpty = ListEmptyComponent && (
    typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent
  );

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        ...contentContainerStyle
      }}
      {...props}
    >
      {resolvedHeader}
      {data.length === 0 ? (
        resolvedEmpty
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: numColumns > 1 ? `repeat(${numColumns}, minmax(0, 1fr))` : '1fr',
            gap: '8px',
          }}
        >
          {data.map((item: any, index: number) => {
            const key = keyExtractor ? keyExtractor(item, index) : index.toString();
            return (
              <VirtualizedItem key={key} estimatedItemSize={estimatedItemSize}>
                {renderItem({ item, index })}
              </VirtualizedItem>
            );
          })}
        </div>
      )}
    </div>
  );
});

FlashList.displayName = 'FlashList';

