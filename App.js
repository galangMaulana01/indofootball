import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Animated } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import AuthModal from './src/components/AuthModal';
import MatchesScreen from './src/screens/MatchesScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import TeamScreen from './src/screens/TeamScreen';
import LeagueScreen from './src/screens/LeagueScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { Svg, Path } from 'react-native-svg';

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
      className="absolute inset-0 z-[10000] bg-black items-center justify-center"
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
  const [selectedLeague, setSelectedLeague] = useState(null);
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
    if (view === 'league') setSelectedLeague(payload);
  };

  const isMainView = currentView === 'matches' || currentView === 'standings' || currentView === 'profile' || currentView === 'topscorers';

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* VIEWS */}
      {currentView === 'matches' && (
        <MatchesScreen onMatchClick={(id) => navigateTo('detail', id)}  onLeagueClick={(league) => navigateTo('league', league)} />
      )}

      {/* Mode Cari Klub (Menu Standings) - Paksa teamId jadi null */}
      {currentView === 'standings' && (
        <TeamScreen
          teamId={null}
          goBack={() => setCurrentView('matches')}
        />
      )}

      {currentView === 'detail' && (
        <MatchDetailScreen
          matchId={selectedMatchId}
          goBack={() => setCurrentView(previousView === 'detail' ? 'matches' : previousView)}
        />
      )}

      {/* Mode Detail Klub (Ketika logo klub di-klik dari jadwal) */}
      {currentView === 'team' && (
        <TeamScreen
          teamId={selectedTeamId}
          goBack={() => setCurrentView(previousView === 'detail' ? 'detail' : 'matches')}
        />
      )}

