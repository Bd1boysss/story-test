"use client";
import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("My First Story IP");
  const [description, setDescription] = useState("Made on mobile with Vercel + Story SDK.");
  const [image, setImage] = useState("https://picsum.photos/600/400");
  const [mode, setMode] = useState<"spgMint" | "existingNft">("spgMint");
  const [flavor, setFlavor] = useState<"nonCommercial" | "commercialUse" | "commercialRemix">("commercialRemix");
  const [spg, setSpg] = useState<string>("");
  const [nft, setNft] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(path: string, data?: any) {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const rsp = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined
      });
      const json = await rsp.json();
      if (!rsp.ok || !json.ok) throw new Error(json.error || "Unknown error");
      setResult(json);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="hero">
        <span className="badge">Story Protocol • Mainnet (1514)</span>
        <h1>Story Mainnet Starter</h1>
        <p className="small">Register your IP on-chain + attach license terms (PIL). Server signs with your env wallet. Never share your private key publicly.</p>
      </div>

      <div className="card">
        <div className="row">
          <div className="grid">
            <div>
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
            </div>
            <div>
              <label>License Flavor</label>
              <select value={flavor} onChange={e => setFlavor(e.target.value as any)}>
                <option value="nonCommercial">Non-Commercial (with attribution)</option>
                <option value="commercialUse">Commercial Use (flat fee only)</option>
                <option value="commercialRemix">Commercial Remix (50% rev share)</option>
              </select>
            </div>
          </div>
          <div className="grid">
            <div>
              <label>Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
            </div>
            <div>
              <label>Image URL</label>
              <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label>Mode</label>
            <div className="grid">
              <button className={mode==="spgMint" ? "" : "secondary"} onClick={() => setMode("spgMint")}>Mint from SPG collection</button>
              <button className={mode==="existingNft" ? "" : "secondary"} onClick={() => setMode("existingNft")}>Use existing NFT</button>
            </div>
          </div>

          {mode === "spgMint" ? (
            <div className="grid">
              <div>
                <label>SPG NFT Contract (optional if set in env)</label>
                <input value={spg} onChange={e => setSpg(e.target.value)} placeholder="0x..." />
              </div>
              <div>
                <label>Create New SPG Collection</label>
                <button disabled={loading} onClick={() => call("/api/story/create-collection", { name: "My SPG NFTs", symbol: "MYIP" })}>
                  {loading ? "Working..." : "Create Collection"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid">
              <div>
                <label>NFT Contract</label>
                <input value={nft} onChange={e => setNft(e.target.value)} placeholder="0x..." />
              </div>
              <div>
                <label>Token ID</label>
                <input value={tokenId} onChange={e => setTokenId(e.target.value)} placeholder="1" />
              </div>
            </div>
          )}

          <div>
            <button disabled={loading} onClick={() => {
              const base = { title, description, image, flavor, mode };
              if (mode === "spgMint") {
                call("/api/story/register", { ...base, spgNftContract: spg || undefined });
              } else {
                call("/api/story/register", { ...base, nftContract: nft, tokenId });
              }
            }}>
              {loading ? "Submitting..." : "Register on Story Mainnet"}
            </button>
          </div>

          {err && <p className="error">Error: {err}</p>}
          {result && (
            <div className="card">
              <h3>Success ✅</h3>
              <p className="small">txHash: <code>{result.txHash}</code></p>
              <p>IP ID: <strong className="success">{result.ipId}</strong></p>
              {result.tokenId && <p>NFT Token ID: <strong>{result.tokenId}</strong></p>}
              <p>
                <a className="link" href={`https://mainnet.storyscan.xyz/tx/${result.txHash}`} target="_blank">View on StoryScan</a>
              </p>
            </div>
          )}
        </div>
      </div>

      <footer>
        Built for mobile-first deploys. Keep your private key safe: set it ONLY in Vercel project env vars.
      </footer>
    </main>
  );
}
