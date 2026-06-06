from flask import Flask, render_template, jsonify, request
import requests
import os
import time
from datetime import datetime

TRACK_COINS = [
    "bitcoin","ethereum","binancecoin","solana","ripple","cardano","avalanche-2","polkadot",
    "chainlink","matic-network","cosmos","the-open-network","near","aptos","sui","arbitrum",
    "optimism","aave","render-token","fetch-ai","rocket-pool","filecoin","the-graph","1inch",
    "curve-dao-token","mask-network","flux","gala","yield-guild-games","apecoin","arweave","kujira",
    "osmosis","jupiter","sonic-3","puffer-finance","ethena","berachain","story","hyperliquid","kaito",
    "cookie","bsquared","initia","movement","avail","stride","quickswap","lido-dao","beldex","citrea",
    "nubcat","trava","smart-hub","changenow","vaultka","navi"
]
CACHE = {"data": None, "ts": 0}
TTL = 30

app = Flask(__name__, template_folder="templates", static_folder="static")

def fetch_coingecko():
    ids = ",".join(TRACK_COINS)
    url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h"
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("[ERROR] fetch cg:", e)
        return []

def prepare_payload(coins=None, sort="1h"):
    if coins is None:
        return []
    out = []
    for c in coins:
        try:
            item = {
                "symbol": (c.get("symbol") or "").upper(),
                "name": c.get("name"),
                "price": c.get("current_price"),
                "change1h": c.get("price_change_percentage_1h_in_currency"),
                "change24h": c.get("price_change_percentage_24h"),
            }
            item["primary_change"] = item["change1h"] if sort == "1h" else item["change24h"]
            item["volume"] = c.get("total_volume")
            out.append(item)
        except Exception:
            pass
    out.sort(key=lambda x: (x["primary_change"] or 0), reverse=True)
    return out[:40]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/scan")
def scan():
    sort = request.args.get("timeframe", "1h")
    now = time.time()
    if CACHE["data"] is None or (now - CACHE["ts"]) > TTL:
        coins = fetch_coingecko()
        CACHE["data"] = prepare_payload(coins, sort=sort)
        CACHE["ts"] = now
    return jsonify(CACHE["data"])

@app.route("/api/events")
def events():
    return jsonify([])

@app.route("/api/trade", methods=["POST"])
def save_trade():
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
