import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: unknown = useRouteError();
  console.error('ErrorPage', error);

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[1fr,auto,1fr] bg-black lg:grid-cols-[max(50%,36rem),1fr]">
      <header className="mx-auto w-full max-w-7xl px-6 pt-6 sm:pt-10 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:px-8">
        <a href="#">
          <span className="sr-only">herocast</span>
          <img
            className="h-10 w-auto sm:h-12"
            src="./src/assets/images/herocast.png"
            alt=""
          />
        </a>
      </header>
      <main className="select-text mx-auto w-full max-w-7xl px-6 py-24 sm:py-32 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:px-8">
        <div className="max-w-lg">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-100 sm:text-5xl">Error</h1>
          <p className="mt-2 text-base leading-7 text-gray-300">
            {error?.statusText || error?.message || 'Unknown error'}
          </p>
          <div className="mt-10">
            <a href="/" className="text-sm font-semibold leading-7 text-gray-300">
              <span aria-hidden="true">&larr;</span> Back to home
            </a>
          </div>
        </div>
      </main>
      <div className="hidden lg:relative lg:col-start-2 lg:row-start-1 lg:row-end-4 lg:block">
        <img
          src="./src/assets/images/bw-background.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
