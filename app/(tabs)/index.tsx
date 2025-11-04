import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AntDesign } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { useSharedValue, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';

export default function HomeScreen() {
  const token = process.env.EXPO_PUBLIC_ACCESS_TOKEN;
  const progress = useSharedValue(0);
const x = useSharedValue(0);
const ref = useRef<SwiperCardRefType>(null);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Progress value:", progress.value);
  }, [progress]);
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('API token not found');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://api.themoviedb.org/3/movie/popular?language=en-US&page=1', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          },
        });
        
        if (response.data && Array.isArray(response.data.results)) {
          setMovies(response.data.results);
        } else {
          setError('Invalid data format received');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const renderCard = (movie: Movie) => (
  <View style={styles.card}>
    <Image
      style={styles.movieImage}
      source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
      contentFit="cover"
      transition={1000}
    />
    <View style={styles.movieInfo}>
      <Text style={styles.movieTitle}>{movie.title}</Text>
      <View style={styles.movieMeta}>
        <Text style={styles.movieRating}>★ {movie.vote_average.toFixed(1)}</Text>
        <Text style={styles.movieDate}>{new Date(movie.release_date).getFullYear()}</Text>
      </View>
      <Text style={styles.movieOverview} numberOfLines={3}>{movie.overview}</Text>
    </View>
  </View>
);

 const renderFlippedCard = useCallback(
    (item: Movie, index: number) => {
      const maxPopularity = 4000;
      const popularityPercentage = (item.popularity / maxPopularity) * 100;
      
      return (
        <View style={styles.renderFlippedCardContainer}>
          <Text style={styles.flippedTitle}>{item.title}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.popularityContainer}>
              <Text style={styles.popularityLabel}>Popularity Score</Text>
              <Text style={styles.popularityValue}>
                {item.popularity.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
              </Text>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(popularityPercentage, 100)}%` }]} />
              </View>
              
              <Text style={styles.popularityMaxValue}>
                Max: {maxPopularity.toLocaleString('it-IT')}
              </Text>
            </View>

            <View style={styles.additionalStats}>
              <View style={styles.statItem}>
                <AntDesign name="calendar" size={24} color="#2c3e50" />
                <Text style={styles.statText}>
                  {new Date(item.release_date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long' })}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <AntDesign name="star" size={24} color="#f39c12" />
                <Text style={styles.statText}>
                  {item.vote_average.toFixed(1)} / 10
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    []
  );

  const OverlayLabelRight = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'rgba(46, 204, 113, 0.3)',
            borderWidth: 2,
            borderColor: '#2ecc71',
          },
        ]}
      >
        <View style={styles.overlayContent}>
          <AntDesign name="heart" size={50} color="#2ecc71" />
          <Text style={[styles.overlayText, { color: '#2ecc71' }]}>Mi piace</Text>
        </View>
      </View>
    );
  }, []);
  const OverlayLabelLeft = useCallback(() => {
    return (
      <View
        style={[
          styles.overlayLabelContainer,
          {
            backgroundColor: 'rgba(255, 39, 39, 0.3)',
            borderWidth: 2,
            borderColor: '#ff2727cc',
          },
        ]}
      >
        <View style={styles.overlayContent}>
          <AntDesign name="heart" size={50} color="#ff2727cc" />
          <Text style={[styles.overlayText, { color: '#ff2727cc' }]}>Non mi piace</Text>
        </View>
      </View>
    );
  }, []);
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading movies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>No movies found</Text>
      </View>
    );
  }

  const formattedData = movies.map(movie => ({ item: movie }));

  return (
    <>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Swiper
          ref={ref}
          data={movies}
          renderCard={renderCard}
          cardStyle={styles.cardStyle}
         FlippedContent={renderFlippedCard}

          onIndexChange={() => {
            progress.value = 0;
          }}
          onPress={()=>{
            ref.current?.flipCard()
          }}
          
OverlayLabelRight={OverlayLabelRight}
OverlayLabelLeft={OverlayLabelLeft}
          onSwipeRight={(i) => console.log("RIGHT:", movies[i].title)}
          onSwipeLeft={(i) => console.log("LEFT:", movies[i].title)}
        />
      </View>
    </GestureHandlerRootView>
    <TouchableOpacity>
      <Text onPress={() => ref.current?.flipCard()} style={{textAlign: 'center', marginBottom: 20, fontSize: 18, fontWeight: 'bold'}}>Flip Card</Text>
    </TouchableOpacity>
    
    </>
  );
}

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  original_language: string;
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
     width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 8,
  },
  movieImage: {
    width: '100%',
    height: '65%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  movieMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  movieRating: {
    fontSize: 14,
    color: '#f5c518',
    fontWeight: 'bold',
  },
  movieDate: {
    fontSize: 14,
    color: '#666',
  },
  movieOverview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
   cardStyle: {
    width: '90%',
    height: '90%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
 overlayLabelContainer: {
    position: 'absolute',
    borderRadius: 15,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayText: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
    
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overlayLabelContainerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderFlippedCardContainer: {
    borderRadius: 15,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
    padding: 20,
  },
  flippedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
  },
  popularityContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popularityLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
    fontWeight: '600',
  },
  popularityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 10,
  },
  popularityMaxValue: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 5,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statText: {
    marginTop: 8,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
});
