"""
TruthShield Dataset Loader & Preprocessing Utility
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)

Loads, cleans, and splits benchmark misinformation datasets for model training and evaluation.
"""

import json
from pathlib import Path
from typing import List, Dict, Tuple, Any

DATASETS_DIR = Path(__file__).resolve().parent

def load_training_dataset(filepath: Path = None) -> List[Dict[str, Any]]:
    target = filepath or (DATASETS_DIR / "training_claims.json")
    if not target.exists():
        raise FileNotFoundError(f"Training dataset not found at {target}")
    with open(target, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

def train_test_split_data(
    data: List[Dict[str, Any]], 
    test_ratio: float = 0.25, 
    seed: int = 42
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Deterministically splits dataset into training and testing partitions."""
    import random
    rng = random.Random(seed)
    shuffled = list(data)
    rng.shuffle(shuffled)
    split_idx = int(len(shuffled) * (1.0 - test_ratio))
    train_set = shuffled[:split_idx]
    test_set = shuffled[split_idx:]
    return train_set, test_set
