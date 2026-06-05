export const meta = {
  name: 'build-rag-course',
  description: 'Author 12 interactive HTML chapters for a beginner RAG course',
  phases: [{ title: 'Author chapters', detail: 'one agent per chapter, copies base template, writes steps' }],
}

const DIR = '/home/lloydivers/projects/travel-booking-assistant/rag'

const SHARED = `
You are authoring ONE chapter of a self-paced, beginner RAG (Retrieval-Augmented Generation) course.
The course is a folder of standalone HTML pages that share one visual system.

BUILD CONTRACT — follow exactly:
1. Read the base template at ${DIR}/_base-template.html. It carries the ENTIRE visual system
   and a working stepper engine. Copy it as your starting point.
2. Edit ONLY the five AUTHOR blocks: the <title>; the .chapnav prev/next links (AUTHOR-NAV);
   the header eyebrow/h1/sub (AUTHOR-HEAD); the #stage markup (AUTHOR-STAGE); and the
   'steps' array + renderStage() (AUTHOR-STEPS). DO NOT touch the CSS, the stepper engine,
   or the highlighter. Keep it 100% self-contained: no CDN, no fonts, no network calls.
3. Write the finished file to the exact path given as OUTPUT below. Overwrite if it exists.

STEP AUTHORING RULES:
- 9 to 12 steps. ONE idea per step. Each step's text must stand alone.
- Audience is a smart beginner. DEFINE EVERY technical term in plain words the first time it
  appears (embedding, vector, cosine similarity, chunk, cross-encoder, ANN, entity, etc.).
- Step 0 frames the whole chapter in one sentence (the mental model to walk away with).
- The LAST step is an "explain it back" recap: set secHead to "Check yourself" and put 2-3
  short questions in the secondary card that make the learner reconstruct the chapter. No node highlight.
- Use the secondary card actively. Default secHead is "★ In your travel app" — use it for a concrete
  callout tied to a corporate-travel policy assistant (policy PDFs, expense caps, NHS vs government
  policy, "can I expense X?"). When a strategy has a real downside, set secHead to "Cost & trade-off"
  and use a step tag { kind: 'cost', label: 'trade-off' }. Use { kind:'good' } / { kind:'bad' } tags where apt.
- Prefer SHOWING over telling: light up stage nodes via step.active, or mutate a live panel in renderStage().
- If you show code/SQL, swap #stage for <div class="code-panel" id="codepanel"></div>, call
  buildCode('codepanel', \`...code...\`) once at the top of the script, and highlight lines with
  step.active = ['L3','L4']. Keep snippets SHORT and illustrative; label them as conceptual, not copy-paste.
- Write text as HTML strings. Use <b>...</b> to emphasize key terms. Keep each step's text 2-4 sentences.

NAV: edit the AUTHOR-NAV block so the map link stays href="index.html". Set prevchap and nextchap
hrefs + labels exactly as given below. If a side is marked DISABLED, add class="disabled" to that <a>.

OUTPUT: return ONLY the absolute file path you wrote and a 2-line summary of what the chapter teaches.
Do NOT paste the HTML into your reply.
`

