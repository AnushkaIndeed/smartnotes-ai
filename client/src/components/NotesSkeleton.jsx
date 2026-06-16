export default function NotesSkeleton() {
  return (
    <div className="p-3 space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-8 bg-gray-200 rounded animate-pulse"
        />
      ))}
    </div>
  );
}