{currentView === 'league' && (
  <LeagueScreen
    league={selectedLeague}
    goBack={() => setCurrentView('matches')}
  />
)}

      {currentView === 'profile' && (
        <ProfileScreen user={user} onLogout={handleLogout} />
      )}

      {/* BOTTOM NAV */}
      {isMainView && (
        <View className="absolute bottom-0 left-0 w-full bg-culos flex-row pb-6">
          {/* Jadwal */}
          <TouchableOpacity
            onPress={() => setCurrentView('matches')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="21" height="21" viewBox="0 0 21 21" fill="none">
              <Path d="M7.99105 0.827471C9.39474 -0.232085 11.3621 -0.27409 12.8089 0.701458L12.9868 0.827471L19.7168 5.94254C20.4573 6.48754 20.9116 7.29717 20.9889 8.17821L21 8.38928V16.9046C21 19.0993 19.1752 20.8845 16.8884 21H14.6889C13.6378 20.98 12.7879 20.203 12.7105 19.2264L12.6995 19.0783V16.0761C12.6995 15.7495 12.4442 15.4775 12.1026 15.4239L12.0032 15.4134H9.051C8.69842 15.4239 8.41105 15.6655 8.36684 15.9805L8.35579 16.0761V19.0689C8.35579 19.1308 8.34363 19.2043 8.33368 19.2568L8.32263 19.2789L8.31047 19.3513C8.17895 20.245 7.40526 20.9265 6.44368 20.9905L6.3 21H4.32158C2.01158 21 0.121579 19.2789 0 17.1146V8.38928C0.00994737 7.49564 0.42 6.66606 1.10526 6.0885L7.99105 0.827471ZM12.0253 1.97209C11.1853 1.33152 9.99158 1.30107 9.10737 1.85657L8.94047 1.97209L2.22047 7.11865C1.83474 7.39063 1.60263 7.80017 1.54737 8.23072L1.53521 8.39873V16.9046C1.53521 18.3012 2.68468 19.4458 4.14474 19.5299H6.3C6.54316 19.5299 6.75316 19.3734 6.78521 19.1529L6.80842 18.9638L6.81947 18.9103V16.0761C6.81947 14.9524 7.72579 14.0388 8.88632 13.9538H12.0032C13.1847 13.9538 14.1463 14.8159 14.2358 15.9185V19.0783C14.2358 19.2988 14.4016 19.4889 14.6226 19.5299H16.6773C18.1584 19.5299 19.3631 18.4493 19.4515 17.0726L19.4637 16.9046V8.39873C19.4515 7.94824 19.2537 7.52714 18.9111 7.21316L18.7674 7.0966L12.0253 1.97209Z" fill={currentView === 'matches' ? "#FC0B12" : "#FFF"}/>
            </Svg>
          </TouchableOpacity>

          {/* Cari Klub */}
          <TouchableOpacity
            onPress={() => setCurrentView('standings')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="24" height="21" viewBox="0 0 24 21" fill="none">
              <Path d="M23.8528 7.17L17.6898 0.18C17.5713 0.06 17.4231 0 17.2454 0H6.75648C6.5787 0 6.43055 0.06 6.31203 0.18L0.14907 7.17C-0.0287079 7.38 -0.0583376 7.68 0.11944 7.92L2.84537 11.76C3.02314 12.03 3.3787 12.09 3.61574 11.91C3.64537 11.91 3.64537 11.88 3.675 11.88L5.57129 10.5L5.51203 18.6C5.51203 19.23 5.74907 19.86 6.19351 20.31C6.63796 20.76 7.26018 21 7.8824 21H16.1194C16.7417 21 17.3639 20.76 17.8083 20.31C18.2528 19.86 18.4898 19.23 18.4898 18.6L18.4305 10.5L20.3268 11.88C20.5639 12.09 20.9194 12.06 21.1268 11.82C21.1268 11.79 21.1565 11.79 21.1565 11.76L23.8824 7.92C24.0602 7.68 24.0306 7.38 23.8528 7.17ZM14.4009 1.2C14.2824 2.67 13.1565 4.86 12.0009 4.86C10.8454 4.86 9.71944 2.67 9.60092 1.2H14.4009ZM20.5343 10.56L18.1639 8.82C17.9861 8.7 17.7491 8.67 17.5713 8.79C17.3639 8.88 17.2454 9.09 17.2454 9.33L17.3046 18.6C17.3046 18.9 17.1861 19.23 16.9787 19.44C16.7417 19.68 16.4454 19.8 16.1194 19.8H7.8824C7.55648 19.8 7.26018 19.68 7.02314 19.44C6.81574 19.23 6.69722 18.9 6.69722 18.6L6.75648 9.33C6.75648 9.09 6.63796 8.88 6.43055 8.79C6.34166 8.73 6.25277 8.73 6.16388 8.73C6.04537 8.73 5.92685 8.76 5.83796 8.82L3.46759 10.56L1.36388 7.62L7.02314 1.2H8.41574C8.53425 3.03 9.89722 6.06 12.0009 6.06C14.1046 6.06 15.4676 3.03 15.5861 1.2H16.9787L22.638 7.62L20.5343 10.56Z" fill={currentView === 'standings' ? '#FC0B12' : '#FFF'} />
            </Svg>
          </TouchableOpacity>

          {/* Profil */}
          <TouchableOpacity
            onPress={() => setCurrentView('profile')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="21" height="21" viewBox="0 0 21 21" fill="none">
              <Path d="M13.8356 12.1142C15.663 10.9591 16.8812 8.88575 16.8812 6.51622C16.8812 2.90268 14.0097 0 10.471 0C6.93232 0 4.06077 2.9323 4.06077 6.54584C4.06077 8.88575 5.27901 10.9591 7.10635 12.1142C2.98757 13.3583 0 16.8829 0 21H1.74033C1.74033 16.7941 5.65608 13.3583 10.471 13.3583C15.2859 13.3583 19.2017 16.7941 19.2597 21L21 20.9704C20.971 16.8829 17.9544 13.3583 13.8356 12.1142ZM5.8011 6.54584C5.8011 3.90973 7.8895 1.77715 10.471 1.77715C13.0525 1.77715 15.1409 3.90973 15.1409 6.51622C15.1409 9.15233 13.0525 11.2849 10.471 11.2849C7.8895 11.2849 5.8011 9.18195 5.8011 6.54584Z" fill={currentView === 'profile' ? "#FC0B12" : "#FFF"}/>
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {/* SPLASH */}
      {splashVisible && <SplashScreen onFinish={() => setSplashVisible(false)} />}

      {/* AUTH MODAL */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </View>
  );
}
