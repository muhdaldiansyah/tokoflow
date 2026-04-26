export default function StoreNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
          <span className="text-3xl">🔍</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Store not found</h1>
          <p className="text-muted-foreground mt-2">
            We couldn&apos;t find a Tokoflow store at this link. Check the URL with the merchant who shared it.
          </p>
        </div>
        <a
          href="/"
          className="inline-block h-11 px-5 leading-[44px] rounded-xl bg-[#1a4d35] text-white font-medium hover:bg-[#1a4d35]/90 transition-colors"
        >
          Back to Tokoflow
        </a>
      </div>
    </div>
  );
}
