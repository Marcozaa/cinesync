import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface InviteBannerProps {
  visible: boolean;
  fromEmail?: string;
  onAccept: () => void;
  onReject: () => void;
}

const { width } = Dimensions.get('window');

export function InviteBanner({ visible, fromEmail, onAccept, onReject }: InviteBannerProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const [isHidden, setIsHidden] = React.useState(true);

  useEffect(() => {
    if (visible) {
      setIsHidden(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsHidden(true);
      });
    }
  }, [visible]);

  if (isHidden) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AntDesign name="gift" size={24} color="#fff" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Nuovo Invito!</Text>
            <Text style={styles.subtitle}>
              {fromEmail ? `${fromEmail} ti ha invitato` : 'Sei stato invitato'} a una sessione di CineSync
            </Text>
            <Text style={styles.question}>Vuoi unirti?</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
            activeOpacity={0.8}
          >
            <AntDesign name="close" size={18} color="#fff" />
            <Text style={styles.buttonText}>Rifiuta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <AntDesign name="check" size={18} color="#2ecc71" />
            <Text style={[styles.buttonText, styles.acceptButtonText]}>Accetta</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  gradient: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 2,
    lineHeight: 18,
  },
  question: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  acceptButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  acceptButtonText: {
    color: '#2ecc71',
  },
});
