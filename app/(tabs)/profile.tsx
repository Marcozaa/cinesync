import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, firestore } from "../../backend/firebase";

export default function EmailAuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{email: string, uid: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Utente loggato:", user.email);
        setUser(user);
      } else {
        console.log("Nessun utente loggato");
        setUser(null);
      }
    });

    // Carica l'username corrente da AsyncStorage
    (async () => {
      const username = await AsyncStorage.getItem("username");
      setCurrentUsername(username);
    })();

    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Inserisci email e password");
      return;
    }
    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registrazione completata!");
      
      // Salva il profilo utente in Firestore
      try {
        await setDoc(doc(firestore, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          createdAt: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.error("Errore nel salvataggio del profilo:", firestoreError);
        // Non bloccare la registrazione se Firestore fallisce
      }
    } catch (err: any) {
      console.log(err);
      setError(err.message || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Inserisci email e password");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login effettuato!");
    } catch (err: any) {
      console.log(err);
      setError(err.message || "Errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.log(err);
    }
  };

  const searchUsers = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    console.log("searchUsers - Query originale:", searchQuery, "Query trimmed:", trimmedQuery);
    
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      if (!user) {
        console.log("Nessun utente autenticato");
        setSearchResults([]);
        return;
      }

      // Carica tutti gli utenti da Firestore e filtra lato client
      // Firestore non supporta query "contains" nativamente
      const usersRef = collection(firestore, "users");
      const querySnapshot = await getDocs(usersRef);
      const results: Array<{email: string, uid: string}> = [];
      
      const searchLower = trimmedQuery.toLowerCase();
      console.log("Totale documenti trovati:", querySnapshot.size, "Cercando:", searchLower);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Verifica che i dati abbiano la struttura corretta
        if (data && typeof data === 'object') {
          const email = data.email;
          const uid = data.uid || doc.id; // Usa doc.id come fallback per uid
          
          // Verifica che email esista e sia una stringa
          if (email && typeof email === 'string') {
            const emailLower = email.toLowerCase();
            const isCurrentUser = uid === user.uid;
            const matches = emailLower.includes(searchLower);
            
            console.log(`Email: ${email}, UID: ${uid}, IsCurrent: ${isCurrentUser}, Matches: ${matches}`);
            
            if (!isCurrentUser && matches) {
              results.push({
                email: email,
                uid: uid
              });
            }
          } else {
            console.log("Email mancante o non valida:", email, typeof email);
          }
        } else {
          console.log("Dati non validi per documento:", doc.id, data);
        }
      });
      
      console.log("Risultati finali trovati:", results.length, results);
      setSearchResults(results);
    } catch (error) {
      console.error("Errore nella ricerca utenti:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };



  useEffect(() => {
    if (!user) return; // Aspetta che l'utente sia autenticato
    
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // Debounce di 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const handleInviteUser = async (userData: {email: string, uid: string}) => {
    try {
      // Usa addDoc invece di setDoc per generare un ID univoco automaticamente
      const docRef = await addDoc(collection(firestore, "invites"), {
        fromUid: user.uid,
        fromEmail: user.email,
        toUid: userData.uid,
        toEmail: userData.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      console.log(`Invito inviato a: ${userData.email} con ID: ${docRef.id}`);
      setSearchQuery("");
      setSearchResults([]);
      setShowInvitePanel(false);
      // Mostra un messaggio di successo
      alert(`Invito inviato a ${userData.email}!`);
    } catch (error) {
      console.error("Errore nell'invio dell'invito:", error);
      alert("Errore nell'invio dell'invito");
    }
  };

  if (user) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.userCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <AntDesign name="user" size={40} color="#fff" />
                </View>
              </View>
              <ThemedText type="title" style={styles.userTitle}>
                Benvenuto!
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {user.email}
              </ThemedText>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <AntDesign name="logout" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Esci</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Invite Section */}
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => setShowInvitePanel(!showInvitePanel)}
            >
              <AntDesign 
                name={showInvitePanel ? "up" : "down"} 
                size={16} 
                color="#fff" 
                style={styles.inviteIcon}
              />
              <Text style={styles.inviteButtonText}>
                {showInvitePanel ? "Chiudi ricerca" : "Invita un amico"}
              </Text>
            </TouchableOpacity>

            {/* Search Panel */}
            {showInvitePanel && (
              <Animated.View style={styles.searchPanel}>
                <View style={styles.searchInputContainer}>
                  <AntDesign name="search" size={20} color="#667eea" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Cerca per email..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={styles.clearButton}
                    >
                      <AntDesign name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Results */}
                {searchLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={styles.loadingText}>Ricerca in corso...</Text>
                  </View>
                )}

                {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <AntDesign name="frown" size={24} color="#999" />
                    <Text style={styles.noResultsText}>Nessun utente trovato</Text>
                  </View>
                )}

                {!searchLoading && searchResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>
                      {searchResults.length} utente{searchResults.length !== 1 ? "i" : ""} trovato{searchResults.length !== 1 ? "i" : ""}
                    </Text>
                    {searchResults.map((userData, index) => (
                      <TouchableOpacity
                        key={userData.uid || index}
                        style={styles.userItem}
                        onPress={() => handleInviteUser(userData)}
                      >
                        <View style={styles.userItemAvatar}>
                          <AntDesign name="user" size={20} color="#667eea" />
                        </View>
                        <Text style={styles.userItemName}>{userData.email}</Text>
                        <AntDesign name="plus-circle" size={24} color="#667eea" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>
                      Inserisci almeno 2 caratteri per cercare
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.logo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <AntDesign name="play-circle" size={50} color="#fff" />
                </LinearGradient>
              </View>
              <ThemedText type="title" style={styles.title}>
                CineSync
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {isLoginMode ? "Accedi al tuo account" : "Crea un nuovo account"}
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <AntDesign name="mail" size={20} color="#667eea" />
                </View>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <AntDesign name="lock" size={20} color="#667eea" />
                </View>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <AntDesign
                    name={showPassword ? "eye" : "eye-invisible"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <AntDesign name="exclamation-circle" size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Primary Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isLoginMode ? handleLogin : handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoginMode ? "Accedi" : "Registrati"}
                    </Text>
                    <AntDesign name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                  </LinearGradient>
                )}
              </TouchableOpacity>

              {/* Toggle Mode */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLoginMode ? "Non hai un account? " : "Hai già un account? "}
                </Text>
                <TouchableOpacity onPress={() => {
                  setIsLoginMode(!isLoginMode);
                  setError(null);
                }}>
                  <Text style={styles.toggleLink}>
                    {isLoginMode ? "Registrati" : "Accedi"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
  toggleLink: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  userCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userTitle: {
    color: "#fff",
    marginBottom: 8,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#667eea",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 24,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inviteIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  searchPanel: {
    marginTop: 20,
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: "#667eea",
    fontSize: 14,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noResultsText: {
    marginTop: 12,
    color: "#999",
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3e8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userItemName: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  hintContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  hintText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
  },
});
