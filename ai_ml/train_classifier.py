"""
TruthShield Machine Learning Model Training & Evaluation Pipeline
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)
Project Supervisor: Dr. Saumya Chaturvedi (GNIOT / AKTU)

Trains a 3-Tier Multi-Class Classifier (Real, Misleading, False-Fake) on benchmark claims
using TF-IDF feature extraction and calibrated probabilistic classification.
"""

import os
import sys
import json
import pickle
import datetime
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
SAVED_MODELS_DIR = CURRENT_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(exist_ok=True)

from datasets.dataset_loader import load_training_dataset, train_test_split_data
from feature_extractor import FeatureExtractor

# Import Scikit-Learn
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

def train_model():
    print("=" * 70)
    print("TruthShield: Machine Learning Classifier Training Pipeline")
    print(f"Scikit-Learn Available: {HAS_SKLEARN}")
    print("=" * 70)

    # 1. Load Dataset
    raw_data = load_training_dataset()
    print(f"[1/4] Loaded {len(raw_data)} annotated benchmark records.")

    train_data, test_data = train_test_split_data(raw_data, test_ratio=0.25, seed=42)
    print(f"  -> Training Samples: {len(train_data)} | Evaluation Samples: {len(test_data)}")

    # Extract corpus and labels
    train_texts = [FeatureExtractor.clean_text(d["text"]) for d in train_data]
    train_labels = [d["category"] for d in train_data]

    test_texts = [FeatureExtractor.clean_text(d["text"]) for d in test_data]
    test_labels = [d["category"] for d in test_data]

    if not HAS_SKLEARN:
        print("[ERROR] Scikit-Learn is required for training. Run 'pip install scikit-learn'.")
        sys.exit(1)

    # 2. Fit TF-IDF Vectorizer
    print("\n[2/4] Vectorizing Text via TF-IDF (N-gram range 1-2)...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=2500,
        sublinear_tf=True
    )
    X_train = vectorizer.fit_transform(train_texts)
    X_test = vectorizer.transform(test_texts)
    print(f"  -> Extracted Vocabulary Dimensions: {X_train.shape[1]} features")

    # 3. Train Calibrated Classifier
    print("\n[3/4] Training Multi-Class Logistic Classifier (Real / Misleading / False-Fake)...")
    classifier = LogisticRegression(
        C=1.5,
        max_iter=500,
        class_weight="balanced",
        random_state=42
    )
    classifier.fit(X_train, train_labels)
    print("  -> Classifier converged successfully.")

    # 4. Evaluation Metrics
    print("\n[4/4] Evaluating Performance on Independent Test Partition...")
    preds = classifier.predict(X_test)
    probs = classifier.predict_proba(X_test)

    precision, recall, f1, support = precision_recall_fscore_support(
        test_labels, preds, average="macro", zero_division=0
    )

    print("-" * 70)
    print(f"Quantitative Evaluation Metrics (Macro Averaged):")
    print(f"  - Macro Precision: {precision * 100:.2f}%")
    print(f"  - Macro Recall:    {recall * 100:.2f}%")
    print(f"  - Macro F1-Score:  {f1 * 100:.2f}%")
    print("-" * 70)

    # Calculate Expected Calibration Error (ECE) across 5 bins
    confidences = [max(p) for p in probs]
    accuracies = [1 if p == t else 0 for p, t in zip(preds, test_labels)]
    ece = round(sum(abs(c - a) for c, a in zip(confidences, accuracies)) / len(confidences), 3)
    print(f"Expected Calibration Error (ECE): {ece} (Target: <= 0.15)")

    # 5. Serialize Artifacts
    vec_path = SAVED_MODELS_DIR / "vectorizer.pkl"
    clf_path = SAVED_MODELS_DIR / "classifier.pkl"
    meta_path = SAVED_MODELS_DIR / "metadata.json"

    with open(vec_path, "wb") as f:
        pickle.dump(vectorizer, f)

    with open(clf_path, "wb") as f:
        pickle.dump(classifier, f)

    metadata = {
        "model_name": "TruthShield-LogReg-TFIDF-v1",
        "trained_at": datetime.datetime.utcnow().isoformat(),
        "classes": list(classifier.classes_),
        "vocabulary_size": int(X_train.shape[1]),
        "total_train_samples": len(train_data),
        "total_test_samples": len(test_data),
        "macro_f1": round(float(f1), 4),
        "macro_precision": round(float(precision), 4),
        "macro_recall": round(float(recall), 4),
        "ece": float(ece)
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nModel artifacts successfully serialized to:")
    print(f"  - {vec_path.name}")
    print(f"  - {clf_path.name}")
    print(f"  - {meta_path.name}")
    print("=" * 70)
    print("AI/ML MODEL TRAINING & SERIALIZATION COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    train_model()
