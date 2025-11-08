import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function EmailAuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registrazione completata!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login effettuato!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Login" onPress={handleLogin} />
      <View style={{ height: 10 }} />
      <Button title="Registrati" onPress={handleSignUp} />
      {error && <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>}
    </View>
  );
}
