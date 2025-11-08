import { auth } from '@/backend/firebase';
import { listenToReceivedInvites } from '@/backend/utils/firestoreutils';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function InvitiScreen() {
  const [invites, setInvites] = useState<any[]>([]);
  const [prevCount, setPrevCount] = useState(0);

  const animations = useRef<{ [id: string]: Animated.Value }>({}).current;

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const unsubscribeInvites = listenToReceivedInvites(user.uid, setInvites);
      return () => unsubscribeInvites();
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (invites.length > prevCount) {
      // C'è un nuovo invito
      const lastInvite = invites[invites.length - 1];
      const id = lastInvite.id;

      // Se non ha già una Animated.Value, la creiamo
      if (!animations[id]) animations[id] = new Animated.Value(1);

      // Anima solo l'ultimo arrivato
      Animated.sequence([
        Animated.timing(animations[id], {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animations[id], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setPrevCount(invites.length);
  }, [invites]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schermata Inviti</Text>

      {invites.map((invite) => {
        // Ogni invito ha la propria animazione
        if (!animations[invite.id]) animations[invite.id] = new Animated.Value(1);

        return (
          <Animated.View
            key={invite.id}
            style={[
              styles.inviteContainer,
              { transform: [{ scale: animations[invite.id] }] },
            ]}
          >
            <Text style={styles.inviteText}>
              Invito da: {invite.fromUid} {"\n"}
              Stato: {invite.status}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  inviteContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: 300,
  },
  inviteText: { fontSize: 16, color: '#666' },
});
