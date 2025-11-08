import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "923911193343-n7hsih4a45704m21cj9b3gpbd7k8kufg.apps.googleusercontent.com",
    iosClientId: "923911193343-n7hsih4a45704m21cj9b3gpbd7k8kufg.apps.googleusercontent.com",
    androidClientId: "923911193343-n7hsih4a45704m21cj9b3gpbd7k8kufg.apps.googleusercontent.com",
    webClientId: "923911193343-n7hsih4a45704m21cj9b3gpbd7k8kufg.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  return { promptAsync, request };
}
