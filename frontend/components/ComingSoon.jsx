// Placeholder for routes that exist in the nav but are not built yet.
export default function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-4xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
