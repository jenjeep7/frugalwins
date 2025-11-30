import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { SavingsEntry } from '../types/frugal';

interface WeeklyEntriesProps {
  weekStartDate: Date;
  entries: SavingsEntry[];
  totalSaved: number;
  totalPending: number;
  totalMissed: number;
  onEntryPress: (entry: SavingsEntry) => void;
  onUpdateStatus: (entry: SavingsEntry, status: 'saved' | 'missed') => void;
}

export default function WeeklyEntries({
  weekStartDate,
  entries,
  totalSaved,
  totalPending,
  totalMissed,
  onEntryPress,
  onUpdateStatus
}: WeeklyEntriesProps) {
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <View style={styles.weekSection}>
      <View style={styles.weekHeader}>
        <Text variant="titleMedium" style={styles.weekTitle}>
          {weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <View style={styles.weekChips}>
          {totalPending > 0 && (
            <Chip textStyle={styles.chipText} style={styles.pendingChip}>
              ${totalPending.toFixed(2)}
            </Chip>
          )}
          {totalSaved > 0 && (
            <Chip textStyle={styles.chipText} style={styles.savedChip}>
              ${totalSaved.toFixed(2)}
            </Chip>
          )}
          {totalMissed > 0 && (
            <Chip textStyle={styles.chipText} style={styles.missedChip}>
              ${totalMissed.toFixed(2)}
            </Chip>
          )}
        </View>
      </View>

      {entries.map(entry => (
        <Card
          key={entry.id}
          style={[
            styles.entryCard,
            entry.status === 'saved' && styles.entrySaved,
            entry.status === 'pending' && styles.entryPending,
            entry.status === 'missed' && styles.entryMissed
          ]}
          onPress={() => onEntryPress(entry)}
        >
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
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
