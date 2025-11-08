import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../backend/firebase";
import { listenToReceivedInvites } from "../../backend/utils/firestoreutils.js";
import { useRouter } from "expo-router";

interface Invite {
  id: string;
  fromUid: string;
  toUid: string;
  status: string;
  createdAt?: any;
}

export function TopBar() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const router = useRouter()
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const unsubscribeInvites = listenToReceivedInvites(user.uid, setInvites);
      return () => unsubscribeInvites();
    });
    return () => unsubscribeAuth();
  }, []);
  
  const [prevCount, setPrevCount] = useState(0);

useEffect(() => {
  if (invites.length > prevCount) {
    // Solo se c’è un nuovo invito
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }
  setPrevCount(invites.length);
}, [invites.length]);

  // Animazione quando cambia il numero di inviti
  useEffect(() => {
    console.log("Numero di inviti cambiato:", invites.length);
    console.log(invites);
    if (invites.length > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [invites.length]);

  const pendingInvites = invites.filter((invite) => invite.status === "pending");

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>CineSync</Text>
        </View>

        {auth.currentUser && (
          <TouchableOpacity style={styles.invitesButton} onPress={() => router.push('./inviti')} activeOpacity={0.7}>
            <AntDesign name="mail" size={22} color="#fff" />
            {invites.length > 0 && (
              <Animated.View
                style={[
                  styles.badge,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {invites.length > 9 ? "9+" : invites.length}
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  invitesButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});