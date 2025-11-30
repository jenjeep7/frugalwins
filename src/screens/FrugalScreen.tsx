import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, FAB, Portal, Modal, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUser } from '../services/authService';
import {
  fetchSavingsEntries,
  addSavingsEntry,
  updateSavingsEntry,
  calculateTotals,
  groupByWeek
} from '../services/frugalService';
import { SavingsEntry, WeeklySavings } from '../types/frugal';
import { CATEGORIES } from '../types';

export default function FrugalScreen() {
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [weeklySavings, setWeeklySavings] = useState<WeeklySavings[]>([]);
  const [totals, setTotals] = useState({ totalSaved: 0, totalPending: 0, totalMissed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Coffee/Drinks');
  const [status, setStatus] = useState<'saved' | 'pending' | 'missed'>('pending');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const fetchedEntries = await fetchSavingsEntries(user.uid);
      setEntries(fetchedEntries);
      setTotals(calculateTotals(fetchedEntries));
      setWeeklySavings(groupByWeek(fetchedEntries));
    } catch (error) {
      console.error('Error loading savings:', error);
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

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user || !description || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (editingEntry) {
        await updateSavingsEntry(editingEntry.id!, {
          amount: amountNum,
          description,
          category,
          status
        });
      } else {
        await addSavingsEntry(user.uid, amountNum, description, category, status);
      }

      setDescription('');
      setAmount('');
      setCategory('Coffee/Drinks');
      setStatus('pending');
      setModalVisible(false);
      setEditingEntry(null);
      await loadData();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setDescription(entry.description);
    setAmount(entry.amount.toString());
    setCategory(entry.category);
    setStatus(entry.status);
    setModalVisible(true);
  };

  const handleUpdateStatus = async (entry: SavingsEntry, newStatus: 'saved' | 'missed') => {
    try {
      await updateSavingsEntry(entry.id!, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header Quote */}
        <Text variant="bodyMedium" style={styles.quote}>
          "Turn Every Skipped Purchase into Progress—Your First Step Toward Financial Freedom."
        </Text>

        {/* Goal Contribution Button */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
          labelStyle={styles.addButtonLabel}
        >
          Goal Contribution
        </Button>

        {/* Saved Card - Full Width */}
        <Card style={[styles.card, styles.savedCard]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trending-up" size={32} color="#4CAF50" />
              <Text variant="headlineSmall" style={styles.savedTitle}>Saved</Text>
            </View>
            <Text variant="displaySmall" style={styles.savedAmount}>
              ${totals.totalSaved.toFixed(2)}
            </Text>
            <Text variant="bodyMedium" style={styles.savedSubtext}>Nice job!</Text>
          </Card.Content>
        </Card>

        {/* Pending and Missed Cards Side by Side */}
        <View style={styles.gridRow}>
          {/* Pending Card */}
          <Card style={[styles.card, styles.halfCard, styles.pendingCard]}>
            <Card.Content style={styles.halfCardContent}>
              <View style={styles.halfCardHeader}>
                <MaterialCommunityIcons name="target" size={20} color="#FF9800" />
                <Text variant="labelSmall" style={styles.pendingLabel}>PENDING</Text>
              </View>
              <Text variant="headlineMedium" style={styles.pendingAmount}>
                ${totals.totalPending.toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.pendingSubtext}>
                The clock is ticking….
              </Text>
            </Card.Content>
          </Card>

          {/* Missed Card */}
          <Card style={[styles.card, styles.halfCard, styles.missedCard]}>
            <Card.Content style={styles.halfCardContent}>
              <View style={styles.halfCardHeader}>
                <MaterialCommunityIcons name="trending-down" size={20} color="#F44336" />
                <Text variant="labelSmall" style={styles.missedLabel}>MISSED</Text>
              </View>
              <Text variant="headlineMedium" style={styles.missedAmount}>
                ${totals.totalMissed.toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.missedSubtext}>
                I don't like money.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Weekly Breakdown */}
        {weeklySavings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.emptyTitle}>No savings logged yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Start tracking the money you save by skipping unnecessary purchases!
              </Text>
              <Button mode="outlined" onPress={() => setModalVisible(true)} style={styles.emptyButton}>
                Log Your First Savings
              </Button>
            </Card.Content>
          </Card>
        ) : (
          weeklySavings.map((week, index) => {
            const weekEnd = new Date(week.weekStartDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            return (
              <View key={index} style={styles.weekSection}>
                <View style={styles.weekHeader}>
                  <Text variant="titleMedium" style={styles.weekTitle}>
                    {week.weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <View style={styles.weekChips}>
                    {week.totalPending > 0 && (
                      <Chip textStyle={styles.chipText} style={styles.pendingChip}>
                        ${week.totalPending.toFixed(2)}
                      </Chip>
                    )}
                    {week.totalSaved > 0 && (
                      <Chip textStyle={styles.chipText} style={styles.savedChip}>
                        ${week.totalSaved.toFixed(2)}
                      </Chip>
                    )}
                    {week.totalMissed > 0 && (
                      <Chip textStyle={styles.chipText} style={styles.missedChip}>
                        ${week.totalMissed.toFixed(2)}
                      </Chip>
                    )}
                  </View>
                </View>

                {week.entries.map(entry => (
                  <TouchableOpacity key={entry.id} onPress={() => handleEdit(entry)}>
                    <Card style={[
                      styles.entryCard,
                      entry.status === 'saved' && styles.entrySaved,
                      entry.status === 'pending' && styles.entryPending,
                      entry.status === 'missed' && styles.entryMissed
                    ]}>
                      <Card.Content>
                        <View style={styles.entryRow}>
                          <View style={styles.entryLeft}>
                            <Text variant="titleMedium">{entry.description}</Text>
                            <Text variant="bodySmall" style={styles.entryCategory}>{entry.category}</Text>
                          </View>
                          <View style={styles.entryRight}>
                            <Text variant="titleLarge" style={[
                              styles.entryAmount,
                              entry.status === 'saved' && styles.savedText,
                              entry.status === 'pending' && styles.pendingText,
                              entry.status === 'missed' && styles.missedText
                            ]}>
                              ${entry.amount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        {entry.status === 'pending' && (
                          <View style={styles.actionButtons}>
                            <Button
                              mode="contained"
                              onPress={() => handleUpdateStatus(entry, 'saved')}
                              style={styles.saveButton}
                              compact
                            >
                              Mark Saved
                            </Button>
                            <Button
                              mode="outlined"
                              onPress={() => handleUpdateStatus(entry, 'missed')}
                              style={styles.missButton}
                              compact
                            >
                              Mark Missed
                            </Button>
                          </View>
                        )}
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setEditingEntry(null);
            setDescription('');
            setAmount('');
            setStatus('pending');
          }}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              {editingEntry ? 'Edit Entry' : 'Log Savings'}
            </Text>

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              style={styles.input}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="$" />}
            />

            <Text variant="titleSmall" style={styles.label}>Status</Text>
            <SegmentedButtons
              value={status}
              onValueChange={(value) => setStatus(value as any)}
              buttons={[
                { value: 'pending', label: 'Pending' },
                { value: 'saved', label: 'Saved' },
                { value: 'missed', label: 'Missed' }
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="titleSmall" style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  style={styles.categoryChip}
                >
                  {cat}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(false);
                  setEditingEntry(null);
                  setDescription('');
                  setAmount('');
                }}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading || !description || !amount}
                style={styles.modalButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
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
  quote: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
    color: '#666',
  },
  addButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  addButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 12,
  },
  savedCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  savedTitle: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savedAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 12,
  },
  savedSubtext: {
    color: '#4CAF50',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
  },
  pendingCard: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  missedCard: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  halfCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  halfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pendingLabel: {
    fontWeight: '600',
    color: '#FF9800',
  },
  pendingAmount: {
    fontWeight: 'bold',
    color: '#FF9800',
    marginVertical: 8,
  },
  pendingSubtext: {
    color: '#FF9800',
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  missedLabel: {
    fontWeight: '600',
    color: '#F44336',
  },
  missedAmount: {
    fontWeight: 'bold',
    color: '#F44336',
    marginVertical: 8,
  },
  missedSubtext: {
    color: '#F44336',
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    margin: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  emptyButton: {
    marginTop: 8,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weekTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  weekChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipText: {
    fontWeight: 'bold',
  },
  pendingChip: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  savedChip: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  missedChip: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  entryCard: {
    marginHorizontal: 10,
    marginBottom: 8,
  },
  entrySaved: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  entryPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  entryMissed: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryLeft: {
    flex: 1,
  },
  entryCategory: {
    opacity: 0.7,
    marginTop: 4,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontWeight: 'bold',
  },
  savedText: {
    color: '#4CAF50',
  },
  pendingText: {
    color: '#FF9800',
  },
  missedText: {
    color: '#F44336',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  missButton: {
    flex: 1,
    borderColor: '#F44336',
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
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
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
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});
