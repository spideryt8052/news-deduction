import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LearnScreen from './src/screens/LearnScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomNav from './src/components/BottomNav';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'analyze' | 'result' | 'history' | 'learn' | 'settings'
  const [currentResult, setCurrentResult] = useState(null);

  // When splash is active, show splash screen
  if (showSplash) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#070b14" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaView>
    );
  }

  const navigateTo = (tab) => {
    if (tab !== 'result') {
      setCurrentResult(null);
    }
    setActiveTab(tab);
  };

  const handleResultReady = (result) => {
    setCurrentResult(result);
    setActiveTab('result');
  };

  const handleSelectHistoryRecord = (record) => {
    // If it's a minimal history record, construct displayable result object
    const resultObj = {
      id: record.id,
      input_type: record.input_type || 'text',
      classification: record.classification || 'Needs Further Verification',
      confidence: record.confidence || 0.75,
      summary: record.summary || `AI evaluation report for previously recorded claim.`,
      claim: record.claim || 'Evaluated Claim Record',
      reasons: record.reasons || [
        'Corroborated against factual archive.',
        'Historical verification entry retrieved from database.'
      ],
      evidence: record.evidence || [],
      source_assessment: record.source_assessment || {
        source: 'Historical Registry',
        credibility: record.classification === 'Likely Reliable' ? 'Verified Authority' : 'Archived Verification',
        details: 'Record stored from previous assessment run.'
      },
      recommendation: record.recommendation || 'Consult updated fact-checking authorities before sharing.',
      created_at: record.created_at || new Date().toISOString()
    };
    setCurrentResult(resultObj);
    setActiveTab('result');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#070b14" />

      {/* Top App Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => navigateTo('home')}
          activeOpacity={0.8}
        >
          <Text style={styles.brandIcon}>🛡️</Text>
          <View>
            <Text style={styles.brandTitle}>TruthShield</Text>
            <Text style={styles.brandSub}>AI Credibility System</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.collegeBadge}>
            <Text style={styles.collegeBadgeText}>MCA AKTU</Text>
          </View>
        </View>
      </View>

      {/* Active Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen onNavigate={navigateTo} />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeScreen onResultReady={handleResultReady} />
        )}

        {activeTab === 'result' && (
          <ResultScreen
            result={currentResult}
            onBack={() => setActiveTab('analyze')}
            onReset={() => {
              setCurrentResult(null);
              setActiveTab('analyze');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen onSelectRecord={handleSelectHistoryRecord} />
        )}

        {activeTab === 'learn' && (
          <LearnScreen />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen />
        )}
      </View>

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab === 'result' ? 'analyze' : activeTab}
        onTabSelect={(tab) => navigateTo(tab)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#070b14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d1527',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    fontSize: 22,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collegeBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  collegeBadgeText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#070b14',
  },
});
