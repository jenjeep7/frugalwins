import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, FAB, Portal, Modal, TextInput, Chip, SegmentedButtons } from 'react-native-paper';
import { getCurrentUser } from '../services/authService';
import { fetchNonSpends, addNonSpend, calculateStatistics } from '../services/nonSpendService';
import { fetchChallenges, getActiveChallenge, updateChallengeProgress } from '../services/challengeService';
import { NonSpend, Challenge, CATEGORIES, CATEGORY_EMOJIS } from '../types';

export default function HomeScreen() {
  const [nonSpends, setNonSpends] = useState<NonSpend[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState({ totalSaved: 0, thisMonthSaved: 0, thisWeekCount: 0, currentStreak: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Coffee/Drinks');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const [fetchedNonSpends, fetchedChallenges] = await Promise.all([
        fetchNonSpends(user.uid),
        fetchChallenges(user.uid)
      ]);

      setNonSpends(fetchedNonSpends);
      setStats(calculateStatistics(fetchedNonSpends));
      setActiveChallenge(getActiveChallenge(fetchedChallenges));
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleSaveNonSpend = async () => {
    const user = getCurrentUser();
    if (!user || !description || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addNonSpend(user.uid, description, amountNum, category);
      
      // Update active challenge if exists
      if (activeChallenge && !activeChallenge.isCompleted) {
        await updateChallengeProgress(
          activeChallenge.id!,
          amountNum,
          activeChallenge.currentSavings,
          activeChallenge.amount
        );
      }

      setDescription('');
      setAmount('');
      setCategory('Coffee/Drinks');
      setModalVisible(false);
      await loadData();
    } catch (error) {
      console.error('Error saving non-spend:', error);
      alert('Failed to save non-spend');
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
          Dashboard 💰
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.statLabel}>Total Saved</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                ${stats.totalSaved.toFixed(0)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.statLabel}>This Month</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                ${stats.thisMonthSaved.toFixed(0)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.statLabel}>This Week</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                {stats.thisWeekCount}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.statLabel}>Streak</Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                {stats.currentStreak} days
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Active Challenge */}
        {activeChallenge && (
          <Card style={styles.challengeCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.challengeTitle}>
                ${activeChallenge.amount} Challenge 🎯
              </Text>
              <Text variant="bodyMedium" style={styles.challengeProgress}>
                ${activeChallenge.currentSavings.toFixed(2)} / ${activeChallenge.amount.toFixed(2)}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(activeChallenge.currentSavings / activeChallenge.amount) * 100}%` }
                  ]} 
                />
              </View>
              <Text variant="bodySmall" style={styles.challengeRemaining}>
                ${(activeChallenge.amount - activeChallenge.currentSavings).toFixed(2)} to go!
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Recent Non-Spends */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Non-Spends
        </Text>

        {nonSpends.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No non-spends yet! 🌱
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Start saving by logging what you didn't spend
              </Text>
            </Card.Content>
          </Card>
        ) : (
          nonSpends.slice(0, 10).map((nonSpend) => (
            <Card key={nonSpend.id} style={styles.nonSpendCard}>
              <Card.Content style={styles.nonSpendContent}>
                <View style={styles.nonSpendLeft}>
                  <Text variant="titleLarge">{CATEGORY_EMOJIS[nonSpend.category]}</Text>
                  <View style={styles.nonSpendInfo}>
                    <Text variant="titleMedium">{nonSpend.description}</Text>
                    <Text variant="bodySmall" style={styles.nonSpendDate}>
                      {nonSpend.dateCreated.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text variant="titleMedium" style={styles.nonSpendAmount}>
                  ${nonSpend.amountSaved.toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        label="Log Non-Spend"
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Log a Non-Spend
          </Text>

          <TextInput
            label="What didn't you spend on?"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Skipped Starbucks today"
          />

          <TextInput
            label="Amount Saved"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />

          <Text variant="titleSmall" style={styles.categoryLabel}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
                style={styles.categoryChip}
              >
                {CATEGORY_EMOJIS[cat]} {cat}
              </Chip>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveNonSpend}
              loading={loading}
              disabled={loading || !description || !amount}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  challengeCard: {
    margin: 10,
    backgroundColor: '#E3F2FD',
  },
  challengeTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  challengeProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#B3E5FC',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  challengeRemaining: {
    color: '#1976D2',
    fontWeight: '600',
  },
  sectionTitle: {
    padding: 20,
    paddingBottom: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    margin: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  nonSpendCard: {
    margin: 10,
    marginTop: 5,
  },
  nonSpendContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nonSpendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nonSpendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nonSpendDate: {
    opacity: 0.6,
    marginTop: 4,
  },
  nonSpendAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  categoryLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryChip: {
    marginRight: 8,
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
