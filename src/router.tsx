import React from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Feed from '@/pages/Feed';
import Settings from '@/pages/Settings';
import Accounts from '@/pages/Accounts';
import NewPost from '@/pages/NewPost';
import Search from '@/pages/Search';
import CommandPalette from '@/common/components/CommandPalette';
import ErrorPage from '@/pages/ErrorPage';
import Login from '@/pages/Login';
import { Notifications } from '@/pages/Notifications';
import { Theme } from '@radix-ui/themes';
import * as Sentry from "@sentry/react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";
import Channels from './pages/Channels';

const VITE_SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

Sentry.init({
  dsn: VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: 1.0,
});

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

export const router = sentryCreateBrowserRouter([
  {
    path: "/",
    element: <>
      <Theme radius="small" appearance="dark">
        <CommandPalette />
        <Home />
      </Theme>
    </>,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "feed",
        element: <Feed />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "accounts",
        element: <Accounts />,
      },
      {
        path: "post",
        element: <NewPost />,
      },
      {
        path: "channels",
        element: <Channels />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "error",
        element: <ErrorPage />,
      },
      {
        path: "/",
        element: <Navigate to="feed" replace />
      },
    ]
  }
]);
