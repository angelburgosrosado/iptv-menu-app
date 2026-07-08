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
          setFailed(true);
          // Fallback image source if original URL is dead or hotlink-protected (very common on IPTV)
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
          if (onError) onError();
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit as any,
          opacity: loaded ? 1 : 0,
          transition: `opacity ${transition}ms ease-in-out`,
        }}
        {...props}
      />
    </div>
  );
});

Image.displayName = 'Image';
export default Image;
