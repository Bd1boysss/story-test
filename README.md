# Story Mainnet Starter (Next.js)

A minimal Next.js app that registers an IP Asset on **Story Mainnet (1514)** and attaches **Programmable IP License (PIL)** terms using the official TypeScript SDK. All transactions are signed **server-side** with a wallet private key stored in environment variables.

> **Security tip:** Use a fresh wallet funded with small amounts of IP/WIP for testing. Never expose your private key in client code.

## What you get

- `/api/story/create-collection`: create an SPG NFT collection (server signed)
- `/api/story/register`: two modes
  - `spgMint`: mint NFT from your SPG collection **and** register IP + attach PIL terms (all in one call)
  - `existingNft`: register an existing NFT as IP + attach PIL terms

UI allows setting title/description/image and choosing a license flavor.

---

## 0) Requirements

- **Vercel** account (mobile friendly)
- **GitHub** account
- **Android only** is fine. (Optional: Termux if you want a local dev server.)

---

## 1) Get the code into GitHub (Android, no terminal)

1. Download the zip from ChatGPT.
2. Extract the zip in your Android file manager.
3. Go to `github.com` in your mobile browser → **New repository** → create (public or private).
4. In the repo page, tap **Add file → Upload files**, select all files/folders from the extracted project (`app`, `lib`, etc.), and upload. Commit the changes.

> Tip: Many Android file managers let you multi-select files. If not, upload the main folders one by one (`app/`, `lib/`, `package.json`, etc.).

### Alternative (with Termux)

```bash
pkg update && pkg install -y git nodejs unzip
mkdir ~/work && cd ~/work
# move zip here, then:
unzip story-mainnet-starter.zip -d story-mainnet-starter
cd story-mainnet-starter
npm i
# create a GitHub repo first, then:
git init
git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## 2) Deploy on Vercel (mobile)

1. Open **vercel.com/new** → **Import Git Repository** → pick your repo.
2. Framework: detected as **Next.js**. Keep defaults.
3. **Environment Variables** (add these):
   - `STORY_PRIVATE_KEY` → your wallet private key (with or without `0x`)
   - `STORY_RPC_URL` → e.g. `https://mainnet.storyrpc.io` (or Alchemy/Ankr/QuickNode)
   - *(optional)* `STORY_SPG_NFT_CONTRACT` → will be filled after you create a collection
   - *(optional)* `EXISTING_NFT_ADDRESS`, `EXISTING_NFT_TOKEN_ID`

4. Tap **Deploy**. When it’s live, open the URL.

---

## 3) Fund your wallet

- **Network:** Story Mainnet
- **Chain ID:** `1514`
- **Public RPC:** `https://mainnet.storyrpc.io` (or providers like Alchemy/Ankr/QuickNode)
- **Explorer:** `https://mainnet.storyscan.xyz`
- **Gas token:** `IP`

---

## 4) Use the app

1. (Optional) Tap **Create Collection** to deploy an SPG NFT collection. Copy the returned `spgNftContract` and add it to Vercel env `STORY_SPG_NFT_CONTRACT` then redeploy.
2. Fill **Title / Description / Image URL**.
3. Choose **License Flavor**.
4. Keep **Mode: Mint from SPG** (or switch to **Existing NFT** and fill address+tokenId).
5. Tap **Register**. Wait for success and view the transaction in **StoryScan**.

---

## Notes & constants

- WIP token (revenue token) on mainnet: `0x1514000000000000000000000000000000000000`
- RoyaltyPolicyLAP: `0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E`
- SDK client is created with `chainId: 1514` and your `STORY_RPC_URL`.

---

## Troubleshooting

- **INSUFFICIENT_FUNDS**: Fund your signer wallet with IP for gas.
- **Missing spgNftContract**: Create a collection first or set `STORY_SPG_NFT_CONTRACT`.
- **Invalid private key**: Ensure the key is hex, with or without `0x` prefix.
- **CORS or 500**: Check Vercel logs (Project → Deployments → Functions).

---

## Dev locally (optional on Android via Termux)

```bash
pkg update && pkg install -y nodejs git
git clone https://github.com/<you>/<repo>.git
cd <repo>
npm i
cp .env.example .env # fill envs
npm run dev
# browse http://127.0.0.1:3000 on your phone
```

---

## Security

- Never commit `.env` secrets.
- Use a burner wallet for server-side signing.
- Consider provider RPC rate-limits for public endpoints.
bump: redeploy
