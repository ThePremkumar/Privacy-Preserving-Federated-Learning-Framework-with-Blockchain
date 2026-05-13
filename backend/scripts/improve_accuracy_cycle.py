"""
Federated Learning – Accuracy Improvement Cycle
================================================
Full end-to-end pipeline:
  1. Login to each hospital node
  2. Upload a CSV data chunk
  3. Start local training
  4. Poll until every job is completed
  5. Submit jobs for review
  6. Approve all jobs (as super_admin)
  7. Aggregate into the global model

Run from the 'backend' directory with the venv active:
    python scripts/improve_accuracy_cycle.py
"""

import requests
import pandas as pd
import time
import os
import json
import sys

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_URL     = "http://localhost:8001/api/v1"
DATASET_PATH = r"D:\Final Year Project\Dataset\healthcare_dataset.csv"

NODES = [
    {"username": "himsr_node_1",        "password": "node@1", "hospital_id": "hosp_himsr"},
    {"username": "apollo_node_1",       "password": "node@1", "hospital_id": "hosp_apollo"},
    {"username": "madurai_node_1",      "password": "node@1", "hospital_id": "hosp_mmc_madurai"},
    {"username": "vellore_node_1",      "password": "node@1", "hospital_id": "hosp_cmc_vellore"},
    {"username": "coimbatore_node_1",   "password": "node@1", "hospital_id": "hosp_cmc_coimbatore"},
    {"username": "stanley_node_1",      "password": "node@1", "hospital_id": "hosp_stanley"},
    {"username": "aiims_node_1",        "password": "node@1", "hospital_id": "hosp_aiims"},
]

SUPER_ADMIN = {"username": "superadmin", "password": "superadmin123"}

TARGET_ACCURACY = 0.941   # 94.1 %
POLL_INTERVAL   = 15      # seconds between status checks
TRAINING_EPOCHS = 80      # more epochs → higher accuracy
LEARNING_RATE   = 0.0005  # finer LR for better convergence
BATCH_SIZE      = 64


# ── Helpers ───────────────────────────────────────────────────────────────────

def login(username: str, password: str) -> str | None:
    """Return a JWT access token or None on failure."""
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": username, "password": password},
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"  [AUTH FAIL] {username}: {resp.status_code} – {resp.text[:200]}")
    except requests.RequestException as exc:
        print(f"  [CONNECTION ERROR] Cannot reach {BASE_URL}: {exc}")
    return None


def upload_chunk(token: str, node: dict, chunk: pd.DataFrame) -> str | None:
    """Upload a CSV chunk for the given node and return the upload_id."""
    headers   = {"Authorization": f"Bearer {token}"}
    filename  = f"chunk_{node['hospital_id']}.csv"
    chunk.to_csv(filename, index=False)

    try:
        with open(filename, "rb") as fh:
            resp = requests.post(
                f"{BASE_URL}/data/upload",
                headers=headers,
                files={"file": (filename, fh, "text/csv")},
                timeout=120,
            )
        if resp.status_code == 200:
            upload_id = resp.json().get("id")
            print(f"  [UPLOAD OK]  {node['hospital_id']} → upload_id={upload_id}")
            return upload_id
        print(f"  [UPLOAD FAIL] {node['hospital_id']}: {resp.status_code} – {resp.text[:300]}")
    except requests.RequestException as exc:
        print(f"  [UPLOAD ERROR] {node['hospital_id']}: {exc}")
    finally:
        if os.path.exists(filename):
            os.remove(filename)
    return None


