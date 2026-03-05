interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHeader({ title, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <div className={`text-center mb-16 ${className}`}>
      <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-text-primary">
        {title}
      </h2>
      {subtitle && (
        <p className="text-text-dim text-lg max-w-md mx-auto">{subtitle}</p>
      )}
    </div>
  );
}
