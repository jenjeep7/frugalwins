import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, Portal, Modal, TextInput, FAB } from 'react-native-paper';
import { getCurrentUser } from '../services/authService';
import {
  fetchChallenges,
  createChallenge,
  getActiveChallenge,
  getCompletedChallenges,
  logChallengeUse,
  calculateProgress
} from '../services/challengeService';
import { Challenge } from '../types';

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [showLogUse, setShowLogUse] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [usedFor, setUsedFor] = useState('');
  const [usedAmount, setUsedAmount] = useState('');

  const loadData = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const fetchedChallenges = await fetchChallenges(user.uid);
      setChallenges(fetchedChallenges);
      setActiveChallenge(getActiveChallenge(fetchedChallenges));
      setCompletedChallenges(getCompletedChallenges(fetchedChallenges));
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateChallenge = async (amount: number) => {
    const user = getCurrentUser();
    if (!user) return;

    if (activeChallenge) {
      alert('You already have an active challenge! Complete it before starting a new one.');
      return;
    }

    setLoading(true);
    try {
      await createChallenge(user.uid, amount);
      setShowNewChallenge(false);
      await loadData();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleLogUse = async () => {
    if (!selectedChallenge || !usedFor || !usedAmount) return;

    const amountNum = parseFloat(usedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await logChallengeUse(selectedChallenge.id!, usedFor, amountNum);
      setUsedFor('');
      setUsedAmount('');
      setShowLogUse(false);
      await loadData();
    } catch (error) {
      console.error('Error logging use:', error);
      alert('Failed to log usage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text variant="headlineMedium" style={styles.header}>
          Challenges 🎯
        </Text>

        {/* Active Challenge */}
        {activeChallenge ? (
          <Card style={styles.activeCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.activeTitle}>
                ${activeChallenge.amount} Challenge
              </Text>
              <View style={styles.progressContainer}>
                <Text variant="titleMedium" style={styles.progressText}>
                  ${activeChallenge.currentSavings.toFixed(2)} / ${activeChallenge.amount.toFixed(2)}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${calculateProgress(activeChallenge.currentSavings, activeChallenge.amount)}%` }
                    ]} 
                  />
                </View>
                <Text variant="bodyLarge" style={styles.progressPercentage}>
                  {calculateProgress(activeChallenge.currentSavings, activeChallenge.amount).toFixed(0)}% Complete
                </Text>
                {activeChallenge.currentSavings < activeChallenge.amount && (
                  <Text variant="bodyMedium" style={styles.remaining}>
                    ${(activeChallenge.amount - activeChallenge.currentSavings).toFixed(2)} to go!
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.noActiveCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.noActiveTitle}>
                Ready to save? 💪
              </Text>
              <Text variant="bodyMedium" style={styles.noActiveText}>
                Pick a challenge and start building your savings!
              </Text>
              <View style={styles.challengeButtons}>
                <Button
                  mode="contained"
                  onPress={() => handleCreateChallenge(50)}
                  style={styles.challengeButton}
                  disabled={loading}
                  loading={loading}
                >
                  $50 Challenge
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleCreateChallenge(100)}
                  style={styles.challengeButton}
                  disabled={loading}
                  loading={loading}
                >
                  $100 Challenge
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Completed Challenges 🎉
            </Text>
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} style={styles.completedCard}>
                <Card.Content>
                  <View style={styles.completedHeader}>
                    <Text variant="titleMedium" style={styles.completedTitle}>
                      ${challenge.amount} Challenge
                    </Text>
                    <Text variant="bodyLarge">🎉</Text>
                  </View>
                  {challenge.completedDate && (
                    <Text variant="bodySmall" style={styles.completedDate}>
                      Completed {challenge.completedDate.toLocaleDateString()}
                    </Text>
                  )}
                  {challenge.usedFor ? (
                    <View style={styles.usageInfo}>
                      <Text variant="bodyMedium" style={styles.usageLabel}>
                        Used for: <Text style={styles.usageValue}>{challenge.usedFor}</Text>
                      </Text>
                      {challenge.usedAmount && (
                        <Text variant="bodyMedium" style={styles.usageLabel}>
                          Amount: <Text style={styles.usageValue}>${challenge.usedAmount.toFixed(2)}</Text>
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setSelectedChallenge(challenge);
                        setShowLogUse(true);
                      }}
                      style={styles.logButton}
                    >
                      Log How You Used It
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showLogUse}
          onDismiss={() => setShowLogUse(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            How Did You Use Your Savings?
          </Text>

          <TextInput
            label="What did you use it for?"
            value={usedFor}
            onChangeText={setUsedFor}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Amount Used"
            value={usedAmount}
            onChangeText={setUsedAmount}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowLogUse(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleLogUse}
              loading={loading}
              disabled={loading || !usedFor || !usedAmount}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    fontWeight: 'bold',
  },
  activeCard: {
    margin: 10,
    backgroundColor: '#E8F5E9',
  },
  activeTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#C8E6C9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressPercentage: {
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  remaining: {
    color: '#558B2F',
    fontWeight: '600',
  },
  noActiveCard: {
    margin: 10,
  },
  noActiveTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  noActiveText: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  challengeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  challengeButton: {
    flex: 1,
  },
  sectionTitle: {
    padding: 20,
    paddingBottom: 10,
    fontWeight: 'bold',
  },
  completedCard: {
    margin: 10,
    marginTop: 5,
    backgroundColor: '#FFF9C4',
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedTitle: {
    fontWeight: 'bold',
  },
  completedDate: {
    opacity: 0.7,
    marginBottom: 12,
  },
  usageInfo: {
    marginTop: 8,
  },
  usageLabel: {
    marginBottom: 4,
  },
  usageValue: {
    fontWeight: 'bold',
  },
  logButton: {
    marginTop: 12,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
