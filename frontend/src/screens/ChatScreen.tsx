import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document';
  is_me: boolean;
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender_id: 'admin',
    sender_name: 'Patron',
    message: 'Bonjour, pouvez-vous m\'envoyer les photos du chantier Dupont ?',
    timestamp: '2025-01-15T10:30:00',
    type: 'text',
    is_me: false,
  },
  {
    id: '2',
    sender_id: 'employee1',
    sender_name: 'Moi',
    message: 'Oui chef, je vous envoie ça tout de suite !',
    timestamp: '2025-01-15T10:32:00',
    type: 'text',
    is_me: true,
  },
  {
    id: '3',
    sender_id: 'employee1',
    sender_name: 'Moi',
    message: 'Photo de l\'installation terminée',
    timestamp: '2025-01-15T10:35:00',
    type: 'image',
    is_me: true,
  },
  {
    id: '4',
    sender_id: 'admin',
    sender_name: 'Patron',
    message: 'Parfait ! Le client sera content. RDV demain chez Bernard à 9h.',
    timestamp: '2025-01-15T10:40:00',
    type: 'text',
    is_me: false,
  },
];

export default function ChatScreen() {
  const [messages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuthStore();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Ici on ajouterait la logique pour envoyer le message
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.is_me ? styles.myMessage : styles.otherMessage
    ]}>
      {!item.is_me && (
        <Text style={styles.senderName}>{item.sender_name}</Text>
      )}
      
      <View style={[
        styles.messageBubble,
        item.is_me ? styles.myMessageBubble : styles.otherMessageBubble
      ]}>
        {item.type === 'image' && (
          <View style={styles.imageMessage}>
            <Ionicons name="image" size={20} color="#fff" />
            <Text style={styles.imageText}>Image</Text>
          </View>
        )}
        
        {item.type === 'document' && (
          <View style={styles.documentMessage}>
            <Ionicons name="document" size={20} color="#fff" />
            <Text style={styles.documentText}>Document</Text>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          item.is_me ? styles.myMessageText : styles.otherMessageText
        ]}>
          {item.message}
        </Text>
      </View>
      
      <Text style={[
        styles.timestamp,
        item.is_me ? styles.myTimestamp : styles.otherTimestamp
      ]}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="people" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Équipe H2EAUX</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="camera" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        inverted
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Tapez votre message..."
            placeholderTextColor="#666"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, newMessage.trim() ? styles.sendButtonActive : null]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
  },
  otherMessageBubble: {
    backgroundColor: '#2a2a2a',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  myTimestamp: {
    marginRight: 12,
  },
  otherTimestamp: {
    marginLeft: 12,
  },
  imageMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  imageText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
  },
  documentMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  documentText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#444',
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#666',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
});