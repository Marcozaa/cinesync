import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withTiming,
} from 'react-native-reanimated';

interface MatchModalProps {
  visible: boolean;
  onClose: () => void;
  movieId: string;
  movieImage: string;
}

const { width } = Dimensions.get('window');

export const MatchModal = ({ visible, onClose, movieId , movieImage}: MatchModalProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.2, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(1, {
          duration: 150,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      opacity.value = withTiming(1, { duration: 300 });
      textOpacity.value = withDelay(
        400,
        withSpring(1, { mass: 0.5, damping: 10 })
      );
    } else {
      scale.value = withTiming(0);
      opacity.value = withTiming(0);
      textOpacity.value = withTiming(0);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: withSpring(textOpacity.value * -20),
      },
    ],
  }));

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Image
            source={{ uri: movieImage }}
            style={styles.image}
            contentFit="cover"
          />
          <Animated.Text style={[styles.matchText, textStyle]}>
            È un Match!
          </Animated.Text>
          <Animated.Text style={[styles.subtitleText, textStyle]}>
            Tu e il tuo partner avete un gusto cinematografico simile!
          </Animated.Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continua a esplorare</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 25,
    width: width * 0.9,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  image: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 25,
    borderRadius: 20,
    
    elevation: 16,
    borderWidth: 3,
    borderColor: '#2ecc71',
  },
  matchText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2ecc71',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(46, 204, 113, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 35,
    paddingHorizontal: 25,
    lineHeight: 24,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 15,
    shadowColor: '#2ecc71',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});