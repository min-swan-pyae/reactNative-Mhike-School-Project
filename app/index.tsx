import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { HikeCard } from '../components/HikeCard';
import { ImportJsonDialog } from '../components/ImportJsonDialog';
import { AdvancedFilterDialog } from '../components/AdvancedFilterDialog';
import { OptionsMenuDialog } from '../components/OptionsMenuDialog';
import { Hike } from '../types';
import { deleteHike, deleteAllHikes, searchHikes, advancedSearchHikes } from '../lib/database';
import { importHikeFromJson, shareExportedJson, pickJsonFile } from '../lib/storage';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';

export default function HikeListScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const navigation = useNavigation();
  
  // Use data context for live updates
  const { hikes, refreshHikes, refreshing, notifyHikeChanged } = useData();

  const [filteredHikes, setFilteredHikes] = useState<Hike[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showImportOptionsDialog, setShowImportOptionsDialog] = useState(false);
  const [hasActiveFilter, setHasActiveFilter] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResettingDB, setIsResettingDB] = useState(false);
  const [activeFilterCriteria, setActiveFilterCriteria] = useState<any>(null);

  // Set up header right button (kebab menu) and hide back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, // Hide back button on home screen
      headerBackVisible: false, // Also disable back button
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowOptionsDialog(true)}
          style={{ paddingHorizontal: 16 }}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Update filtered hikes when hikes change (live data)
  useEffect(() => {
    // If there's an active advanced filter, re-apply it silently
    if (hasActiveFilter && activeFilterCriteria) {
      handleApplyFilter(activeFilterCriteria, true); // true = silent (no alert)
    } else if (searchQuery.trim() === '') {
      setFilteredHikes(hikes);
    } else {
      handleSearch(searchQuery);
    }
    setLoading(false);
  }, [hikes]);

  // Refresh on screen focus (similar to Kotlin's onResume)
  useFocusEffect(
    useCallback(() => {
      refreshHikes();
    }, [refreshHikes])
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredHikes(hikes);
      if (!hasActiveFilter) {
        setHasActiveFilter(false);
      }
    } else {
      try {
        const results = await searchHikes(query);
        setFilteredHikes(results);
      } catch (error) {
        console.error('Error searching:', error);
        Alert.alert('Error', 'Failed to search hikes');
      }
    }
  };

  // Handle advanced filter
  const handleApplyFilter = async (criteria: any, silent: boolean = false) => {
    try {
      const results = await advancedSearchHikes(
        criteria.name,
        criteria.location,
        criteria.minLength ? parseFloat(criteria.minLength) : undefined,
        criteria.maxLength ? parseFloat(criteria.maxLength) : undefined,
        criteria.date,
        criteria.difficulty,
        criteria.parking
      );
      setFilteredHikes(results);
      setHasActiveFilter(true);
      setActiveFilterCriteria(criteria); // Store criteria for re-applying after refresh
      
      // Only show success alert on first apply, not on refresh
      if (!silent) {
        Alert.alert('Success', `Found ${results.length} hike(s)`);
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Error', 'Failed to apply filter');
    }
  };

  const handleClearFilter = () => {
    setFilteredHikes(hikes);
    setHasActiveFilter(false);
    setActiveFilterCriteria(null); // Clear stored criteria
    setSearchQuery('');
  };

  const handleImportJsonMenu = () => {
    if (isImporting) return;
    setShowImportOptionsDialog(true);
  };

  const handleImportFromFile = async () => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const jsonText = await pickJsonFile();
      if (jsonText) {
        const result = await importHikeFromJson(jsonText);
        Alert.alert(result.success ? 'Success' : 'Error', result.message);
        if (result.success) {
          notifyHikeChanged();
        }
      }
    } catch (error) {
      console.error('Error importing file:', error);
      Alert.alert('Error', 'Failed to import JSON file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromDialog = async (jsonText: string) => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const result = await importHikeFromJson(jsonText);
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
      if (result.success) {
        notifyHikeChanged();
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
      Alert.alert('Error', 'Failed to import JSON');
    } finally {
      setIsImporting(false);
    }
  };

  // Memoized delete handler for performance using useCallback
  const handleDelete = useCallback((hike: Hike) => {
    Alert.alert(
      'Delete hike?',
      `This will delete the hike and all its observations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHike(hike.id!);
              notifyHikeChanged(); // Trigger live update
              Alert.alert('Success', 'Hike deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete hike');
            }
          },
        },
      ]
    );
  }, [notifyHikeChanged]);

  const handleResetDatabase = () => {
    if (isResettingDB) return;
    
    Alert.alert(
      'Reset database?',
      'This will permanently delete all hikes and observations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResettingDB(true);
            try {
              await deleteAllHikes();
              notifyHikeChanged(); // Trigger live update
              Alert.alert('Success', 'Database reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database');
            } finally {
              setIsResettingDB(false);
            }
          },
        },
      ]
    );
  };


  // Refresh control
  const onRefresh = useCallback(() => {
    refreshHikes();
  }, [refreshHikes]);

  // Memoized render function for FlatList performance
  const renderHikeItem = useCallback(({ item }: { item: Hike }) => (
    <HikeCard
      hike={item}
      onPress={() => router.push(`/hike/${item.id}`)}
      onEdit={() => router.push({ pathname: '/hike/edit', params: { hikeId: item.id } })}
      onDelete={() => handleDelete(item)}
    />
  ), [handleDelete]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading hikes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Import and Filter Dialogs */}
      <ImportJsonDialog
        visible={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportFromDialog}
      />
      <AdvancedFilterDialog
        visible={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApplyFilter={handleApplyFilter}
        onClearFilter={handleClearFilter}
      />
      <OptionsMenuDialog
        visible={showImportOptionsDialog}
        onClose={() => setShowImportOptionsDialog(false)}
        title="Import Hike"
        options={[
          {
            icon: 'document',
            label: 'Import from File',
            onPress: handleImportFromFile,
            color: colors.primary,
          },
          {
            icon: 'clipboard',
            label: 'Paste JSON',
            onPress: () => setShowImportDialog(true),
            color: colors.secondary,
          },
        ]}
      />
      <OptionsMenuDialog
        visible={showOptionsDialog}
        onClose={() => setShowOptionsDialog(false)}
        title="Choose an option"
        options={[
          {
            icon: 'filter',
            label: 'Filter Hikes',
            onPress: () => setShowFilterDialog(true),
          },
          {
            icon: 'cloud-download',
            label: 'Import Hike',
            onPress: () => handleImportJsonMenu(),
          },
          {
            icon: 'refresh',
            label: 'Reset Database',
            onPress: () => handleResetDatabase(),
            color: colors.error,
          },
        ]}
      />

      {/* Search Bar - Hidden when advanced filter is active */}
      {!hasActiveFilter && (
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleSearch('')}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilter && (
        <View style={[styles.filterIndicator, { backgroundColor: colors.chipBackground }]}>
          <Text style={[styles.filterIndicatorText, { color: colors.chipText }]}>
            Filters active
          </Text>
          <TouchableOpacity 
            onPress={handleClearFilter}
            accessibilityLabel="Clear active filters"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={20} color={colors.chipText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Hike List */}
      {filteredHikes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={64} color={colors.disabled} />
          <Text style={[styles.emptyText, { color: colors.disabled }]}>
            {searchQuery ? 'No hikes found' : 'No hikes yet'}
          </Text>
          {!searchQuery && (
            <Text style={[styles.emptySubtext, { color: colors.disabled }]}>
              Tap the + button to add your first hike
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredHikes}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderHikeItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/hike/add')}
        accessibilityLabel="Add new hike"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop:12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterIndicatorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
