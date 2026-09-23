import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const RULES = [
  { id: 1, title: '1. Check the Source', tip: 'Inspect domain suffixes (.xyz, .cc) and verify if the publisher has editorial accountability.' },
  { id: 2, title: '2. Check the Date', tip: 'Old natural disaster videos or strikes are frequently recycled during current events to incite panic.' },
  { id: 3, title: '3. Read Beyond Headline', tip: 'Clickbait headlines often state the opposite of what the underlying body article explains.' },
  { id: 4, title: '4. Demand Evidence', tip: 'Extraordinary assertions require clinical studies or official citations, not anonymous quotes.' },
  { id: 5, title: '5. Compare Multiple Outlets', tip: 'Genuine monumental events will be confirmed by international and national news services.' },
  { id: 6, title: '6. Beware of Edited Visuals', tip: 'Deepfakes and AI image generators create hyper-realistic events. Inspect hands, shadows, and text.' },
  { id: 7, title: '7. Watch for Emotional Urgency', tip: 'Phrases like "forward immediately before deleted" are deceptive markers to trigger panic.' },
  { id: 8, title: '8. Verify Before Forwarding', tip: 'Take 30 seconds to pause. You protect friends and family by verifying first.' },
];

export default function LearnScreen() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Media Literacy Guide</Text>
      <Text style={styles.pageSubtitle}>8 practical principles to spot deceptive social media claims.</Text>

      {RULES.map((r) => {
        const isExpanded = selectedId === r.id;
        return (
          <TouchableOpacity
            key={r.id}
            style={[styles.card, isExpanded && styles.expandedCard]}
            onPress={() => setSelectedId(isExpanded ? null : r.id)}
            activeOpacity={0.8}
          >
            <View style={styles.row}>
              <Text style={styles.ruleTitle}>{r.title}</Text>
              <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
            </View>
            <Text style={styles.ruleTip}>{r.tip}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b14' },
  content: { padding: 18, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  card: {
    backgroundColor: '#0d1527',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  expandedCard: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#111d38',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ruleTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  expandIcon: { fontSize: 18, color: '#06b6d4', fontWeight: 'bold' },
  ruleTip: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
});
