import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUser } from '../services/authService';
import {
  fetchSavingsEntries,
  addSavingsEntry,
  updateSavingsEntry,
  deleteSavingsEntry,
  calculateTotals,
  groupByWeek
} from '../services/frugalService';
import { SavingsEntry, WeeklySavings } from '../types/frugal';
import SavingsEntryModal from '../components/SavingsEntryModal';
import WeeklyEntries from '../components/WeeklyEntries';

export default function FrugalScreen() {
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [weeklySavings, setWeeklySavings] = useState<WeeklySavings[]>([]);
  const [totals, setTotals] = useState({ totalSaved: 0, totalPending: 0, totalMissed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
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

  const handleSave = async (data: {
    itemName: string;
    amount: number;
    category: string;
    description: string;
    status: 'saved' | 'pending' | 'missed';
    destination: string;
  }) => {
    const user = getCurrentUser();
    if (!user) return;

    setLoading(true);
    try {
      const savingsData: any = {
        amount: data.amount,
        description: data.itemName,
        category: data.category,
        status: data.status
      };

      if (data.status === 'saved' || data.status === 'missed') {
        savingsData.destination = data.destination;
      }

      if (editingEntry) {
        await updateSavingsEntry(editingEntry.id!, savingsData);
      } else {
        await addSavingsEntry(user.uid, data.amount, data.itemName, data.category, data.status);
      }

      setModalVisible(false);
      setEditingEntry(null);
      await loadData();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!editingEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this savings entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteSavingsEntry(editingEntry.id!);
              setModalVisible(false);
              setEditingEntry(null);
              await loadData();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
          weeklySavings.map((week, index) => (
            <WeeklyEntries
              key={index}
              weekStartDate={week.weekStartDate}
              entries={week.entries}
              totalSaved={week.totalSaved}
              totalPending={week.totalPending}
              totalMissed={week.totalMissed}
              onEntryPress={handleEdit}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <SavingsEntryModal
        visible={modalVisible}
        onDismiss={() => {
          setModalVisible(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
        onDelete={editingEntry ? handleDelete : undefined}
        editingEntry={editingEntry}
        loading={loading}
      />
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
