function AppErrorFallback() {
  return (
    <main className="app-error-fallback" role="alert">
      <h1>Something went wrong</h1>
      <p>We’ve recorded the problem. Reload the shop to try again.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload the shop</button>
    </main>
  );
}

export default AppErrorFallback;
