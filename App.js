import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Animated } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import AuthModal from './src/components/AuthModal';
import MatchesScreen from './src/screens/MatchesScreen';
import StandingsScreen from './src/screens/StandingsScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import TeamScreen from './src/screens/TeamScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { Svg, Path, Rect } from 'react-native-svg';

GoogleSignin.configure({
  webClientId: "304025860925-lhf78thaj8p1ncq8sqavk5vktsqcumfd.apps.googleusercontent.com",
});

function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(exitAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, 1500);
    });
  }, []);

  return (
    <Animated.View
      style={{ opacity: exitAnim }}
      className="absolute inset-0 z-[10000] bg-equd items-center justify-center"
    >
      <View className="absolute inset-0">
        <View className="absolute -top-40 -left-32 w-[500px] h-[400px] bg-merah/20 rounded-full" />
        <View className="absolute -bottom-32 -right-24 w-[400px] h-[300px] bg-kuning/20 rounded-full" />
      </View>

      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        className="items-center"
      >
        <Image
          source={require('./assets/logo.png')}
          className="w-48 h-20"
          resizeMode="contain"
        />
        <Text className="text-white text-xs tracking-widest mt-4">
          Live Score & Jadwal
        </Text>
      </Animated.View>

      <LoadingBar />
    </Animated.View>
  );
}

function LoadingBar() {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: 200,
      duration: 2500,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View className="absolute bottom-16 items-center">
      <View className="w-[200px] h-[2px] bg-white/10 rounded-full overflow-hidden">
        <Animated.View
          style={{ width: widthAnim }}
          className="h-full bg-merah rounded-full"
        />
      </View>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [currentView, setCurrentView] = useState('matches');
  const [previousView, setPreviousView] = useState('matches');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const sessionStorageDismissed = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !sessionStorageDismissed.current) {
        sessionStorageDismissed.current = true;
        setTimeout(() => setAuthModalVisible(true), 7000);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await GoogleSignin.signOut();
    await signOut(auth);
    setCurrentView('matches');
  };

  const navigateTo = (view, payload = null) => {
    setPreviousView(currentView);
    setCurrentView(view);
    if (view === 'detail') setSelectedMatchId(payload);
    if (view === 'team') setSelectedTeamId(payload);
  };

  const isMainView = currentView === 'matches' || currentView === 'standings' || currentView === 'profile';

  return (
    <SafeAreaView className="flex-1 bg-equd">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      {isMainView && (
        <View className="px-4 py-2 flex-row items-center justify-between z-40">
          <Image source={require('./assets/logo.png')} className="w-32 h-10" resizeMode="contain" />
          {user ? (
            <TouchableOpacity
              onPress={() => setCurrentView('profile')}
              className="flex-row items-center gap-2"
            >
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-white font-bold text-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-white">
                {user.displayName?.split(" ")[0] || 'User'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setAuthModalVisible(true)}
              className="bg-merah px-4 py-2 rounded-xl"
            >
              <Text className="text-xs font-bold text-white">Masuk</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* VIEWS */}
      {currentView === 'matches' && (
        <MatchesScreen onMatchClick={(id) => navigateTo('detail', id)} />
      )}
      {currentView === 'standings' && (
        <StandingsScreen onTeamClick={(id) => navigateTo('team', id)} />
      )}
      {currentView === 'detail' && (
        <MatchDetailScreen
          matchId={selectedMatchId}
          goBack={() => setCurrentView(previousView === 'detail' ? 'matches' : previousView)}
        />
      )}
      {currentView === 'team' && (
        <TeamScreen
          teamId={selectedTeamId}
          goBack={() => setCurrentView(previousView === 'team' ? 'matches' : previousView)}
        />
      )}
      {currentView === 'profile' && (
        <ProfileScreen user={user} onLogout={handleLogout} />
      )}

      {/* BOTTOM NAV */}
      {isMainView && (
        <View className="absolute bottom-0 left-0 w-full bg-culos border-t border-white/5 flex-row pb-6">

          {/* Jadwal */}
          <TouchableOpacity
            onPress={() => setCurrentView('matches')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.5 11.842V20.9613C24.5 23.56 22.4107 25.6666 19.8333 25.6666H8.16667C5.58934 25.6666 3.5 23.56 3.5 20.9613V11.842C3.5 10.4292 4.12959 9.09123 5.21484 8.19759L11.0482 3.39422C12.766 1.97968 15.234 1.97968 16.9518 3.39422L22.7852 8.19759C23.8704 9.09123 24.5 10.4292 24.5 11.842ZM11.6667 20.125C11.1834 20.125 10.7917 20.5167 10.7917 21C10.7917 21.4832 11.1834 21.875 11.6667 21.875H16.3333C16.8166 21.875 17.2083 21.4832 17.2083 21C17.2083 20.5167 16.8166 20.125 16.3333 20.125H11.6667Z"
                fill={currentView === 'matches' ? "#FC0B12" : "#6B7280"}
              />
            </Svg>
            <Text className={`text-xs font-bold ${currentView === 'matches' ? 'text-white' : 'text-gray-600'}`}>
              Jadwal
            </Text>
          </TouchableOpacity>

          {/* Klasemen */}
          <TouchableOpacity
            onPress={() => setCurrentView('standings')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 20H20M6 17L6 13M12 17L12 9M18 17L18 5"
                stroke={currentView === 'standings' ? "#FC0B12" : "#6B7280"}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <Rect x="4" y="3" width="4" height="4" rx="1" fill={currentView === 'standings' ? "#FC0B12" : "#6B7280"} />
              <Rect x="10" y="3" width="4" height="4" rx="1" fill={currentView === 'standings' ? "#FC0B12" : "#6B7280"} />
              <Rect x="16" y="3" width="4" height="4" rx="1" fill={currentView === 'standings' ? "#FC0B12" : "#6B7280"} />
            </Svg>
            <Text className={`text-xs font-bold ${currentView === 'standings' ? 'text-white' : 'text-gray-600'}`}>
              Klasemen
            </Text>
          </TouchableOpacity>

          {/* Profil */}
          <TouchableOpacity
            onPress={() => setCurrentView('profile')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                stroke={currentView === 'profile' ? "#FC0B12" : "#6B7280"}
                strokeWidth="2"
              />
            </Svg>
            <Text className={`text-xs font-bold ${currentView === 'profile' ? 'text-white' : 'text-gray-600'}`}>
              Profil
            </Text>
          </TouchableOpacity>

        </View>
      )}

      {/* SPLASH */}
      {splashVisible && <SplashScreen onFinish={() => setSplashVisible(false)} />}

      {/* AUTH MODAL */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </SafeAreaView>
  );
}
