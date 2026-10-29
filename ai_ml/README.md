# TruthShield: AI & Machine Learning Layer

**Layer Responsibility:** AI/ML Engineering, Prompt Design & Confidence Calibration  
**Lead AI Developer:** **Aarti Vishwakarma** (University Roll No: `2501320140001`)  
**Architecture Lead:** **Yaseen Jamshed** (University Roll No: `2501320140158`)  
**Project Supervisor:** **Dr. Saumya Chaturvedi**, Associate Professor, DCA, GNIOT  
**Affiliated University:** Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow  

---

## 📌 Architecture Overview

The AI & Machine Learning Layer powers TruthShield's multi-dimensional credibility assessment and explainable decision-support mechanisms. It is designed to overcome binary oversimplification by combining:
1. **Statistical NLP Classifiers:** TF-IDF n-gram vectorization with calibrated probabilistic classification across three academic tiers (**Real**, **Misleading**, **False-Fake**).
2. **Linguistic Feature Engineering:** Extraction of urgency indicators, sensationalism indices, emotional coercion triggers, and uppercase/exclamation density.
3. **Pluggable Generative LLM Abstraction:** Dynamic orchestration of state-of-the-art models (Groq Llama-3, OpenAI GPT-4o-mini, Google Gemini, Anthropic Claude) with offline heuristic fallback.
4. **Calibrated Confidence Bounds ($0.50 \le c \le 0.98$):** Mathematical credibility scoring $\Psi(C)$ that explicitly rejects fabricated 100% certainty.

```
[ User Input (Text / URL / OCR Screenshot) ]
                     │
                     ▼
       ┌───────────────────────────┐
       │   Feature Extractor       │
       │   - Urgency Triggers      │
       │   - Sensationalism Index  │
       │   - Manipulation Score M  │
       └─────────────┬─────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐   ┌───────────────────┐
│ Statistical ML   │   │  Generative LLM   │
│ Classifier       │   │  Analyzer         │
│ (TF-IDF + LogReg)│   │  (Groq/GPT/Gemini)│
└────────┬─────────┘   └─────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
       ┌───────────────────────────┐
       │ Calibrated Synthesis      │
       │ • 3-Tier Academic Class   │
       │ • Calibrated Conf [0.5,0.98]
       │ • 3+ Bulleted Rationales  │
       │ • Pre-Share Behavioral Nudge
       └───────────────────────────┘
```

---

## 🧮 Mathematical Credibility Formulation

As formalized in Section 4.5 of our research paper, the composite Credibility Score $\Psi(C) \in [0, 1]$ is computed as:

$$\Psi(C) = w_s \cdot \text{Rep}(S) + w_e \cdot \left[ \frac{1}{k} \sum_{i=1}^{k} \sigma(e_i) \cdot \text{Rel}(e_i) \right] - w_m \cdot M$$

Where:
- $\text{Rep}(S) \in [0, 1]$: Source domain reputation index.
- $\sigma(e_i) \in \{+1, -1, 0\}$: Stance weight (`SUPPORTING` = $+1$, `REFUTING` = $-1$, `CONTEXTUAL` = $0$).
- $\text{Rel}(e_i) \in [0, 1]$: Semantic relevance / cosine similarity to claim.
- $M \in [0, 1]$: Composite linguistic manipulation index.
- Confidence calibration: $c = \min(0.98, \max(0.50, |\Psi(C) - 0.5| \times 2))$.

---

## 📁 Folder Contents

- **`datasets/`**:
  - `training_claims.json`: Annotated benchmark dataset of multi-domain claims across health, science, finance, and viral hoaxes.
  - `dataset_loader.py`: Dataset loading, balancing, and deterministic train/test splitting.
- **`feature_extractor.py`**: Linguistic analysis module extracting urgency keywords, sensationalism ratios, punctuation density, and manipulation index.
- **`train_classifier.py`**: Model training pipeline fitting TF-IDF vectorizers and logistic classifiers, computing Macro-F1, and serializing weights.
- **`predictor.py`**: High-level production inference engine delivering calibrated verdicts, rationales, and behavioral nudges.
- **`embeddings.py`**: Dense vector representation and semantic cosine similarity engine.
- **`evaluate_benchmarks.py`**: Benchmark test suite measuring Precision, Recall, Macro-F1, and Expected Calibration Error (ECE).
- **`saved_models/`**: Serialized model artifacts (`classifier.pkl`, `vectorizer.pkl`, `metadata.json`).
- **`train_models.bat`**: Windows batch runner for one-click training, evaluation, and interactive testing.

---

## 🚀 How to Train & Evaluate

### 1. Train Classifier & Serialize Model Weights
```bash
python train_classifier.py
```

### 2. Run Quantitative Benchmark & Calibration Suite (ECE)
```bash
python evaluate_benchmarks.py
```

### 3. Test Inference on Arbitrary Statements
```bash
python -c "from predictor import TruthShieldMLPredictor; p = TruthShieldMLPredictor(); print(p.predict('Drinking boiled garlic water cures lung virus in 2 hours! Forward immediately!'))"
```

### 4. Or use the 1-Click Batch Runner
Double-click `train_models.bat` or run:
```cmd
train_models.bat
```
