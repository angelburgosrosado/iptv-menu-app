import * as React from 'react';

export const Image = React.forwardRef<HTMLImageElement, any>(({
  style,
  source,
  contentFit = 'cover',
  placeholder,
  transition = 200,
  onError,
  ...props
}, ref) => {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  
  const uri = source && typeof source === 'object' ? source.uri : source;
  const objectFit = contentFit === 'contain' ? 'contain' : 'cover';

  return (
    <div style={{ position: 'relative', display: 'flex', ...style, overflow: 'hidden' }}>
      {!loaded && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <span className="text-[9px] text-gray-500">Logo</span>
        </div>
      )}
      <img
        ref={ref}
        src={uri || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
        alt="channel-logo"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          if (!target.dataset.fallback) {
            target.dataset.fallback = 'true';
            setFailed(true);
            setLoaded(true);
            target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="16" fill="%2327272a"/%3E%3Ctext x="50%25" y="52%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="28" fill="%2371717a"%3ETV%3C/text%3E%3C/svg%3E';
            if (onError) onError();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit as any,
          opacity: loaded || failed ? 1 : 0,
          transition: `opacity ${transition}ms ease-in-out`,
        }}
        {...props}
      />
    </div>
  );
});

Image.displayName = 'Image';
export default Image;
