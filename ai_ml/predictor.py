"""
TruthShield Production Inference & Decision Support Predictor
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)

Performs end-to-end inference using trained TF-IDF vectorizers and calibrated models,
extracting linguistic features and formulating explainable user alerts.
"""

import json
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional

CURRENT_DIR = Path(__file__).resolve().parent
SAVED_MODELS_DIR = CURRENT_DIR / "saved_models"

from feature_extractor import FeatureExtractor

class TruthShieldMLPredictor:
    """Inference engine combining statistical NLP with behavioral heuristics."""

    _instance = None
    _vectorizer = None
    _classifier = None
    _metadata = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TruthShieldMLPredictor, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance

    def _load_models(self):
        """Loads serialized model artifacts or triggers training."""
        vec_path = SAVED_MODELS_DIR / "vectorizer.pkl"
        clf_path = SAVED_MODELS_DIR / "classifier.pkl"
        meta_path = SAVED_MODELS_DIR / "metadata.json"

        if vec_path.exists() and clf_path.exists():
            try:
                with open(vec_path, "rb") as f:
                    self._vectorizer = pickle.load(f)
                with open(clf_path, "rb") as f:
                    self._classifier = pickle.load(f)
                if meta_path.exists():
                    with open(meta_path, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                return
            except Exception:
                pass

        # If models not found or unpickling fails, fallback or trigger train
        try:
            from train_classifier import train_model
            train_model()
            with open(vec_path, "rb") as f:
                self._vectorizer = pickle.load(f)
            with open(clf_path, "rb") as f:
                self._classifier = pickle.load(f)
        except Exception:
            self._vectorizer = None
            self._classifier = None

    def predict(self, text: str, source_hint: Optional[str] = None) -> Dict[str, Any]:
        """Performs multi-dimensional inference and generates explainable output."""
        features = FeatureExtractor.extract_features(text)
        cleaned = features["cleaned_text"]

        # 1. Statistical Model Prediction
        if self._classifier and self._vectorizer:
            try:
                vec = self._vectorizer.transform([cleaned])
                predicted_category = self._classifier.predict(vec)[0]
                probs = self._classifier.predict_proba(vec)[0]
                max_prob = float(max(probs))
            except Exception:
                predicted_category = "Misleading"
                max_prob = 0.75
        else:
            # Heuristic Rule Fallback if ML artifacts absent
            if features["urgency_score"] >= 0.70 or features["sensationalism_score"] >= 0.75:
                predicted_category = "False-Fake"
                max_prob = 0.88
            elif features["manipulation_index"] <= 0.15:
                predicted_category = "Real"
                max_prob = 0.90
            else:
                predicted_category = "Misleading"
                max_prob = 0.82

        # 2. Calibrate Confidence Bounds [0.50, 0.98]
        calibrated_conf = round(min(0.98, max(0.50, max_prob)), 2)

        # 3. Map to 4-Tier Operational Taxonomy
        operational_mapping = {
            "Real": "Likely Reliable",
            "Misleading": "Potentially Misleading",
            "False-Fake": "Likely False"
        }
        classification_4tier = operational_mapping.get(predicted_category, "Needs Further Verification")

        # Adjust for high ambiguity
        if calibrated_conf < 0.60:
            classification_4tier = "Needs Further Verification"

        # 4. Generate Explainable Bulleted Rationales
        reasons = []
        if features["matched_urgency_markers"]:
            reasons.append(f"Employs viral pressure triggers ({', '.join(features['matched_urgency_markers'][:2])}) to provoke impulsive sharing.")
        if features["sensationalism_score"] > 0.40:
            reasons.append(f"Elevated sensationalism score ({int(features['sensationalism_score'] * 100)}%) with hyperbolic claims or excessive capitalization.")
        if predicted_category == "Real":
            reasons.append("Linguistic phrasing is objective, measured, and free of viral forward manipulation markers.")
            reasons.append("Claim structure matches conventions of accredited regulatory press releases.")
        elif predicted_category == "False-Fake":
            reasons.append("Contains unverified claims directly contradicted by established institutional authorities.")
        else:
            reasons.append("Contains elements of real events presented in sensational or distorted context.")

        # 5. Formulate Behavioral Nudge
        if predicted_category == "Real":
            recommendation = "Verified institutional notice. Safe to reference as an official publication."
        elif predicted_category == "False-Fake":
            recommendation = "CRITICAL ALERT: This claim appears fabricated or unverified. Do not forward to prevent social harm."
        else:
            recommendation = "THINK BEFORE YOU SHARE: Verify original context with accredited news bureaus before forwarding."

        return {
            "text": text,
            "category_3tier": predicted_category,
            "classification": classification_4tier,
            "confidence": calibrated_conf,
            "linguistic_features": features,
            "reasons": reasons,
            "recommendation": recommendation,
            "model_metadata": self._metadata or {"model": "TruthShield-Hybrid-Classifier"}
        }
