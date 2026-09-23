import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function ResultScreen({ result, onBack, onReset }) {
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!result) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No analysis result available.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    classification,
    confidence = 0.75,
    summary,
    claim,
    reasons = [],
    evidence = [],
    source_assessment,
    recommendation
  } = result;

  const getTheme = () => {
    switch (classification) {
      case 'Likely Reliable':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Potentially Misleading':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Likely False':
        return { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' };
      default:
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const theme = getTheme();
  const percentage = Math.round(confidence * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.topBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topReportTag}>AI VERIFICATION REPORT</Text>
      </View>

      {/* Main Verdict Card */}
      <View style={[styles.verdictCard, { borderColor: theme.border }]}>
        <Text style={styles.cardHeaderTag}>ASSESSMENT CLASSIFICATION</Text>
        
        <View style={[styles.classificationBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.classificationText, { color: theme.color }]}>
            ● {classification}
          </Text>
        </View>

        {/* Confidence Meter */}
        <View style={styles.confidenceBox}>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>AI Assessment Confidence</Text>
            <Text style={styles.confidenceValue}>{percentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: theme.color }]} />
          </View>
          <Text style={styles.confidenceNotice}>Algorithmic credibility estimate based on corroboration.</Text>
        </View>

        {/* Claim */}
        <View style={styles.claimBox}>
          <Text style={styles.claimLabel}>Primary Claim Analyzed:</Text>
          <Text style={styles.claimText}>"{claim}"</Text>
        </View>

        {/* Reasons */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Why This Result?</Text>
          {reasons.map((r, i) => (
            <Text key={i} style={styles.reasonBullet}>• {r}</Text>
          ))}
        </View>

        {/* Source Assessment */}
        {source_assessment && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Source Assessment</Text>
            <View style={styles.sourceBox}>
              <Text style={styles.sourceName}>{source_assessment.source}</Text>
              <Text style={styles.sourceTier}>Credibility: {source_assessment.credibility}</Text>
              <Text style={styles.sourceDetails}>{source_assessment.details}</Text>
            </View>
          </View>
        )}

        {/* Recommended Action */}
        <View style={styles.recommendationBox}>
          <Text style={styles.recTitle}>⚠️ Recommended Action Before Sharing:</Text>
          <Text style={styles.recText}>{recommendation}</Text>
        </View>

        {/* Feedback Row */}
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackPrompt}>Helpful assessment?</Text>
          <TouchableOpacity 
            style={[styles.feedbackBtn, feedbackSent && { opacity: 0.5 }]}
            onPress={() => setFeedbackSent(true)}
            disabled={feedbackSent}
          >
            <Text style={styles.feedbackBtnText}>👍 Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.feedbackBtn, feedbackSent && { opacity: 0.5 }]}
            onPress={() => setFeedbackSent(true)}
            disabled={feedbackSent}
          >
            <Text style={styles.feedbackBtnText}>👎 Needs Review</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action CTA */}
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>Analyze Another Claim</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b14' },
  content: { padding: 18, paddingBottom: 40 },
  emptyContainer: { flex: 1, backgroundColor: '#070b14', justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: '#06b6d4', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  topBackText: { color: '#06b6d4', fontSize: 13, fontWeight: '700' },
  topReportTag: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  verdictCard: {
    backgroundColor: '#0d1527',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeaderTag: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 8 },
  classificationBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  classificationText: { fontSize: 16, fontWeight: '800' },
  confidenceBox: {
    backgroundColor: '#070b14',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  confidenceLabel: { fontSize: 12, fontWeight: '600', color: '#cbd5e1' },
  confidenceValue: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  progressBar: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  confidenceNotice: { fontSize: 10, color: '#64748b', fontStyle: 'italic' },
  claimBox: {
    backgroundColor: '#070b14',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  claimLabel: { fontSize: 11, fontWeight: '700', color: '#06b6d4', marginBottom: 4 },
  claimText: { fontSize: 13, color: '#ffffff', fontStyle: 'italic', lineHeight: 18 },
  sectionBlock: { marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 },
  reasonBullet: { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginBottom: 4 },
  sourceBox: { backgroundColor: '#070b14', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sourceName: { fontSize: 12, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  sourceTier: { fontSize: 11, color: '#06b6d4', fontWeight: '600', marginBottom: 4 },
  sourceDetails: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },
  recommendationBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recTitle: { fontSize: 12, fontWeight: '700', color: '#f59e0b', marginBottom: 4 },
  recText: { fontSize: 12, color: '#fef3c7', lineHeight: 17, fontWeight: '500' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingTop: 12 },
  feedbackPrompt: { fontSize: 11, color: '#64748b' },
  feedbackBtn: { backgroundColor: '#1e293b', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  feedbackBtnText: { color: '#cbd5e1', fontSize: 11 },
  resetBtn: {
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetBtnText: { color: '#06b6d4', fontSize: 14, fontWeight: '700' },
});
