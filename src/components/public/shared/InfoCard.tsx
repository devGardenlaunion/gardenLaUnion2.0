interface InfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accent?: "gold" | "green";
  variant?: "light" | "dark";
  className?: string;
}

const styles = {
  gold: {
    light: {
      iconBg: "bg-gc-gold/15 text-gc-gold-dark",
      divider: "bg-gc-gold",
      title: "text-gc-green-800",
      body: "text-gc-green-800/70",
    },
    dark: {
      iconBg: "bg-gc-gold/20 text-gc-gold-light",
      divider: "bg-gc-gold/50",
      title: "text-white",
      body: "text-gc-green-100/70",
    },
  },
  green: {
    light: {
      iconBg: "bg-gc-green-50 text-gc-green",
      divider: "bg-gc-green/30",
      title: "text-gc-green-800",
      body: "text-gc-green-800/70",
    },
    dark: {
      iconBg: "bg-gc-green-light/20 text-gc-green-light",
      divider: "bg-gc-green-100/20",
      title: "text-white",
      body: "text-gc-green-100/70",
    },
  },
} as const;

export default function InfoCard({
  title,
  description,
  icon,
  accent = "gold",
  variant = "light",
  className = "",
}: InfoCardProps) {
  const s = styles[accent][variant];

  if (variant === "dark") {
    return (
      <div
        className={`rounded-xl p-6 border border-gc-green-100/15 hover:border-gc-gold/30 transition-colors ${className}`}
        style={{ background: "rgba(61,133,120,0.15)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}>
              {icon}
            </div>
          )}
          <h4 className={`font-display font-bold ${icon ? "text-base" : "text-xl"} ${s.title}`}>
            {title}
          </h4>
        </div>
        <div className={`h-0.5 ${s.divider} rounded-full mb-3`} />
        <p className={`font-body text-sm leading-relaxed ${s.body}`}>
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className={`card p-8 ${className}`}>
      <div className={`flex items-center gap-4 ${icon ? "mb-4" : "mb-4"}`}>
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
            {icon}
          </div>
        )}
        <h3 className={`text-xl font-display font-bold ${s.title}`}>
          {title}
        </h3>
      </div>
      <div className={`h-0.5 ${s.divider} rounded-full mb-4`} />
      <p className={`font-body leading-relaxed ${s.body}`}>
        {description}
      </p>
    </div>
  );
}
