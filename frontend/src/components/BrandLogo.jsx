export default function BrandLogo({ className = 'w-9 h-9' }) {
  return (
    <img
      src="/Logo_only.gif"
      alt="Cybervie logo"
      className={`rounded-lg bg-white object-cover shrink-0 ${className}`}
    />
  );
}
