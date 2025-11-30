import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Portal, Modal, Text, TextInput, SegmentedButtons, Button, Menu } from 'react-native-paper';
import { SavingsEntry } from '../types/frugal';

interface SavingsEntryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: {
    itemName: string;
    amount: number;
    category: string;
    description: string;
    status: 'saved' | 'pending' | 'missed';
    destination: string;
  }) => Promise<void>;
  onDelete?: () => void;
  editingEntry?: SavingsEntry | null;
  loading: boolean;
}

const commonItems = [
  'Starbucks Coffee',
  'Fast Food Meal',
  'Restaurant Dinner',
  'Movie Ticket',
  'Snacks',
  'Impulse Purchase',
  'Online Shopping',
  'Uber/Lyft Ride',
  'Subscription Service',
  'Vending Machine',
];

const categories = [
  'Food & Drink',
  'Coffee & Snacks',
  'Fast Food',
  'Restaurants',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Subscriptions',
  'Impulse Buys',
  'Other'
];

const destinations = [
  'Savings Account',
  'Individual Retirement Account (IRA)',
  'Emergency Fund',
  'Certificate of Deposit (CD)',
  'Credit Card Payment',
  'Personal Goal',
  'Shared Goal',
];

const missedReasons = [
  'Spent on similar purchase',
  'Spent on different purchase',
  'Forgot to transfer',
];

export default function SavingsEntryModal({
  visible,
  onDismiss,
  onSave,
  onDelete,
  editingEntry,
  loading
}: SavingsEntryModalProps) {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Drink');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'saved' | 'pending' | 'missed'>('pending');
  const [destination, setDestination] = useState('');
  
  const [itemMenuVisible, setItemMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [destinationMenuVisible, setDestinationMenuVisible] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setItemName(editingEntry.description);
      setAmount(editingEntry.amount.toString());
      setCategory(editingEntry.category);
      setDescription('');
      setStatus(editingEntry.status);
      setDestination('');
    } else {
      setItemName('');
      setAmount('');
      setCategory('Food & Drink');
      setDescription('');
      setStatus('pending');
      setDestination('');
    }
  }, [editingEntry, visible]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter what you didn\'t buy');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if ((status === 'saved' || status === 'missed') && !destination) {
      Alert.alert('Error', status === 'saved' ? 'Please select where you saved it' : 'Please select why it was missed');
      return;
    }

    await onSave({
      itemName: itemName.trim(),
      amount: amountNum,
      category,
      description: description.trim(),
      status,
      destination
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {editingEntry ? 'Edit Entry' : 'What Did You NOT Buy?'}
          </Text>

          {/* Item Name with Autocomplete Menu */}
          <Menu
            visible={itemMenuVisible}
            onDismiss={() => setItemMenuVisible(false)}
            anchor={
              <TextInput
                label="What Did You NOT Buy?"
                value={itemName}
                onChangeText={setItemName}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Starbucks Coffee"
                right={<TextInput.Icon icon="menu-down" onPress={() => setItemMenuVisible(true)} />}
                left={<TextInput.Icon icon="coffee" />}
              />
            }
          >
            {commonItems.map((item) => (
              <Menu.Item
                key={item}
                onPress={() => {
                  setItemName(item);
                  setItemMenuVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>

          <TextInput
            label="Amount NOT Spent"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
            placeholder="0.00"
          />

          {/* Category with Menu */}
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TextInput
                label="Category"
                value={category}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="menu-down" onPress={() => setCategoryMenuVisible(true)} />}
                left={<TextInput.Icon icon="shape" />}
              />
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setCategoryMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

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

          {/* Conditional Destination/Reason Field */}
          {status === 'saved' && (
            <Menu
              visible={destinationMenuVisible}
              onDismiss={() => setDestinationMenuVisible(false)}
              anchor={
                <TextInput
                  label="Savings Category"
                  value={destination}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="menu-down" onPress={() => setDestinationMenuVisible(true)} />}
                  left={<TextInput.Icon icon="bank" />}
                />
              }
            >
              {destinations.map((dest) => (
                <Menu.Item
                  key={dest}
                  onPress={() => {
                    setDestination(dest);
                    setDestinationMenuVisible(false);
                  }}
                  title={dest}
                />
              ))}
            </Menu>
          )}

          {status === 'missed' && (
            <Menu
              visible={destinationMenuVisible}
              onDismiss={() => setDestinationMenuVisible(false)}
              anchor={
                <TextInput
                  label="Why Wasn't It Saved?"
                  value={destination}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="menu-down" onPress={() => setDestinationMenuVisible(true)} />}
                  left={<TextInput.Icon icon="alert-circle" />}
                />
              }
            >
              {missedReasons.map((reason) => (
                <Menu.Item
                  key={reason}
                  onPress={() => {
                    setDestination(reason);
                    setDestinationMenuVisible(false);
                  }}
                  title={reason}
                />
              ))}
            </Menu>
          )}

          <TextInput
            label="Notes (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={2}
            placeholder="Why did you skip this purchase?"
          />

          <View style={styles.modalButtons}>
            {editingEntry && onDelete && (
              <Button
                mode="outlined"
                onPress={onDelete}
                disabled={loading}
                textColor="#F44336"
                style={styles.deleteButton}
                icon="delete"
              >
                Delete
              </Button>
            )}
            <View style={styles.modalActionButtons}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.modalButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading || !itemName || !amount}
                style={styles.modalButton}
              >
                {editingEntry ? 'Update' : 'Save'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 40,
    borderRadius: 16,
    maxHeight: '100%',
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
  modalButtons: {
    marginTop: 16,
  },
  deleteButton: {
    marginBottom: 12,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
