import type { Request } from "express";

export default function parseSearchQueries(req: Request) {
  const fields = ["search", "title", "description", "location", "tag"] as const;

  const queries: Record<(typeof fields)[number], string> = {} as Record<
    (typeof fields)[number],
    string
  >;

  fields.forEach((key) => {
    queries[key] = parseSingleQuery(req.query[key]);
  });

  return queries;
}

function parseSingleQuery(
  query: Request["query"][keyof Request["query"]] | string | undefined
): string {
  if (!query) return "";
  const parsedQuery = Array.isArray(query) ? query.join(" ").trim() : query.toString().trim();
  return parsedQuery;
}
