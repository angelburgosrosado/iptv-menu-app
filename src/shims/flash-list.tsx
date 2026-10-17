import * as React from 'react';

// High-performance native virtualization using CSS content-visibility
const VirtualizedItem = React.memo(({ children, estimatedItemSize }: { children: React.ReactNode; estimatedItemSize: number }) => {
  return (
    <div
      style={{
        minHeight: `${estimatedItemSize}px`,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${estimatedItemSize}px`,
      }}
    >
      {children}
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

