# Research Methodology

## Academic Foundations
This system is grounded in the methodology defined in the MCA Project Synopsis (Greater Noida Institute of Technology / AKTU):

### 6-Stage Detection & Awareness Workflow (Synopsis Fig. 1)

1. **User Input & Data Collection:** Ingests user-submitted texts, social media links, or screenshots from platforms such as WhatsApp, Instagram, X (Twitter), and Facebook.
2. **Data Preprocessing:** Cleans and normalizes textual noise, removes junk markers, strips tracking tokens from URLs, and extracts text from images via OCR.
3. **Content Analysis:** Assesses emotional triggers, urgency markers ("forward immediately"), sensationalism, clickbait phrasing, and synthetically generated text signatures.
4. **Fact Verification & Credibility Analysis:** Cross-references extracted factual claims against verified references, official sources, and fact-checking databases.
5. **Misleading Information Detection & Classification:** Formulates an AI-assisted verdict into one of four calibrated categories:
   - `Likely Reliable`
   - `Potentially Misleading`
   - `Likely False`
   - `Needs Further Verification`
6. **Informed Decision-Making:** Delivers an explanation-first report detailing:
   - Rationale breakdown
   - Source credibility rating
   - Supporting & refuting evidence
   - Actionable behavioral nudges ("Think Before You Share")