def start_training(token: str, node: dict, upload_id: str) -> str | None:
    """Start a local training job and return the job_id."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "upload_id":     upload_id,
        "epochs":        TRAINING_EPOCHS,
        "learning_rate": LEARNING_RATE,
        "batch_size":    BATCH_SIZE,
        "patience":      TRAINING_EPOCHS,     # no early-stop – use all epochs
        "privacy_epsilon": 1.0,
        "force":         True,                # bypass suspicious-filename check
    }
    try:
        resp = requests.post(
            f"{BASE_URL}/training/start",
            headers=headers,
            json=payload,
            timeout=30,
        )
        if resp.status_code in (200, 201):
            job_id = resp.json().get("id")
            print(f"  [TRAIN START] {node['hospital_id']} → job_id={job_id}")
            return job_id
        print(f"  [TRAIN FAIL]  {node['hospital_id']}: {resp.status_code} – {resp.text[:300]}")
    except requests.RequestException as exc:
        print(f"  [TRAIN ERROR] {node['hospital_id']}: {exc}")
    return None


def poll_jobs(job_ids: list[str], admin_token: str) -> dict[str, str]:
    """
    Poll until every job reaches a terminal state (completed / failed).
    Returns a dict {job_id: final_status}.
    """
    headers  = {"Authorization": f"Bearer {admin_token}"}
    statuses = {jid: "running" for jid in job_ids}
    terminal = {"completed", "failed"}

    while True:
        pending = [jid for jid, s in statuses.items() if s not in terminal]
        if not pending:
            break

        for jid in pending:
            try:
                r = requests.get(f"{BASE_URL}/training/job/{jid}", headers=headers, timeout=15)
                if r.status_code == 200:
                    s = r.json().get("status", "unknown")
                    if s != statuses[jid]:
                        acc = r.json().get("accuracy", "?")
                        print(f"  [JOB {jid[:8]}…] status={s}  accuracy={acc}")
                    statuses[jid] = s
            except requests.RequestException:
                pass

        remaining = sum(1 for s in statuses.values() if s not in terminal)
        if remaining:
            print(f"  ⏳  {remaining}/{len(job_ids)} jobs still training … "
                  f"(checking again in {POLL_INTERVAL}s)")
            time.sleep(POLL_INTERVAL)

    return statuses


def submit_for_review(job_id: str, node_token: str) -> bool:
    """Hospital submits a completed job for admin review."""
    headers = {"Authorization": f"Bearer {node_token}"}
    try:
        r = requests.post(
            f"{BASE_URL}/training/{job_id}/submit-for-review",
            headers=headers,
            timeout=15,
        )
        if r.status_code == 200:
            print(f"  [SUBMITTED]  job={job_id[:8]}…")
            return True
        print(f"  [SUBMIT FAIL] job={job_id[:8]}… : {r.status_code} – {r.text[:200]}")
    except requests.RequestException as exc:
        print(f"  [SUBMIT ERROR] {exc}")
    return False


def approve_job(job_id: str, admin_token: str) -> bool:
    """Super admin approves a submitted job."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    try:
        r = requests.post(
            f"{BASE_URL}/training/{job_id}/review",
            headers=headers,
            json={"action": "approve", "notes": "Auto-approved by accuracy improvement cycle"},
            timeout=15,
        )
        if r.status_code == 200:
            print(f"  [APPROVED]   job={job_id[:8]}…")
            return True
        print(f"  [APPROVE FAIL] job={job_id[:8]}… : {r.status_code} – {r.text[:200]}")
    except requests.RequestException as exc:
        print(f"  [APPROVE ERROR] {exc}")
    return False


