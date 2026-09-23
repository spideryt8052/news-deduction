import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import mobileApi from '../services/api';

export default function HistoryScreen({ onSelectRecord }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await mobileApi.getHistory(20);
      if (Array.isArray(data) && data.length > 0) {
        setHistory(data);
      } else {
        setHistory(SAMPLE_MOBILE_HISTORY);
      }
    } catch (e) {
      setHistory(SAMPLE_MOBILE_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const SAMPLE_MOBILE_HISTORY = [
    { id: '1', claim: 'Garlic water remedy cures viral respiratory infections', classification: 'Likely False', confidence: 0.92, input_type: 'text' },
    { id: '2', claim: 'WHO releases updated daily sodium intake guideline for adults', classification: 'Likely Reliable', confidence: 0.93, input_type: 'url' },
    { id: '3', claim: 'Golden asteroid impact will make citizens billionaires next week', classification: 'Potentially Misleading', confidence: 0.83, input_type: 'text' },
    { id: '4', claim: 'Local municipal power shutdown schedule alert', classification: 'Needs Further Verification', confidence: 0.68, input_type: 'image' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Evaluation History</Text>
      <Text style={styles.pageSubtitle}>Review previously verified social media claims.</Text>

      {loading ? (
        <ActivityIndicator size="small" color="#06b6d4" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectRecord(item)}
              activeOpacity={0.7}
            >
              <View style={styles.row}>
                <Text style={styles.modalityTag}>{item.input_type?.toUpperCase() || 'TEXT'}</Text>
                <Text style={[styles.classTag, {
                  color: item.classification === 'Likely Reliable' ? '#10b981' :
                         item.classification === 'Likely False' ? '#f43f5e' :
                         item.classification === 'Potentially Misleading' ? '#f59e0b' : '#3b82f6'
                }]}>
                  {item.classification}
                </Text>
              </View>
              <Text style={styles.claim} numberOfLines={2}>"{item.claim}"</Text>
              <Text style={styles.confidence}>AI Confidence: {Math.round((item.confidence || 0.75) * 100)}%</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b14', padding: 18 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  card: {
    backgroundColor: '#0d1527',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  modalityTag: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  classTag: { fontSize: 12, fontWeight: '700' },
  claim: { fontSize: 13, color: '#ffffff', fontWeight: '500', lineHeight: 18, marginBottom: 6 },
  confidence: { fontSize: 11, color: '#94a3b8' },
});
