import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen({ onNavigate }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MCA RESEARCH PROJECT</Text>
        </View>
        <Text style={styles.heroTitle}>Think Before You Share.</Text>
        <Text style={styles.heroSubtitle}>
          AI-assisted credibility verification and media literacy framework for social media content.
        </Text>
      </View>

      {/* Main CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => onNavigate('analyze')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Analyze Information Now →</Text>
      </TouchableOpacity>

      {/* 4 Categorization Tiers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Categories</Text>
        
        <View style={styles.grid}>
          <View style={[styles.card, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={[styles.cardTag, { color: '#10b981' }]}>● Likely Reliable</Text>
            <Text style={styles.cardDesc}>Corroborated by verified institutions & official records.</Text>
          </View>

          <View style={[styles.card, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
            <Text style={[styles.cardTag, { color: '#f59e0b' }]}>● Potentially Misleading</Text>
            <Text style={styles.cardDesc}>Contains facts placed in altered or exaggerated context.</Text>
          </View>

          <View style={[styles.card, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
            <Text style={[styles.cardTag, { color: '#f43f5e' }]}>● Likely False</Text>
            <Text style={styles.cardDesc}>Directly contradicted by fact-checkers & empirical data.</Text>
          </View>

          <View style={[styles.card, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
            <Text style={[styles.cardTag, { color: '#3b82f6' }]}>● Needs Verification</Text>
            <Text style={styles.cardDesc}>Insufficient public evidence; cross-checking required.</Text>
          </View>
        </View>
      </View>

      {/* 30-Second Nudge Card */}
      <View style={styles.nudgeCard}>
        <Text style={styles.nudgeTitle}>💡 The 30-Second Rule</Text>
        <Text style={styles.nudgeText}>
          Before forwarding breaking alerts to WhatsApp groups, take 30 seconds to inspect the author, check the date, and verify with an accredited news source.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onNavigate('learn')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Read 8 Literacy Rules</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  grid: {
    gap: 10,
  },
  card: {
    backgroundColor: '#0d1527',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTag: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  nudgeCard: {
    backgroundColor: '#111c35',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nudgeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  nudgeText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  secondaryButtonText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '600',
  },
});
