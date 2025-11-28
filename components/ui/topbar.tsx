import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, firestore } from "../../backend/firebase";
import { listenToReceivedInvites } from "../../backend/utils/firestoreutils.js";
import { useRouter } from "expo-router";
import { InviteBanner } from "./invite-banner";
import { doc, updateDoc } from "firebase/firestore";

interface Invite {
  id: string;
  fromUid: string;
  fromEmail: string;
  toUid: string;
  status: string;
  createdAt?: any;
}

export function TopBar() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [showBanner, setShowBanner] = useState(false);
  const [currentInvite, setCurrentInvite] = useState<Invite | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const unsubscribeInvites = listenToReceivedInvites(user.uid, (newInvites: Invite[]) => {
        const pending = newInvites.filter(inv => inv.status === 'pending');
        if (pending.length > invites.filter(i => i.status === 'pending').length && pending.length > 0) {
          const latestInvite = pending.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)[0];
          setCurrentInvite(latestInvite);
          setShowBanner(true);
        }
        setInvites(newInvites);
      });
      return () => unsubscribeInvites();
    });
    return () => unsubscribeAuth();
  }, [invites]);

  const handleAccept = async () => {
    if (!currentInvite) return;
    try {
      await updateDoc(doc(firestore, "invites", currentInvite.id), {
        status: "accepted",
      });
      setShowBanner(false);
      // Naviga alla sessione
      router.push({ pathname: '/', params: { sessionId: currentInvite.id } });
    } catch (error) {
      console.error("Errore nell'accettare l'invito:", error);
    }
  };

  const handleReject = async () => {
    if (!currentInvite) return;
    try {
      await updateDoc(doc(firestore, "invites", currentInvite.id), {
        status: "rejected",
      });
      setShowBanner(false);
    } catch (error) {
      console.error("Errore nel rifiutare l'invito:", error);
    }
  };

  const pendingInvitesCount = invites.filter(
    (invite) => invite.status === "pending"
  ).length;

  useEffect(() => {
    if (pendingInvitesCount > 0) {
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
  }, [pendingInvitesCount]);

  return (
    <>
      <InviteBanner
        visible={showBanner}
        fromEmail={currentInvite?.fromEmail}
        onAccept={handleAccept}
        onReject={handleReject}
      />
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
              {pendingInvitesCount > 0 && (
                <Animated.View
                  style={[
                    styles.badge,
                    {
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {pendingInvitesCount > 9 ? "9+" : pendingInvitesCount}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </>
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