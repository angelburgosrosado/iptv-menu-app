import * as React from 'react';

// A simple global emitter/state for simulation navigation inside the web environment
type NavListener = (screen: string, params: Record<string, any>) => void;
class SimRouter {
  private listeners: Set<NavListener> = new Set();
  private history: Array<{ screen: string; params: Record<string, any> }> = [
    { screen: 'index', params: {} },
  ];

  public currentScreen() {
    return this.history[this.history.length - 1]?.screen || 'index';
  }

  public currentParams() {
    return this.history[this.history.length - 1]?.params || {};
  }

  public subscribe(listener: NavListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public push(path: string, params: Record<string, any> = {}) {
    // Resolve path name like "/player/123" or "/"
    let screenName = path;
    let resolvedParams = { ...params };
    
    if (path.startsWith('/player/')) {
      screenName = 'player/[id]';
      resolvedParams.id = path.split('/player/')[1];
    } else if (path === '/' || path === '/index' || path === '') {
      screenName = 'index';
    }

    this.history.push({ screen: screenName, params: resolvedParams });
    this.notify();
  }

  public replace(path: string, params: Record<string, any> = {}) {
    let screenName = path;
    let resolvedParams = { ...params };

    if (path.startsWith('/player/')) {
      screenName = 'player/[id]';
      resolvedParams.id = path.split('/player/')[1];
    } else if (path === '/' || path === '/index' || path === '') {
      screenName = 'index';
    }

    this.history[this.history.length - 1] = { screen: screenName, params: resolvedParams };
    this.notify();
  }

  public back() {
    if (this.history.length > 1) {
      this.history.pop();
      this.notify();
    }
  }

  private notify() {
    const current = this.history[this.history.length - 1];
    this.listeners.forEach((listener) => listener(current.screen, current.params));
  }
}

export const simRouter = new SimRouter();

export const useRouter = () => {
  const [, setTick] = React.useState(0);
  
  React.useEffect(() => {
    return simRouter.subscribe(() => setTick((t) => t + 1));
  }, []);

  return {
    push: (path: string, params?: Record<string, any>) => simRouter.push(path, params),
    replace: (path: string, params?: Record<string, any>) => simRouter.replace(path, params),
    back: () => simRouter.back(),
  };
};

export const useLocalSearchParams = <T extends Record<string, string>>(): T => {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    return simRouter.subscribe(() => setTick((t) => t + 1));
  }, []);

  return simRouter.currentParams() as T;
};

export const Link = ({ href, children, onPress, ...props }: any) => {
  const router = useRouter();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (onPress) onPress(e);
        router.push(href);
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left', padding: 0 }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Stack = ({ children }: any) => {
  const [screen, setScreen] = React.useState(simRouter.currentScreen());

  React.useEffect(() => {
    return simRouter.subscribe((newScreen) => {
      setScreen(newScreen);
    });
  }, []);

  // Filter children or find Screen match
  let activeChild = null;
  React.Children.forEach(children, (child) => {
    if (child && child.props && child.props.name === screen) {
      activeChild = child.props.component ? <child.props.component /> : child.props.children;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', height: '100%' }}>
      {activeChild || children}
    </div>
  );
};

Stack.Screen = ({ children, options }: any) => {
  // Simulator metadata wrapper
  return <React.Fragment>{children}</React.Fragment>;
};
