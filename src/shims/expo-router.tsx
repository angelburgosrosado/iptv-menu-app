import * as React from 'react';

// A simple global emitter/state for simulation navigation inside the web environment
type NavListener = (screen: string, params: Record<string, any>, isModalOpen: boolean) => void;

class SimRouter {
  private listeners: Set<NavListener> = new Set();
  private history: Array<{ screen: string; params: Record<string, any> }> = [
    { screen: 'index', params: {} },
  ];
  private modalOpen: boolean = false;

  public currentScreen() {
    return this.history[this.history.length - 1]?.screen || 'index';
  }

  public currentParams() {
    return this.history[this.history.length - 1]?.params || {};
  }

  public isModalOpen() {
    return this.modalOpen;
  }

  public setModalOpen(open: boolean) {
    this.modalOpen = open;
    this.notify();
  }

  public openModal(path?: string, params: Record<string, any> = {}) {
    this.modalOpen = true;
    if (path) {
      this.push(path, params);
    } else {
      this.notify();
    }
  }

  public closeModal() {
    this.modalOpen = false;
    this.notify();
  }

  public subscribe(listener: NavListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private parsePath(path: string, params: Record<string, any> = {}) {
    const resolvedParams: Record<string, any> = { ...params };
    let pathWithoutQuery = path;

    if (path.includes('?')) {
      const [base, queryStr] = path.split('?');
      pathWithoutQuery = base;
      if (queryStr) {
        const searchParams = new URLSearchParams(queryStr);
        searchParams.forEach((val, key) => {
          resolvedParams[key] = val;
        });
      }
    }

    let screenName = pathWithoutQuery;
    if (pathWithoutQuery.startsWith('/player/')) {
      screenName = 'player/[id]';
      resolvedParams.id = pathWithoutQuery.slice('/player/'.length);
    } else if (pathWithoutQuery === '/' || pathWithoutQuery === '/index' || pathWithoutQuery === '') {
      screenName = 'index';
    }

    return { screenName, resolvedParams };
  }

  public push(path: string, params: Record<string, any> = {}) {
    const { screenName, resolvedParams } = this.parsePath(path, params);
    this.history.push({ screen: screenName, params: resolvedParams });
    // Automatically open simulator modal when navigating to a stream player
    if (path.startsWith('/player/')) {
      this.modalOpen = true;
    }
    this.notify();
  }

  public replace(path: string, params: Record<string, any> = {}) {
    const { screenName, resolvedParams } = this.parsePath(path, params);
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
    const screen = current?.screen || 'index';
    const params = current?.params || {};
    this.listeners.forEach((listener) => listener(screen, params, this.modalOpen));
  }
}

export const simRouter = new SimRouter();

export const useSimulatorModal = () => {
  const [isOpen, setIsOpen] = React.useState(simRouter.isModalOpen());

  React.useEffect(() => {
    return simRouter.subscribe((_screen, _params, modalOpen) => {
      setIsOpen(modalOpen);
    });
  }, []);

  return {
    isOpen,
    open: (path?: string, params?: Record<string, any>) => simRouter.openModal(path, params),
    close: () => simRouter.closeModal(),
  };
};

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

export const useLocalSearchParams = <T extends Record<string, any>>(): T => {
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

Stack.Screen = ({ children }: any) => {
  // Simulator metadata wrapper
  return <React.Fragment>{children}</React.Fragment>;
};

