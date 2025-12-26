import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";

type RouterLocation = {
  pathname: string;
};

type RouterContextValue = {
  location: RouterLocation;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

const normalizePath = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const matchPath = (routePath: string, pathname: string) => {
  if (routePath === "*") return true;
  if (routePath.endsWith("/*")) {
    const base = routePath.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return routePath === pathname;
};

export function BrowserRouter({ children }: PropsWithChildren) {
  const [location, setLocation] = useState<RouterLocation>({
    pathname: normalizePath(window.location.pathname),
  });

  useEffect(() => {
    const handlePopState = () => {
      setLocation({ pathname: normalizePath(window.location.pathname) });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const normalized = normalizePath(to);
    if (normalized === location.pathname) return;
    window.history.pushState(null, "", normalized);
    setLocation({ pathname: normalized });
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      location,
      navigate,
    }),
    [location, navigate]
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useNavigate must be used within a BrowserRouter");
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useLocation must be used within a BrowserRouter");
  return ctx.location;
}

export type RouteProps = {
  path: string;
  element: ReactNode;
};

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  let match: ReactNode = null;
  const normalizedPathname = normalizePath(pathname);

  const visitChild = (child: ReactNode) => {
    if (!match && isRouteElement(child)) {
      const childPath = normalizePath(child.props.path);
      if (matchPath(childPath, normalizedPathname)) {
        match = child.props.element;
      }
    }
  };

  Children.forEach(children, visitChild);

  return <>{match}</>;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
};

export function Link({ to, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate();

  const handleClick: AnchorHTMLAttributes<HTMLAnchorElement>["onClick"] = (
    event
  ) => {
    if (onClick) onClick(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(to);
  };

  return <a href={to} onClick={handleClick} {...rest} />;
}

type NavLinkProps = LinkProps & {
  className?: string | ((args: { isActive: boolean }) => string);
};

export function NavLink({ className, ...rest }: NavLinkProps) {
  const { pathname } = useLocation();
  const normalized = normalizePath(pathname);
  const target = normalizePath(rest.to);
  const isActive =
    normalized === target || normalized.startsWith(`${target}/`);

  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link
      {...rest}
      className={resolvedClassName}
      aria-current={isActive ? "page" : undefined}
    />
  );
}

const isRouteElement = (
  element: ReactNode
): element is ReactElement<RouteProps> => {
  return (
    typeof element === "object" &&
    element !== null &&
    "props" in element &&
    typeof (element as ReactElement<RouteProps>).props?.path === "string"
  );
};
