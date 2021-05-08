export function buildWhere(
  params: Record<string, string | number>,
  join = "and",
) {
  const wheres = Object.keys(params)
    .map((key) => {
      const val = params[key];
      if (!val) return null;
      if (typeof val === "string") {
        return `${key}='${val}'`;
      } else if (typeof val === "number") {
        return `${key}=${val}`;
      } else {
        throw `Error value ${key}: ${val}`;
      }
    })
    .filter(Boolean);
  return wheres.length ? `where ${wheres.join(` ${join} `)}` : "";
}
