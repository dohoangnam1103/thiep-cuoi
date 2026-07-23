export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="size-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <p className="animate-pulse font-heading text-lg text-muted-foreground">Đang mở thiệp...</p>
    </main>
  );
}
