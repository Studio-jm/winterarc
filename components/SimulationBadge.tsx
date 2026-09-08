export function SimulationBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`sim-badge ${className}`.trim()} data-source="simulation">
      simulation
    </span>
  );
}
