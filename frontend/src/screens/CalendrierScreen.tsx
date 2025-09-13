import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RendezVous {
  id: string;
  client_name: string;
  adresse: string;
  type: 'Visite_Technique' | 'Installation' | 'Reparation' | 'Devis' | 'Suivi';
  date: string; // ISO date
  heure_debut: string; // HH:mm
  heure_fin: string; // HH:mm
  description: string;
  status: 'Planifie' | 'Confirme' | 'En_cours' | 'Termine' | 'Annule';
  priorite: 'Basse' | 'Normale' | 'Haute' | 'Urgente';
  assigné_à: string; // ID utilisateur
  chantier_id?: string;
  notes: string;
  created_at: string;
}

interface JourCalendrier {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  rendezVous: RendezVous[];
}

const TYPES_RDV = [
  'Visite_Technique', 'Installation', 'Reparation', 'Devis', 'Suivi'
];

const STATUS_OPTIONS = [
  'Planifie', 'Confirme', 'En_cours', 'Termine', 'Annule'
];

const PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'];

const STORAGE_KEY = 'h2eaux_calendrier';

export default function CalendrierScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  
  const [newRdv, setNewRdv] = useState<Partial<RendezVous>>({
    client_name: '',
    adresse: '',
    type: 'Visite_Technique',
    date: format(new Date(), 'yyyy-MM-dd'),
    heure_debut: '09:00',
    heure_fin: '10:00',
    description: '',
    status: 'Planifie',
    priorite: 'Normale',
    assigné_à: 'admin',
    notes: '',
  });

  useEffect(() => {
    loadRendezVous();
  }, []);

  const loadRendezVous = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRendezVous(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
    }
  };

  const saveRendezVous = async (rdvData: RendezVous[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rdvData));
      setRendezVous(rdvData);
    } catch (error) {
      console.error('Erreur sauvegarde RDV:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Visite_Technique': return '#007AFF';
      case 'Installation': return '#FF6B35';
      case 'Reparation': return '#FF6B6B';
      case 'Devis': return '#9B59B6';
      case 'Suivi': return '#00D4AA';
      default: return '#666';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'Urgente': return '#FF3B30';
      case 'Haute': return '#FF9500';
      case 'Normale': return '#007AFF';
      case 'Basse': return '#8E8E93';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planifie': return '#007AFF';
      case 'Confirme': return '#FF9500';
      case 'En_cours': return '#FF6B35';
      case 'Termine': return '#00D4AA';
      case 'Annule': return '#8E8E93';
      default: return '#666';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'Visite_Technique': return 'Visite Tech.';
      case 'Installation': return 'Installation';
      case 'Reparation': return 'Réparation';
      case 'Devis': return 'Devis';
      case 'Suivi': return 'Suivi';
      default: return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Planifie': return 'Planifié';
      case 'Confirme': return 'Confirmé';
      case 'En_cours': return 'En cours';
      case 'Termine': return 'Terminé';
      case 'Annule': return 'Annulé';
      default: return status;
    }
  };

  const createRdv = async () => {
    if (!newRdv.client_name?.trim() || !newRdv.adresse?.trim()) {
      Alert.alert('Erreur', 'Le nom du client et l\'adresse sont obligatoires');
      return;
    }

    const rdvData: RendezVous = {
      id: Date.now().toString(),
      client_name: newRdv.client_name!,
      adresse: newRdv.adresse!,
      type: newRdv.type!,
      date: newRdv.date!,
      heure_debut: newRdv.heure_debut!,
      heure_fin: newRdv.heure_fin!,
      description: newRdv.description || '',
      status: newRdv.status!,
      priorite: newRdv.priorite!,
      assigné_à: newRdv.assigné_à!,
      chantier_id: newRdv.chantier_id,
      notes: newRdv.notes || '',
      created_at: new Date().toISOString(),
    };

    const updatedRdv = [...rendezVous, rdvData];
    await saveRendezVous(updatedRdv);

    setShowAddModal(false);
    setNewRdv({
      client_name: '',
      adresse: '',
      type: 'Visite_Technique',
      date: format(selectedDate, 'yyyy-MM-dd'),
      heure_debut: '09:00',
      heure_fin: '10:00',
      description: '',  
      status: 'Planifie',
      priorite: 'Normale',
      assigné_à: 'admin',
      notes: '',
    });

    Alert.alert('Succès', 'Rendez-vous créé avec succès');
  };

  const getRendezVousForDate = (date: Date): RendezVous[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rendezVous.filter(rdv => rdv.date === dateStr);
  };

  const generateCalendarWeek = (): JourCalendrier[] => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lundi
    const days: JourCalendrier[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      days.push({
        date,
        isToday: isToday(date),
        isCurrentMonth: true,
        rendezVous: getRendezVousForDate(date),
      });
    }
    
    return days;
  };

  const renderRendezVousItem = ({ item }: { item: RendezVous }) => (
    <TouchableOpacity 
      style={styles.rdvCard}
      onPress={() => {
        setSelectedRdv(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.rdvHeader}>
        <View style={styles.rdvTime}>
          <Text style={styles.timeText}>{item.heure_debut}</Text>
          <Text style={styles.timeText}>-</Text>
          <Text style={styles.timeText}>{item.heure_fin}</Text>
        </View>
        
        <View style={[styles.prioriteIndicator, { backgroundColor: getPrioriteColor(item.priorite) }]} />
      </View>
      
      <View style={styles.rdvContent}>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.adresse} numberOfLines={1}>{item.adresse}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
      
      <View style={styles.rdvTags}>
        <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.tagText}>{getTypeText(item.type)}</Text>
        </View>
        
        <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.tagText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCalendarDay = (jour: JourCalendrier) => {
    const isSelected = isSameDay(jour.date, selectedDate);
    const rdvCount = jour.rendezVous.length;
    
    return (
      <TouchableOpacity
        key={jour.date.toISOString()}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          jour.isToday && styles.todayDay,
        ]}
        onPress={() => setSelectedDate(jour.date)}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          jour.isToday && styles.todayDayText,
        ]}>
          {format(jour.date, 'dd')}
        </Text>
        
        <Text style={[
          styles.dayNameText,
          isSelected && styles.selectedDayText,
        ]}>
          {format(jour.date, 'EEE', { locale: fr })}
        </Text>
        
        {rdvCount > 0 && (
          <View style={styles.rdvCountBadge}>
            <Text style={styles.rdvCountText}>{rdvCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedDateRdv = getRendezVousForDate(selectedDate);
  const calendarWeek = generateCalendarWeek();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateHeader}>
          <TouchableOpacity 
            onPress={() => setSelectedDate(addDays(selectedDate, -7))}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {format(selectedDate, 'MMMM yyyy', { locale: fr })}
          </Text>
          
          <TouchableOpacity 
            onPress={() => setSelectedDate(addDays(selectedDate, 7))}
          >
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vue semaine */}
      <View style={styles.calendarWeek}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekContainer}
        >
          {calendarWeek.map(renderCalendarDay)}
        </ScrollView>
      </View>

      {/* RDV du jour sélectionné */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateTitle}>
          {format(selectedDate, 'EEEE dd MMMM', { locale: fr })}
        </Text>
        <Text style={styles.rdvCountTitle}>
          {selectedDateRdv.length} rendez-vous
        </Text>
      </View>

      <FlatList
        data={selectedDateRdv}
        renderItem={renderRendezVousItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.rdvList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez un RDV pour cette date
            </Text>
          </View>
        }
      />

      {/* Modal création RDV */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau RDV</Text>
            <TouchableOpacity onPress={createRdv}>
              <Text style={styles.saveButton}>Créer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client *</Text>
              <TextInput
                style={styles.input}
                value={newRdv.client_name}
                onChangeText={(text) => setNewRdv({...newRdv, client_name: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse *</Text>
              <TextInput
                style={styles.input}
                value={newRdv.adresse}
                onChangeText={(text) => setNewRdv({...newRdv, adresse: text})}
                placeholder="Adresse du rendez-vous"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de rendez-vous</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {TYPES_RDV.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        { backgroundColor: getTypeColor(type) },
                        newRdv.type === type && styles.typeButtonActive
                      ]}
                      onPress={() => setNewRdv({...newRdv, type: type as RendezVous['type']})}
                    >
                      <Text style={styles.typeButtonText}>{getTypeText(type)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={newRdv.date}
                  onChangeText={(text) => setNewRdv({...newRdv, date: text})}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Priorité</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.prioriteRow}>
                    {PRIORITES.map((priorite) => (
                      <TouchableOpacity
                        key={priorite}
                        style={[
                          styles.prioriteButton,
                          { backgroundColor: getPrioriteColor(priorite) },
                          newRdv.priorite === priorite && styles.prioriteButtonActive
                        ]}
                        onPress={() => setNewRdv({...newRdv, priorite: priorite as RendezVous['priorite']})}
                      >
                        <Text style={styles.prioriteButtonText}>{priorite}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Début</Text>
                <TextInput
                  style={styles.input}
                  value={newRdv.heure_debut}
                  onChangeText={(text) => setNewRdv({...newRdv, heure_debut: text})}
                  placeholder="09:00"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Fin</Text>
                <TextInput
                  style={styles.input}
                  value={newRdv.heure_fin}
                  onChangeText={(text) => setNewRdv({...newRdv, heure_fin: text})}
                  placeholder="10:00"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newRdv.description}
                onChangeText={(text) => setNewRdv({...newRdv, description: text})}
                placeholder="Description du rendez-vous..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal détail RDV */}
      {selectedRdv && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedRdv.client_name}
              </Text>
              <TouchableOpacity>
                <Ionicons name="pencil" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailClientName}>{selectedRdv.client_name}</Text>
                <Text style={styles.detailAdresse}>{selectedRdv.adresse}</Text>
                
                <View style={styles.detailTime}>
                  <Ionicons name="time" size={20} color="#007AFF" />
                  <Text style={styles.detailTimeText}>
                    {selectedRdv.heure_debut} - {selectedRdv.heure_fin}
                  </Text>
                </View>
                
                <View style={styles.detailTags}>
                  <View style={[styles.detailTag, { backgroundColor: getTypeColor(selectedRdv.type) }]}>
                    <Text style={styles.detailTagText}>{getTypeText(selectedRdv.type)}</Text>
                  </View>
                  
                  <View style={[styles.detailTag, { backgroundColor: getStatusColor(selectedRdv.status) }]}>
                    <Text style={styles.detailTagText}>{getStatusText(selectedRdv.status)}</Text>
                  </View>
                  
                  <View style={[styles.detailTag, { backgroundColor: getPrioriteColor(selectedRdv.priorite) }]}>
                    <Text style={styles.detailTagText}>{selectedRdv.priorite}</Text>
                  </View>
                </View>
                
                {selectedRdv.description && (
                  <View style={styles.detailDescription}>
                    <Text style={styles.detailDescriptionTitle}>Description :</Text>
                    <Text style={styles.detailDescriptionText}>{selectedRdv.description}</Text>
                  </View>
                )}
                
                {selectedRdv.notes && (
                  <View style={styles.detailDescription}>
                    <Text style={styles.detailDescriptionTitle}>Notes :</Text>
                    <Text style={styles.detailDescriptionText}>{selectedRdv.notes}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWeek: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weekContainer: {
    gap: 8,
  },
  calendarDay: {
    width: 50,
    height: 70,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  dayNameText: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  selectedDayText: {
    color: '#fff',
  },
  todayDayText: {
    color: '#FF6B35',
  },
  rdvCountBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B35',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rdvCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedDateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  rdvCountTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rdvList: {
    padding: 16,
  },
  rdvCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rdvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rdvTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  prioriteIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rdvContent: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  adresse: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  rdvTags: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  cancelButton: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.7,
  },
  typeButtonActive: {
    opacity: 1,
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  prioriteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  prioriteButton: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    opacity: 0.7,
  },
  prioriteButtonActive: {
    opacity: 1,
  },
  prioriteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
  },
  detailClientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  detailAdresse: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  detailTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  detailTag: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  detailDescription: {
    marginTop: 16,
  },
  detailDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  detailDescriptionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
});