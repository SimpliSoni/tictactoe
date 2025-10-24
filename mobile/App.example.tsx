import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { io } from 'socket.io-client';
import React, { useEffect, useState } from 'react';

// --- ⬇️ ⬇️ ⬇️ ---
// Replace this with your deployed Railway URL, e.g.:
// const SERVER_URL = 'https://your-project-name.up.railway.app';
const SERVER_URL = 'https://your-project-name.up.railway.app';
// --- ⬆️ ⬆️ ⬆️ ---

const socket = io(SERVER_URL);

export default function App() {
  const [status, setStatus] = useState('Connecting...');
  const [welcome, setWelcome] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setStatus(`Connected with ID: ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      setStatus('Connection Failed!');
      console.log(err.message);
    });

    // Listen for the 'welcome' message from the server
    socket.on('welcome', (message) => {
      setWelcome(message);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tic-Tac-Toe Client</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.welcome}>Server says: {welcome}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  welcome: {
    fontSize: 16,
    color: 'green',
    fontStyle: 'italic',
  },
});
