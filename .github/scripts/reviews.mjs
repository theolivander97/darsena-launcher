// Lee las reseñas de la categoría "Reseñas" de Discussions y escribe reviews.json.
// Mismo formato que entiende Dársena (src-tauri/src/reviews.rs):
//   { updatedAt, games: { "<id-juego>": { average, count, discussionUrl, reviews: [{ user, avatar, url, rating, text, date }] } } }
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const CATEGORY = "reseñas";
const [owner, name] = process.env.REPO.split("/");
const MARK = /<!--\s*darsena:review rating=(\d)\s*-->/;

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "darsena-reviews" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json).slice(0, 500));
  return json.data;
}

function parse(body) {
  const m = body.match(MARK);
  const rating = m && Number(m[1]);
  if (!rating || rating < 1 || rating > 5) return null;
  const text = body
    .split("\n")
    .filter((l) => !l.includes("darsena:review") && !(/^[★☆]/.test(l) && l.includes("/5**")))
    .join("\n")
    .trim();
  return { rating, text };
}

const cats = await gql(
  "query($o:String!,$n:String!){repository(owner:$o,name:$n){discussionCategories(first:25){nodes{id name}}}}",
  { o: owner, n: name },
);
const cat = cats.repository.discussionCategories.nodes.find((c) => c.name.toLowerCase() === CATEGORY);
if (!cat) throw new Error('Falta la categoría "Reseñas" en Discussions');

const games = {};
let after = null;
do {
  const d = await gql(
    `query($o:String!,$n:String!,$c:ID!,$a:String){repository(owner:$o,name:$n){
      discussions(first:30,after:$a,categoryId:$c){pageInfo{hasNextPage endCursor}
        nodes{title url comments(last:100){nodes{body createdAt isMinimized author{login avatarUrl url}}}}}}}`,
    { o: owner, n: name, c: cat.id, a: after },
  );
  const page = d.repository.discussions;
  for (const disc of page.nodes) {
    const id = disc.title.match(/\[([^\[\]]+)\]\s*$/)?.[1];
    if (!id) continue;
    // Una reseña por usuario: la más reciente.
    const byUser = new Map();
    for (const c of disc.comments.nodes) {
      if (c.isMinimized || !c.author) continue;
      const r = parse(c.body);
      if (!r) continue;
      byUser.set(c.author.login, {
        user: c.author.login,
        avatar: c.author.avatarUrl,
        url: c.author.url,
        rating: r.rating,
        text: r.text,
        date: c.createdAt,
      });
    }
    const reviews = [...byUser.values()].sort((a, b) => b.date.localeCompare(a.date));
    if (!reviews.length) continue;
    const average = Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 100) / 100;
    games[id] = { average, count: reviews.length, discussionUrl: disc.url, reviews };
  }
  after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (after);

// Solo se reescribe si cambian las reseñas (así no hay un commit cada hora).
const prev = existsSync("reviews.json") ? JSON.parse(readFileSync("reviews.json", "utf8")) : null;
if (JSON.stringify(prev?.games) === JSON.stringify(games)) {
  console.log("reviews.json ya está al día");
} else {
  writeFileSync("reviews.json", JSON.stringify({ updatedAt: new Date().toISOString(), games }, null, 1) + "\n");
  console.log(`reviews.json: ${Object.keys(games).length} juegos con reseñas`);
}