const CHAPTERS = [
  {
    file: 'ch01-what-is-rag.html', num: '01',
    title: 'What RAG is — and why it exists',
    eyebrow: 'RAG course · chapter 01 · foundations',
    sub: 'A language model only knows what it was trained on. RAG lets it look things up in YOUR documents before it answers. Step through the whole pipeline once.',
    prev: { href: 'index.html', label: 'Course map', disabled: true },
    next: { href: 'ch02-embeddings.html', label: 'Embeddings' },
    brief: `Teach: WHY RAG exists, then the two-phase pipeline.
- Define LLM (large language model: predicts text, trained once up to a cutoff date), training cutoff, and hallucinate (confidently inventing facts it doesn't actually know).
- The problem: an LLM can't see your private/internal/up-to-date documents, and when asked about them it guesses. Three failure modes: stale knowledge, no access to private docs, hallucination.
- The fix in one line: before the model answers, RETRIEVE relevant text from your documents and paste it into the prompt as context. Spell out the name: Retrieval (find text) + Augmented (add it to the prompt) + Generation (model writes the answer).
- Define context window: the limited amount of text a model can read at once. So you can't just paste ALL your docs in — too big, too costly, and it distracts the model. You retrieve only the relevant slice.
- The two phases (this is the spine of the whole course):
  1. INDEXING, done once ahead of time: Documents -> Chunk (split up) -> Embed (turn into numbers) -> store in a Vector DB.
  2. RETRIEVAL, done on every question: Embed the query -> Search the vector DB for similar chunks -> hand top chunks to the LLM -> grounded answer.
- Key payoff to land: the model never memorizes your docs; it reads the relevant slice at answer time. Update a document and answers update instantly — no retraining.
- STAGE: build the two-row pipeline as nodes with arrows (reuse the node/arrow pattern). Highlight one box per step so the learner watches data flow indexing-row then retrieval-row.
- Travel-app callout: user asks "can I expense a 200 pound hotel in London?" -> retrieve the matching policy paragraph -> answer grounded in it, ideally with a citation.
- Explain-back questions: What do R, A, G each stand for? Why not just paste every document into the prompt? What happens to answers when you edit a source document?`
  },
  {
    file: 'ch02-embeddings.html', num: '02',
    title: 'Embeddings — turning meaning into numbers',
    eyebrow: 'RAG course · chapter 02 · foundations',
    sub: 'The trick that makes search work on MEANING instead of keywords: every piece of text becomes a point in space, and nearby points mean similar things.',
    prev: { href: 'ch01-what-is-rag.html', label: 'What RAG is' },
    next: { href: 'ch03-vector-databases.html', label: 'Vector databases' },
    brief: `Teach: what an embedding is and why "close = similar meaning".
- Define vector (an ordered list of numbers) and embedding (a function, run by an "embedding model", that turns a piece of text into a vector — e.g. 1536 numbers). Each number is a "dimension".
- The magic property: texts with SIMILAR MEANING get vectors that sit CLOSE together; unrelated texts sit far apart. It captures semantics, not spelling. "dog" and "puppy" land close though they share no letters; "river bank" and "money bank" land far apart.
- This is the leap over keyword search: keyword search needs the same words; embeddings match meaning. "reimbursement cap" can match a chunk that says "maximum claimable amount" with zero shared words.
- Define cosine similarity: a score for how close two vectors point — think of the ANGLE between two arrows. ~1 = same direction = same meaning; ~0 = unrelated. We compare DIRECTION, not word overlap.
- Critical rule: you must embed the query AND the documents with the SAME embedding model, or the numbers aren't comparable.
- STAGE: a small 2-D scatter (a flattened projection) — put a query point near 2 relevant doc points and far from irrelevant ones. Each step lights up points / draws the "closeness". You can render this as positioned .node boxes or a simple inline SVG inside #stage; keep it on-theme (use the palette vars). Mutate which point is "hot" per step via renderStage if you go SVG.
- Cost/trade-off is mild: embedding is cheap and fast; more dimensions = more storage. Model choice matters (forward-ref chapter 11 fine-tuning).
- Travel-app callout: "cap" matching "maximum claimable amount" across policy docs is exactly the win.
- Explain-back: Why can "cap" match "maximum amount" when keyword search can't? What does cosine similarity actually measure? What must be identical on the query side and the document side?`
  },
  {
    file: 'ch03-vector-databases.html', num: '03',
    title: 'Vector databases & similarity search',
    eyebrow: 'RAG course · chapter 03 · foundations',
    sub: 'Once every chunk is a vector, you need to store millions of them and, for any query, find the nearest ones fast. That is a vector database — and in your stack it is Postgres + pgvector.',
    prev: { href: 'ch02-embeddings.html', label: 'Embeddings' },
    next: { href: 'ch04-chunking.html', label: 'Chunking' },
    brief: `Teach: what a vector DB does and how a query retrieves.
- Define vector database: a database specialized for nearest-neighbour search over vectors. Options: dedicated stores (Pinecone, Weaviate, Qdrant) OR Postgres with the pgvector extension. This project + the source video use Postgres + pgvector — anchor there.
- pgvector: adds a vector column type and distance operators to ordinary Postgres. Show a tiny conceptual schema: a policy_chunks table with id, content (text), embedding vector(1536), metadata (jsonb). Use the code panel for this.
- The query: SELECT content FROM policy_chunks ORDER BY embedding <=> query_embedding LIMIT 5. Define the <=> operator (cosine distance in pgvector) and top-k (you ask for the k most similar chunks; here k=5).
- Speed: scanning every vector is O(n) and slow at scale. Define ANN = Approximate Nearest Neighbour: an index (HNSW or IVFFlat) trades a tiny bit of accuracy for big speed. You don't need the math — just: "an index makes search fast by being approximately right."
- Metadata filtering (set up the capstone HARD here): store fields like source, jurisdiction, date next to each vector, and filter with WHERE before/with the vector search, e.g. WHERE jurisdiction = 'NHS'. This is how one database serves many domains — the chapter-12 question.
- STAGE: use the code panel (buildCode) for the schema + the query, highlight lines per step; OR a nodes diagram of query-vector -> index -> top-k. Pick whichever reads clearer; code panel is recommended here.
- Travel-app callout: one policy_chunks table, a jurisdiction column, WHERE jurisdiction='NHS' then vector search — no need for separate databases yet (tease chapter 12).
- Explain-back: What does the <=> operator do? Why add an index instead of scanning all vectors? What is metadata filtering for, in one sentence?`
  },
  {
    file: 'ch04-chunking.html', num: '04',
    title: 'Chunking — splitting documents well',
    eyebrow: 'RAG course · chapter 04 · foundations',
    sub: 'You cannot embed a whole 50-page document as one vector — it blurs into mush. You split it into bite-size pieces. HOW you split decides how good retrieval is.',
    prev: { href: 'ch03-vector-databases.html', label: 'Vector databases' },
    next: { href: 'ch05-reranking.html', label: 'Re-ranking' },
    brief: `Teach: why chunk, then the strategies from naive to advanced.
- Define chunk: a bite-size piece of a document, embedded on its own. Why split: one vector for a whole doc averages every topic together (imprecise), and you'd hand the LLM far too much. Each chunk should hold ONE coherent idea.
- Strategy 1 — fixed-size chunking (the naive default): cut every N characters or tokens (say ~1000 chars). Define overlap: repeat the last slice of the previous chunk at the start of the next, so a sentence split across a boundary isn't lost. Simple and fast, BUT it cuts mid-sentence, mid-table, mid-clause and shreds structure. Tag this step bad/trade-off.
- Strategy 2 — context-aware chunking (the recommended one): split at NATURAL boundaries — headings, paragraphs, sections — so each chunk is self-contained. You can use the document's structure or an embedding model to find the boundaries. Mention Docling (a Python library that does "hybrid chunking", a form of this). Free, fast, preserves structure. This is the field-tactical pick. Tag good.
- Strategy 3 — late chunking (advanced, keep it short, mark as fascinating-not-required): embed the WHOLE document first using a long-context embedding model, THEN split the resulting token embeddings. Each chunk keeps awareness of the whole document. Most complex; include for exposure, say it's optional.
- The Goldilocks framing: chunks too BIG = imprecise retrieval + overwhelm the LLM; too SMALL = lose surrounding context. Aim for one coherent idea per chunk.
- STAGE: show one document block splitting into chunks. Contrast a fixed cut slicing through a sentence (bad) vs a clean split at a heading (good). Nodes or a simple SVG; light up per step.
- Travel-app callout: a policy PDF should split per clause/section so "alcohol is not reimbursable" stays intact as one chunk — not chopped every 1000 chars.
- Explain-back: Why not embed the whole document as one vector? What problem does overlap solve? Fixed-size vs context-aware — which preserves structure and why?`
  },
  {
    file: 'ch05-reranking.html', num: '05',
    title: 'Re-ranking — pull many, keep the best',
    eyebrow: 'RAG course · chapter 05 · retrieval',
    sub: 'The single most-used strategy in production RAG. A two-stage retrieval: grab lots of candidates cheaply, then a smarter (slower) model keeps only the few that are truly relevant.',
    prev: { href: 'ch04-chunking.html', label: 'Chunking' },
    next: { href: 'ch06-query-strategies.html', label: 'Query strategies' },
    brief: `Teach: two-stage retrieval and WHY a second model.
- Frame: vector similarity is fast but COARSE — the top-k can include near-misses. Re-ranking adds a precise second pass.
- Stage 1: pull a LARGE candidate set from the vector DB (say 50 chunks). Cheap and fast.
- Stage 2: a RERANKER model scores each (query, chunk) PAIR for true relevance; keep only the top few (say 5) to send to the LLM.
- Define cross-encoder vs bi-encoder clearly — this is the heart of the chapter:
  - Embeddings (chapter 2) are a BI-ENCODER: query and chunk are encoded SEPARATELY, then compared. Fast (you can pre-compute all doc vectors), but it never sees them together.
  - A reranker is usually a CROSS-ENCODER: it reads the query and the chunk TOGETHER in one pass, so it judges relevance far more accurately — but it's slow, so you only run it on the ~50 shortlist, never the whole database.
- Why it matters: handing the LLM 50 chunks overwhelms and distracts it (the "lost in the middle" effect — models pay less attention to the middle of a long context). Rerank lets you CONSIDER more but FEED less. Cost: one extra model call, but small.
- STAGE: a funnel — 50 candidate nodes -> reranker -> 5 kept. Animate the narrowing across steps (renderStage can show counts shrinking).
- Travel-app callout: a vague query pulls 40 loosely-related policy chunks; the reranker surfaces the 4 that actually answer "is a business-class flight allowed for a 6-hour trip?".
- Tag the cost step with { kind:'cost', label:'trade-off' }.
- Explain-back: Why two stages instead of one? Bi-encoder vs cross-encoder — which reads query and chunk together, and why is that slower? Why not just send all 50 chunks to the LLM?`
  },
  {
    file: 'ch06-query-strategies.html', num: '06',
    title: 'Query strategies — fix the question, not the storage',
    eyebrow: 'RAG course · chapter 06 · retrieval',
    sub: 'Three sibling strategies that spend an extra LLM call to aim the search better: expanding the query, asking it several ways at once, and grading-then-retrying.',
    prev: { href: 'ch05-reranking.html', label: 'Re-ranking' },
    next: { href: 'ch07-agentic-rag.html', label: 'Agentic & hierarchical RAG' },
    brief: `Teach: three query-side strategies that share one idea (spend an LLM call to aim retrieval).
- Common thread up front: chapters 4-5 improved STORAGE and FILTERING; these three improve the QUERY itself. The shared cost is latency + an extra LLM call.
- Strategy A — Query expansion: before searching, an LLM rewrites the user's short/vague query into a more detailed, specific one, adding terms you know help. "London costs?" -> "per-diem, hotel nightly cap, and ground-transport reimbursement limits for London business travel". One extra LLM call; better recall.
- Strategy B — Multi-query RAG: instead of one expanded query, the LLM generates SEVERAL different phrasings/angles, you search them all in PARALLEL, then merge and de-duplicate the results. More comprehensive coverage; costs more LLM + more DB queries.
- Strategy C — Self-reflective RAG: a self-correcting LOOP. After retrieving, an LLM GRADES the chunks against the question (e.g. 1-5 for relevance). If the grade is too low (say < 3), it refines the query and searches again. Self-corrects, at the cost of extra LLM calls after every search.
- Make the contrast crisp: expansion = one better query; multi-query = many queries at once; self-reflective = retrieve, judge, retry.
- STAGE: three small flows, or one query node branching into the three behaviours; light up one strategy per step. A live panel in renderStage can show the query text transforming.
- Travel-app callout: "London trip costs?" expands into the specific reimbursement terms; or self-reflection catches that the first chunks were about leave policy, not travel, and retries.
- Tag the cost steps with { kind:'cost', label:'trade-off' }.
- Explain-back: Expansion vs multi-query — what's the difference? What does the grader do in self-reflective RAG, and what triggers a retry? What's the shared cost of all three?`
  },
  {
    file: 'ch07-agentic-rag.html', num: '07',
    title: 'Agentic & hierarchical RAG',
    eyebrow: 'RAG course · chapter 07 · retrieval',
    sub: 'Stop forcing one fixed search. Give the agent tools and let it CHOOSE how to look — and learn the "search small, return big" pattern that pairs with it.',
    prev: { href: 'ch06-query-strategies.html', label: 'Query strategies' },
    next: { href: 'ch08-contextual-retrieval.html', label: 'Contextual retrieval' },
    brief: `Teach: agentic RAG, then hierarchical RAG as a special case.
- Agentic RAG: instead of always running ONE semantic search, give the LLM agent a set of TOOLS and let it DECIDE which to call based on the question. Example tools: semantic_search(query), read_full_document(id), sql_filter(field, value). Define "tool" plainly: a function the model can choose to call.
- Trade-off: very flexible and powerful, but LESS PREDICTABLE — the agent might choose the wrong tool. Use it when you can give clear instructions for WHEN to use each search method. Tag this { kind:'cost', label:'less predictable' }.
- Hierarchical RAG (Cole calls it a subset of agentic): store PARENT-CHILD chunk relationships as metadata. SEARCH SMALL — match a single precise paragraph — but RETURN BIG — pull the parent section or whole document for context. You get precision AND context.
- The two-table pattern: a chunks table (small pieces) plus a documents table (full text + higher-level info). A matched chunk's metadata points to its document, so you can fetch the whole thing when useful.
- Make the pairing explicit: agentic = the agent chooses HOW to search; hierarchical = one such choice (search small, return big).
- STAGE: show an agent node with branching tool options (semantic / read-full-doc / filter); and a small->big retrieval (a highlighted paragraph expanding to its parent section). Light up per step.
- Travel-app callout: for "what does clause 4.2 say?" the agent reads the whole policy document; for "can I expense wine?" it does a precise semantic search, then returns the surrounding section so the model sees the conditions.
- Explain-back: What makes RAG "agentic"? Why search small but return big? When does the unpredictability of agentic RAG become a problem?`
  },
  {
    file: 'ch08-contextual-retrieval.html', num: '08',
    title: 'Contextual retrieval',
    eyebrow: 'RAG course · chapter 08 · advanced',
    sub: `A lone chunk often loses its context — "the cap is 150 pounds" — cap on what, for whom? Anthropic's fix: have an LLM prepend each chunk with where it fits before you embed it.`,
    prev: { href: 'ch07-agentic-rag.html', label: 'Agentic & hierarchical RAG' },
    next: { href: 'ch09-knowledge-graphs.html', label: 'Knowledge graphs' },
    brief: `Teach: the ambiguous-chunk problem and the contextual-retrieval fix.
- The problem: when you chunk, a piece can become ambiguous on its own. "Maximum claimable: 150 pounds per night" — for which policy? which role? Retrieval then mixes up similar-looking chunks from different documents.
- The fix (Anthropic researched this and reported strong retrieval-accuracy gains): BEFORE embedding each chunk, use an LLM to write a short prefix describing how that chunk fits in the whole document, and PREPEND it. Then embed the prefixed text. Show the shape literally:
    "This chunk is from the UK NHS travel policy, hotel-expenses section, stating the nightly cap.
     ---
     Maximum claimable: 150 pounds per night."
  Note the triple-dash separator between the added context and the original chunk content.
- Why it works: the embedding (and the text the LLM later reads) now carries situating context, so the right chunk is retrieved and ambiguous collisions drop.
- Cost (tag { kind:'cost', label:'slow + pricey to index' }): you call an LLM for EVERY chunk at indexing time — slower and more expensive to BUILD the index, like knowledge graphs (next chapter). The retrieval side stays cheap. Worth it for corpora full of ambiguous, similar-looking chunks — exactly like multi-jurisdiction policy docs.
- STAGE: show a raw chunk vs the same chunk with the prepended context block + triple-dash. Light up the added prefix; a before/after.
- Travel-app callout: "maximum claimable: 150/night" is ambiguous across NHS vs government policies; the prefix names the policy + section, so the correct one is retrieved.
- Explain-back: What exactly gets prepended to each chunk, and at what stage? Why does that improve retrieval? What is the cost, and is it on the indexing side or the query side?`
  },
  {
    file: 'ch09-knowledge-graphs.html', num: '09',
    title: 'Knowledge graphs',
    eyebrow: 'RAG course · chapter 09 · advanced',
    sub: 'Some questions are about RELATIONSHIPS, not similar text. Store your knowledge as entities and the links between them, and the agent can follow connections vector search cannot.',
    prev: { href: 'ch08-contextual-retrieval.html', label: 'Contextual retrieval' },
    next: { href: 'ch10-pageindex.html', label: 'PageIndex' },
    brief: `Teach: knowledge graphs as an alternate/companion storage format.
- Reframe: vector search finds text that is SIMILAR. Some questions need CONNECTIONS — "which policies does the contractor travel rule depend on?" Similarity can't follow a chain; a graph can.
- Define graph database (Neo4j is the classic): stores NODES and EDGES. Define entity (a node: a person, place, policy, role, amount) and relationship (an edge with a label connecting two entities, e.g. APPLIES_TO, DEPENDS_ON, OVERRIDES).
- How it's built: usually an LLM EXTRACTS entities and relationships from your raw text and writes them into the graph. Mention Graphiti as a popular library for this.
- Power: great for INTERCONNECTED data and MULTI-HOP questions (questions that need following several links). Often combined with vector search — hybrid: similarity to find a starting point, the graph to follow relationships.
- Cost (tag { kind:'cost', label:'slow + pricey to build' }): because an LLM extracts over all your documents, building the graph is slow and expensive — like contextual retrieval.
- STAGE: draw a small graph — nodes (NHS Policy, General Cap, Clinical Staff, Clause 4.2) connected by labelled edges (APPLIES_TO, OVERRIDES, DEPENDS_ON). Use positioned .node boxes + simple connector lines, or inline SVG with the palette. Light up a node/edge per step; trace a multi-hop path in a later step.
- Travel-app callout: model that the NHS policy APPLIES_TO clinical staff and OVERRIDES the general cap — now you can answer "does the standard cap apply to a nurse?" by following edges, which pure vector search can't.
- Explain-back: What's the difference between a node and an edge? What is an LLM doing when you BUILD a knowledge graph? Give one question type where a graph beats vector similarity.`
  },
  {
    file: 'ch10-pageindex.html', num: '10',
    title: 'PageIndex — vectorless, reasoning-based RAG',
    eyebrow: 'RAG course · chapter 10 · advanced',
    sub: 'The contrarian approach. Its thesis: similarity is not relevance. Skip embeddings entirely — build a table-of-contents tree and let the LLM REASON its way to the right section.',
    prev: { href: 'ch09-knowledge-graphs.html', label: 'Knowledge graphs' },
    next: { href: 'ch11-fine-tuned-embeddings.html', label: 'Fine-tuned embeddings' },
    brief: `Teach: PageIndex (by VectifyAI) as the vectorless alternative to everything so far.
- Lead with the thesis, quote it: "similarity is not relevance — what you truly need in retrieval is relevance, and that requires reasoning." Vector search finds text that LOOKS similar, which is not always what ANSWERS the question — especially in long professional documents (financial filings, legal contracts, regulatory manuals).
- How it works — two phases, NO embeddings, NO vector DB, NO arbitrary chunking:
  1. Index generation: turn a long document into a HIERARCHICAL TREE that mirrors its Table of Contents. Each node = a real section with a title, a short summary, and page references. Structure is preserved, not chopped.
  2. Reasoning-based retrieval: hand the tree to an LLM and let it REASON down the branches to the right section — like a human expert flipping a manual to the correct chapter. The path it took is visible (traceable), unlike an opaque similarity score.
- Key claim (cite it): reported state-of-the-art 98.7% accuracy on FinanceBench, beating vector approaches on professional document analysis. Also context-aware (can fold in conversation history).
- Contrast table (put this in the stage or a step): PageIndex vs Vector RAG — Foundation (document structure + LLM reasoning vs embeddings + similarity); Database (none vs vector DB); Chunking (natural sections vs arbitrary chunks); Traceability (explicit reasoning path vs opaque scores).
- Trade-off (tag { kind:'cost', label:'LLM per query' }): retrieval needs an LLM call to navigate the tree (latency/cost) — but you skip all embedding infrastructure, keep structure, and get explainable retrieval. Best for LONG, well-STRUCTURED documents.
- STAGE: draw the TOC tree (root -> sections -> subsections) and animate the LLM reasoning a path down to a leaf. Use nested .node boxes or inline SVG; light up the chosen path across steps.
- Travel-app callout: corporate policy manuals ARE highly structured (numbered sections and clauses) — a TOC tree the agent reasons over could beat similarity for "what does section 4 say about international travel?".
- Explain-back: What does "similarity is not relevance" mean in practice? In PageIndex, what replaces the vector database and the chunks? What kind of document is it best suited to, and why?`
  },
  {
    file: 'ch11-fine-tuned-embeddings.html', num: '11',
    title: 'Fine-tuned embeddings',
    eyebrow: 'RAG course · chapter 11 · advanced',
    sub: 'The embedding model decides what "similar" means. Off-the-shelf, that meaning is generic. Fine-tune it on your domain and a small model can beat a big one — and you can even reshape what "close" means.',
    prev: { href: 'ch10-pageindex.html', label: 'PageIndex' },
    next: { href: 'ch12-travel-assistant.html', label: 'Your travel assistant' },
    brief: `Teach: fine-tuning the embedding model, with the sentiment example.
- Callback to chapter 2: the embedding model is what decides which texts land "close". Off-the-shelf models learned a GENERIC notion of similarity. You can specialize it.
- Define fine-tune: continue training a pretrained model on a smaller, domain-specific dataset so it specializes (legal, medical, your policy corpus). This applies to embedding models just like to LLMs, and it changes BOTH indexing-time and query-time embeddings.
- Payoff: roughly 5-10% accuracy gains reported; a SMALL or open-source fine-tuned model can OUTPERFORM a big generic one on YOUR data — cheaper to run, better results on your domain. Tag good.
- The sentiment example (keep this — it's the clearest illustration): a GENERIC model thinks "my order was late" is similar to "shipping was fast" — both are about the order/shipping. But fine-tune on SENTIMENT and "my order was late" instead lands closest to "items are always sold out" — because both are NEGATIVE experiences. You literally reshape what "close" means to fit your goal.
- Cost (tag { kind:'cost', label:'data + upkeep' }): needs a sizable LABELLED dataset, training infrastructure, and ongoing maintenance — it's now YOUR model to keep current. Reach for it LAST, once you have the data and the query volume to justify it.
- STAGE: two scatter layouts of the same three phrases — under a generic model vs a sentiment-fine-tuned model — showing the neighbour flip. Use positioned points; animate the move across steps via renderStage.
- Travel-app callout: probably overkill early on; name it as the lever to pull once you have lots of real (query, policy) pairs and want the last few points of accuracy.
- Explain-back: What does fine-tuning change about an embedding model? In the sentiment example, which neighbour did "my order was late" move from and to, and why? What's the cost that makes this a last resort?`
  },
  {
    file: 'ch12-travel-assistant.html', num: '12',
    title: 'Capstone — architecting your travel assistant',
    eyebrow: 'RAG course · chapter 12 · capstone',
    sub: 'Your own question, answered: one database or many for NHS vs government policy? One vector DB or several? And which 3-5 of these strategies should you actually pick?',
    prev: { href: 'ch11-fine-tuned-embeddings.html', label: 'Fine-tuned embeddings' },
    next: { href: 'index.html', label: 'Course map', disabled: true },
    brief: `This is the payoff chapter. It answers the learner's real questions (from their notes): "If we have a chat app with a booking system, is it wise to have separate databases per domain? NHS policy is not the same as government policy. How do we structure the app? Do we need different vector DBs?"
- Reframe the real question as ISOLATION: how separated must each policy domain's data be? Walk three escalating levels (build them as escalating nodes in the stage):
  LEVEL 1 (default) — ONE table, METADATA FILTER: a single policy_chunks table with a jurisdiction/domain column; query with WHERE domain = 'NHS' alongside the vector search. Simplest, one index to maintain, trivial cross-domain queries, and pgvector handles it. Start here. Tag good.
  LEVEL 2 — SEPARATE TABLES / SCHEMAS, same database: when domains have genuinely different shapes, retention rules, or access controls but you still want one database and easy ops.
  LEVEL 3 — SEPARATE PHYSICAL DATABASES: only when you need HARD isolation — compliance / data-residency, very different security boundaries, or independent scaling. It costs you cross-domain joins and real operational overhead. Tag this { kind:'cost', label:'only if forced' }.
- Answer "different vector DBs?" directly: almost never early. Use the SAME vector store (Postgres + pgvector) and PARTITION BY METADATA. You reach for separate stores for ISOLATION/COMPLIANCE reasons, not because RAG itself needs them.
- The decision rule to state plainly: start with metadata filtering; escalate to separate tables, then separate databases, ONLY when a concrete requirement (security, compliance, scale) forces the move. Do NOT pre-split — it adds cost and buys nothing until you have that requirement.
- Then: which STRATEGIES to actually pick? The course's source recommends combining THREE to FIVE, not all. Give a concrete starter set for THIS app and justify each in one line:
  (1) context-aware chunking — policy docs are structured, split per clause;
  (2) re-ranking — vague expense questions pull noisy candidates;
  (3) agentic RAG — let it choose precise-search vs read-whole-policy;
  plus two strong fits for policy specifically: (4) contextual retrieval — kills NHS-vs-gov chunk ambiguity; (5) metadata filtering by jurisdiction — the isolation answer above. Note PageIndex is worth evaluating because policy manuals are so structured.
- Tie back to the project's core rule (from its CLAUDE.md): the LLM DECIDES (which chunks, how to search, how to explain), deterministic code DOES (policy enforcement, booking). RAG retrieves the policy TEXT; deterministic code enforces the actual limit. RAG must never set the cap or approve anything.
- STAGE: show the three isolation levels as escalating boxes (light up per step), then a final "your recommended stack" summary node listing the 5 strategies.
- Explain-back: Which isolation level is your default, and what would force you up a level? One vector DB or many for NHS vs government policy — and why? Name your 3-5 strategies and justify one of them.`
  },
]

