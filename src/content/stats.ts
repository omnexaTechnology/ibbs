export type Stat = {
  key: "projects" | "area" | "clients" | "years";
  value: number;
  /** Shown small after the number. `area` is in thousands of m², its unit comes from the `home.kSqm` message. */
  suffix: "+" | "unit";
  /** Message key in `home`. */
  label: "stProjects" | "stAreaLong" | "stClients" | "stYears";
  /** BR-003: the design numbers are placeholders. Set to true only when the client confirms the real figure. */
  confirmed: boolean;
};

export const stats: Stat[] = [
  { key: "projects", value: 120, suffix: "+", label: "stProjects", confirmed: false },
  { key: "area", value: 85, suffix: "unit", label: "stAreaLong", confirmed: false },
  { key: "clients", value: 60, suffix: "+", label: "stClients", confirmed: false },
  { key: "years", value: 10, suffix: "+", label: "stYears", confirmed: false },
];
