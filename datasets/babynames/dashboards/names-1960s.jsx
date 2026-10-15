// @ts-nocheck
// Baby names of the 1960s — top 10 girl / boy names, the decade's five most
// popular names year by year, biggest risers and fallers (1960 -> 1969), and
// names that first appeared in the data in the 1960s. Every query lives in
// names-1960s.malloy; this component only draws them. jsx components are
// sandboxed (React + @malloyyo/dashboard only), so styles are inline and use the
// dashboard theme tokens (--dash-*) with fallbacks.
import React from "react";
import { VegaChart, useQuery } from "@malloyyo/dashboard";

const GENDER = { F: "#e87ba4", M: "#2a78d6" };
const num = (v) => Number(v).toLocaleString();
const signed = (v) => (Number(v) > 0 ? "+" : "") + num(v);

const th = { textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--dash-muted, #898781)", padding: "4px 8px", borderBottom: "1px solid var(--dash-border, #e5e7eb)" };
const thR = { ...th, textAlign: "right" };
const td = { padding: "5px 8px", fontSize: 14, borderBottom: "1px solid var(--dash-border, #eceff3)" };
const tdR = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };

function Card({ title, note, q, children }) {
  return (
    <div style={{ border: "1px solid var(--dash-border, #e5e7eb)", borderRadius: "var(--dash-radius, 10px)", padding: 16, minWidth: 0 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 12, color: "var(--dash-muted, #898781)", margin: "2px 0 10px" }}>{note}</p>
      {q.error ? (
        <div style={{ color: "var(--dash-danger, #b00020)", fontSize: 13 }}>{String(q.error)}</div>
      ) : q.loading ? (
        <div style={{ color: "var(--dash-muted, #898781)", fontSize: 13 }}>Loading…</div>
      ) : (
        children
      )}
    </div>
  );
}

// Ranked names with a bar scaled to the largest value in the list.
function RankTable({ rows, color }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.births)));
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr><th style={th}>#</th><th style={th}>Name</th><th style={thR}>Births</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={String(r.name)}>
            <td style={td}>{i + 1}</td>
            <td style={td}>{String(r.name)}</td>
            <td style={{ ...tdR, background: `linear-gradient(to left, ${color}33 ${(Number(r.births) / max) * 100}%, transparent 0)` }}>
              {num(r.births)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChangeTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr><th style={th}>Name</th><th style={thR}>1960</th><th style={thR}>1969</th><th style={thR}>Change</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r.name)}>
            <td style={td}>{String(r.name)}</td>
            <td style={tdR}>{num(r.births_1960)}</td>
            <td style={tdR}>{num(r.births_1969)}</td>
            <td style={tdR}>{signed(r.change)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const trendSpec = {
  width: "container",
  height: 240,
  mark: { type: "line", point: true, tooltip: true },
  encoding: {
    x: { field: "birth_year", type: "quantitative", title: "Year", axis: { format: "d", tickMinStep: 1 }, scale: { zero: false } },
    y: { field: "births", type: "quantitative", title: "Births" },
    color: { field: "name", type: "nominal", title: "Name" },
  },
};

export default function Dashboard() {
  const total = useQuery({ query: "decade_1960s_total" });
  const girls = useQuery({ query: "top_girls_1960s" });
  const boys = useQuery({ query: "top_boys_1960s" });
  const trend = useQuery({ query: "top_names_by_year_1960s" });
  const risers = useQuery({ query: "risers_1960s" });
  const fallers = useQuery({ query: "fallers_1960s" });
  const fresh = useQuery({ query: "new_names_1960s" });

  // One row per (name, year) for the line chart.
  const trendRows = (trend.rows ?? []).flatMap((r) =>
    (r.by_year ?? []).map((y) => ({ name: String(r.name), birth_year: Number(y.birth_year), births: Number(y.births) }))
  );
  const births = total.rows?.[0]?.total_babies;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, color: "var(--dash-fg, #171717)", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1 }}>{births == null ? "…" : num(births)}</div>
        <div style={{ fontSize: 12, color: "var(--dash-muted, #898781)" }}>
          births recorded in the 1960s (U.S. Social Security Administration)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <Card title="Top 10 girl names" note="Total births, 1960–1969" q={girls}>
          <RankTable rows={girls.rows ?? []} color={GENDER.F} />
        </Card>
        <Card title="Top 10 boy names" note="Total births, 1960–1969" q={boys}>
          <RankTable rows={boys.rows ?? []} color={GENDER.M} />
        </Card>
      </div>

      <Card title="Top 5 names by year" note="The decade's five most popular names; births per year, boys and girls combined" q={trend}>
        <VegaChart spec={trendSpec} data={trendRows} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        <Card title="Biggest risers, 1960 to 1969" note="Change in births; names with at least 1,000 births in the decade" q={risers}>
          <ChangeTable rows={risers.rows ?? []} />
        </Card>
        <Card title="Biggest fallers, 1960 to 1969" note="Change in births; names with at least 1,000 births in the decade" q={fallers}>
          <ChangeTable rows={fallers.rows ?? []} />
        </Card>
      </div>

      <Card
        title="New names of the 1960s"
        note="Names whose first year in the data (it starts in 1910; names under 5 births a year are omitted) was 1960–1969, ranked by 1960s births"
        q={fresh}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><th style={th}>Name</th><th style={thR}>First year</th><th style={thR}>Births in the 1960s</th></tr>
          </thead>
          <tbody>
            {(fresh.rows ?? []).map((r) => (
              <tr key={String(r.name)}>
                <td style={td}>{String(r.name)}</td>
                <td style={tdR}>{String(r.first_year)}</td>
                <td style={tdR}>{num(r.births_1960s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