phase('Author chapters')

function navHtml(c) {
  return 'prevchap -> href="' + c.prev.href + '"' + (c.prev.disabled ? ' (DISABLED, add class="disabled")' : '') +
    ' label "‹ Prev: ' + c.prev.label + '" ; nextchap -> href="' + c.next.href + '"' +
    (c.next.disabled ? ' (DISABLED, add class="disabled")' : '') + ' label "Next: ' + c.next.label + ' ›"' +
    ' ; the map link stays href="index.html"'
}

const results = await parallel(CHAPTERS.map(c => () => {
  const out = DIR + '/' + c.file
  const prompt = SHARED +
    '\n\n========================================\nCHAPTER ' + c.num + '\n' +
    'OUTPUT FILE (write here): ' + out + '\n' +
    'TITLE (h1): ' + c.title + '\n' +
    'EYEBROW (.eyebrow div): ' + c.eyebrow + '\n' +
    'SUB (.sub paragraph): ' + c.sub + '\n' +
    'NAV: ' + navHtml(c) + '\n\n' +
    'CONTENT BRIEF:\n' + c.brief + '\n'
  return agent(prompt, { label: 'ch' + c.num, phase: 'Author chapters' })
    .then(r => ({ file: c.file, ok: true, summary: r }))
    .catch(e => ({ file: c.file, ok: false, summary: String(e) }))
}))

return results