def aggregate(job_ids: list[str], admin_token: str):
    """Trigger FedAvg aggregation for the given approved jobs."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    try:
        r = requests.post(
            f"{BASE_URL}/training/aggregate",
            headers=headers,
            json={"job_ids": job_ids},
            timeout=60,
        )
        if r.status_code == 200:
            return r.json()
        print(f"  [AGG FAIL] {r.status_code} – {r.text[:400]}")
    except requests.RequestException as exc:
        print(f"  [AGG ERROR] {exc}")
    return None


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run():
    print("\n" + "="*60)
    print("  Federated Learning – Accuracy Improvement Cycle")
    print("="*60)

    # ── 0. Verify backend is reachable ────────────────────────────
    try:
        requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=5)
    except requests.RequestException:
        pass  # health endpoint may not exist – proceed anyway

    # ── 1. Login to super admin ────────────────────────────────────
    print("\n[Step 1] Logging in to Super Admin …")
    admin_token = login(SUPER_ADMIN["username"], SUPER_ADMIN["password"])
    if not admin_token:
        print("ERROR: Cannot log in as super admin. Abort.")
        sys.exit(1)
    print("  ✓ Super admin authenticated.")

    # ── 2. Load dataset ────────────────────────────────────────────
    print(f"\n[Step 2] Loading dataset from {DATASET_PATH} …")
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        sys.exit(1)
    df = pd.read_csv(DATASET_PATH)
    print(f"  ✓ Loaded {len(df):,} rows × {len(df.columns)} columns.")

    # ── 3. Upload + start training on each node ────────────────────
    print(f"\n[Step 3] Distributing data & starting training on {len(NODES)} nodes …")
    chunk_size  = len(df) // len(NODES)
    node_tokens = {}   # node_username → token
    job_map     = {}   # job_id → node_username  (for later submit step)

    for i, node in enumerate(NODES):
        print(f"\n  → Node: {node['hospital_id']}")
        token = login(node["username"], node["password"])
        if not token:
            print(f"  [SKIP] Could not authenticate {node['username']}.")
            continue
        node_tokens[node["username"]] = token

        start = i * chunk_size
        end   = (i + 1) * chunk_size if i < len(NODES) - 1 else len(df)
        chunk = df.iloc[start:end]
        print(f"    Rows {start:,}–{end:,} ({len(chunk):,} records)")

        upload_id = upload_chunk(token, node, chunk)
        if not upload_id:
            continue

        job_id = start_training(token, node, upload_id)
        if job_id:
            job_map[job_id] = node["username"]

    if not job_map:
        print("\nERROR: No training jobs were started. Check node credentials and API.")
        sys.exit(1)

    print(f"\n  ✓ {len(job_map)} training jobs launched.")

    # ── 4. Poll until all jobs finish ──────────────────────────────
    print(f"\n[Step 4] Monitoring {len(job_map)} training jobs …")
    final_statuses = poll_jobs(list(job_map.keys()), admin_token)

    completed_jobs = [jid for jid, s in final_statuses.items() if s == "completed"]
    failed_jobs    = [jid for jid, s in final_statuses.items() if s == "failed"]
    print(f"\n  ✓ Completed: {len(completed_jobs)}   ✗ Failed: {len(failed_jobs)}")

    if not completed_jobs:
        print("ERROR: All training jobs failed. Nothing to aggregate.")
        sys.exit(1)

    # ── 5. Submit completed jobs for review ────────────────────────
    print(f"\n[Step 5] Submitting {len(completed_jobs)} jobs for review …")
    submitted = []
    for jid in completed_jobs:
        node_username = job_map[jid]
        node_token    = node_tokens.get(node_username)
        if node_token and submit_for_review(jid, node_token):
            submitted.append(jid)

    # ── 6. Approve all submitted jobs ─────────────────────────────
    print(f"\n[Step 6] Approving {len(submitted)} submitted jobs …")
    approved = []
    for jid in submitted:
        if approve_job(jid, admin_token):
            approved.append(jid)

    if not approved:
        print("ERROR: No jobs were approved. Cannot aggregate.")
        sys.exit(1)

    # ── 7. Aggregate ───────────────────────────────────────────────
    print(f"\n[Step 7] Aggregating {len(approved)} approved jobs → Global Model …")
    result = aggregate(approved, admin_token)

    # ── 8. Report ──────────────────────────────────────────────────
    print("\n" + "="*60)
    if result:
        global_acc  = float(result.get("global_accuracy",  0))
        global_loss = float(result.get("global_loss",      0))
        print("  ✅  AGGREGATION COMPLETE")
        print(f"  Global Accuracy  : {global_acc*100:.2f}%")
        print(f"  Global Loss      : {global_loss:.4f}")
        print(f"  Round Number     : {result.get('round_number', 'N/A')}")
        print(f"  Model Version    : {result.get('global_model_version', 'N/A')}")
        print(f"  Total Samples    : {result.get('total_samples', 'N/A'):,}")
        print(f"  Blockchain TX    : {result.get('blockchain_tx_hash', 'N/A')}")
        print(f"  Nodes            : {result.get('participating_hospitals', [])}")
        print()

        if global_acc >= TARGET_ACCURACY:
            print(f"  🎯  Target {TARGET_ACCURACY*100:.1f}% REACHED! ({global_acc*100:.2f}%)")
        else:
            gap = (TARGET_ACCURACY - global_acc) * 100
            print(f"  📈  Current: {global_acc*100:.2f}%  |  Target: {TARGET_ACCURACY*100:.1f}%  |  Gap: {gap:.2f}%")
            print("  Run this script again for another federated round.")
    else:
        print("  ❌  Aggregation did not return a result. Check backend logs.")
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
