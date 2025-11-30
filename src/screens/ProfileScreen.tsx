import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { getCurrentUser, signOut } from '../services/authService';
import { fetchProfile, updateProfile } from '../services/profileService';
import { UserProfile } from '../types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState('');

  const loadProfile = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const fetchedProfile = await fetchProfile(user.uid);
      setProfile(fetchedProfile);
      
      if (fetchedProfile) {
        setDisplayName(fetchedProfile.displayName);
        setAge(fetchedProfile.age?.toString() || '');
        setBio(fetchedProfile.bio || '');
        setSavingsGoal(fetchedProfile.savingsGoalReason || '');
        setMonthlySavingsTarget(fetchedProfile.monthlySavingsTarget?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const updates: Partial<UserProfile> = {
        displayName,
        age: age ? parseInt(age) : undefined,
        bio: bio || undefined,
        savingsGoalReason: savingsGoal || undefined,
        monthlySavingsTarget: monthlySavingsTarget ? parseFloat(monthlySavingsTarget) : undefined,
      };

      await updateProfile(profile.id!, updates);
      await loadProfile();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text variant="headlineMedium" style={styles.header}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
      <Text variant="headlineMedium" style={styles.header}>
        Profile 👤
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Text variant="headlineSmall" style={styles.name}>
              {profile.displayName}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setEditMode(true)}
              style={styles.editButton}
            >
              Edit
            </Button>
          </View>

          {profile.age && (
            <Text variant="bodyMedium" style={styles.infoItem}>
              Age: {profile.age}
            </Text>
          )}

          {profile.bio && (
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Bio</Text>
              <Text variant="bodyMedium">{profile.bio}</Text>
            </View>
          )}

          {profile.savingsGoalReason && (
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Saving For</Text>
              <Text variant="bodyMedium">{profile.savingsGoalReason}</Text>
            </View>
          )}

          {profile.monthlySavingsTarget && (
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Monthly Target</Text>
              <Text variant="bodyMedium">${profile.monthlySavingsTarget.toFixed(0)}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSignOut}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>

      <Portal>
        <Modal
          visible={editMode}
          onDismiss={() => setEditMode(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Edit Profile
            </Text>

            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Age"
              value={age}
              onChangeText={setAge}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
            />

            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="What are you saving for?"
              value={savingsGoal}
              onChangeText={setSavingsGoal}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Monthly Savings Target"
              value={monthlySavingsTarget}
              onChangeText={setMonthlySavingsTarget}
              mode="outlined"
              style={styles.input}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="$" />}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setEditMode(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={loading}
                disabled={loading}
                style={styles.modalButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
      </ScrollView>
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
  card: {
    margin: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    marginLeft: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  signOutButton: {
    margin: 20,
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
