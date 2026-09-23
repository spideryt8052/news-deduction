import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import mobileApi, { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export default function SettingsScreen() {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = () => {
    setApiBaseUrl(url);
    Alert.alert('Saved', `API Base URL updated to: ${url}`);
  };

  const handleTest = async () => {
    setTesting(true);
    setStatusMsg('Testing connection...');
    try {
      setApiBaseUrl(url);
      const res = await mobileApi.checkHealth();
      setStatusMsg(`Connected! Status: ${res.status} (${res.service})`);
    } catch (e) {
      setStatusMsg('Connection failed. Verify server is running on port 8000 and accessible.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Settings & About</Text>
      <Text style={styles.pageSubtitle}>Configure backend server and inspect project credentials.</Text>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FastAPI Server URL</Text>
        <Text style={styles.cardDesc}>
          • Android Emulator: http://10.0.2.2:8000{'\n'}
          • iOS Simulator / Web: http://localhost:8000{'\n'}
          • Physical Device via Wi-Fi: http://192.168.x.x:8000
        </Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          placeholder="http://10.0.2.2:8000"
          placeholderTextColor="#64748b"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save URL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testBtn} onPress={handleTest} disabled={testing}>
            <Text style={styles.testBtnText}>{testing ? 'Testing...' : 'Test Connection'}</Text>
          </TouchableOpacity>
        </View>

        {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}
      </View>

      {/* Project Team Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>MCA College Project (2025–2027)</Text>
        <Text style={styles.teamHeader}>Team Members & Roles:</Text>
        <Text style={styles.memberText}>• Yaseen Jamshed (2501320140158) - Backend & Core</Text>
        <Text style={styles.memberText}>• Vandana (2501320140151) - Frontend UI/UX</Text>
        <Text style={styles.memberText}>• Aarti Vishwakarma (2501320140001) - AI & ML</Text>
        <Text style={styles.memberText}>• Soni (2501320140140) - Database Systems</Text>
        
        <View style={styles.guideBlock}>
          <Text style={styles.guideTitle}>Under the Guidance of:</Text>
          <Text style={styles.guideName}>Dr. Saumya Chaturvedi</Text>
          <Text style={styles.guideAffil}>Department of Computer Application, GNIOT / AKTU</Text>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.discTitle}>⚠️ AI Assessment Disclaimer</Text>
        <Text style={styles.discText}>
          TruthShield provides AI-assisted evaluations, not absolute truth. Machine evaluations do not replace verified journalistic investigation. Consult official channels before acting on sensitive claims.
        </Text>
      </View>
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  cardDesc: { fontSize: 11, color: '#64748b', lineHeight: 16, marginBottom: 10 },
  input: {
    backgroundColor: '#070b14',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { backgroundColor: '#06b6d4', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  testBtn: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  testBtnText: { color: '#cbd5e1', fontWeight: '600', fontSize: 12 },
  statusText: { fontSize: 11, color: '#06b6d4', marginTop: 10 },
  teamHeader: { fontSize: 12, fontWeight: 'bold', color: '#06b6d4', marginTop: 8, marginBottom: 6 },
  memberText: { fontSize: 12, color: '#cbd5e1', marginBottom: 4 },
  guideBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  guideTitle: { fontSize: 11, color: '#64748b' },
  guideName: { fontSize: 13, fontWeight: 'bold', color: '#06b6d4', marginTop: 2 },
  guideAffil: { fontSize: 11, color: '#94a3b8' },
  disclaimerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  discTitle: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b', marginBottom: 4 },
  discText: { fontSize: 11, color: '#fef3c7', lineHeight: 16 },
});
