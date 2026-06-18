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
import TopScorersScreen from './src/screens/TopScorersScreen';
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

  const isMainView = currentView === 'matches' || currentView === 'standings' || currentView === 'profile' || currentView === 'topscorers';

  return (
    <SafeAreaView className="flex-1 bg-equd">
      <StatusBar barStyle="light-content" />






{/* HEADER */}
{isMainView && (
  <View className="px-4 py-4 flex-row items-center justify-between z-40">

    {user ? (
      /* KIRI: Profile (Saat Login) */
      <TouchableOpacity
        onPress={() => setCurrentView('profile')}
        className="flex-row items-center gap-2"
      >
        <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center overflow-hidden">
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-white font-bold text-sm">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <View className="flex-col items-start">
          <Text className="text-sm font-black text-white">Welcomeback,</Text>
          <Text className="text-sm font-semibold text-gray-200">
            {user.displayName?.split(" ")[0] || 'User'}
          </Text>
        </View>
      </TouchableOpacity>
    ) : (
      /* KIRI: Icon Profile Pengganti (Saat Belum Login) agar layout kiri-kanan tetap aktif */
      <View className="p-3 bg-white/10 rounded-full">
        <Svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <Path d="M13.8356 12.1142C15.663 10.9591 16.8812 8.88575 16.8812 6.51622C16.8812 2.90268 14.0097 0 10.471 0C6.93232 0 4.06077 2.9323 4.06077 6.54584C4.06077 8.88575 5.27901 10.9591 7.10635 12.1142C2.98757 13.3583 0 16.8829 0 21H1.74033C1.74033 16.7941 5.65608 13.3583 10.471 13.3583C15.2859 13.3583 19.2017 16.7941 19.2597 21L21 20.9704C20.971 16.8829 17.9544 13.3583 13.8356 12.1142ZM5.8011 6.54584C5.8011 3.90973 7.8895 1.77715 10.471 1.77715C13.0525 1.77715 15.1409 3.90973 15.1409 6.51622C15.1409 9.15233 13.0525 11.2849 10.471 11.2849C7.8895 11.2849 5.8011 9.18195 5.8011 6.54584Z" fill="white"/>
        </Svg>
      </View>
    )}

    {/* KANAN: Notifikasi atau Tombol Masuk */}
    {user ? (
      /* KANAN: Notifikasi (Saat Login) */
      <TouchableOpacity onPress={() => console.log('Buka Notifikasi')}>
        <View className="bg-white/10 p-3 rounded-full">
          <Svg width="18" height="18" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <Path fill-rule="evenodd" clip-rule="evenodd" d="M8.19467 0H8.1262C4.89182 0 1.92628 2.35402 1.63857 5.47055C1.61939 5.6935 1.60631 5.92131 1.59786 6.16673L1.58604 6.74049L1.5837 7.25492L1.59814 7.19628C1.46466 7.84916 1.15704 8.45475 0.707073 8.94957L0.642589 9.03278C0.257315 9.61985 0.035945 10.2994 0.00167969 11.0011L0.000867783 11.2305C-0.0188017 12.1534 0.296466 13.0666 0.889564 13.7919C1.69386 14.6437 2.735 15.1518 3.85244 15.2597C6.7104 15.571 9.60191 15.571 12.4678 15.2588C13.5776 15.1564 14.6219 14.6467 15.3925 13.8264C15.9743 13.1282 16.2918 12.2903 16.3191 11.4227L16.32 11.0343C16.2882 10.3018 16.0654 9.62162 15.6755 9.03709L15.6163 8.96081L15.4716 8.79013C15.1465 8.38283 14.9091 7.91365 14.774 7.41181L14.7312 7.23163L14.7224 7.04266C14.7197 6.95767 14.7184 6.86342 14.718 6.74571L14.7178 6.09754C14.7156 5.84959 14.7083 5.67328 14.6912 5.4748C14.3937 2.35238 11.4273 0 8.19467 0ZM8.1262 1.34367H8.19467C10.7843 1.34367 13.1466 3.21702 13.3735 5.59796C13.3869 5.75427 13.3929 5.90339 13.3947 6.12492L13.3973 6.99606C13.4002 7.13538 13.4056 7.25123 13.415 7.3816L13.4273 7.47084L13.4896 7.73641C13.6742 8.43893 14.0058 9.09431 14.4621 9.65934L14.5945 9.81505L14.5799 9.79063C14.833 10.1701 14.9772 10.6105 14.9974 11.0646L14.9967 11.222C15.012 11.8537 14.8032 12.454 14.408 12.9294C13.886 13.4834 13.1396 13.8476 12.3373 13.9218C9.5546 14.2248 6.75771 14.2248 3.98561 13.9228C3.17455 13.8445 2.42766 13.48 1.87554 12.897C1.51763 12.4565 1.31106 11.8582 1.32403 11.2449L1.32418 11.0343L1.34095 10.8509C1.38134 10.544 1.48357 10.2329 1.64203 9.94653L1.72239 9.81312C2.31148 9.14851 2.71577 8.34035 2.89383 7.46939L2.90764 7.33283L2.91391 6.4476L2.92932 5.99849C2.93631 5.85681 2.94526 5.72219 2.95649 5.59171C3.17571 3.21713 5.53585 1.34367 8.1262 1.34367ZM1.72239 9.81312C1.70814 9.8292 1.69378 9.84519 1.67932 9.86109L1.72662 9.8061L1.72239 9.81312ZM10.6636 17.0354C10.3789 16.8028 9.96242 16.8486 9.73336 17.1377C9.63409 17.263 9.51915 17.3754 9.39126 17.4722C8.95752 17.8135 8.41624 17.9654 7.87814 17.9011C7.34083 17.8369 6.8524 17.5626 6.521 17.1402C6.29329 16.85 5.87701 16.8022 5.59121 17.0334C5.3054 17.2646 5.2583 17.6873 5.486 17.9775C6.03552 18.6779 6.84075 19.1301 7.72349 19.2356C8.60545 19.341 9.49353 19.0917 10.1921 18.5419C10.3994 18.3851 10.5951 18.1937 10.7644 17.98C10.9935 17.6909 10.9484 17.268 10.6636 17.0354Z" fill="white"/>
          </Svg>
        </View>
      </TouchableOpacity>
    ) : (
      /* KANAN: Tombol Masuk (Saat Belum Login) */
      <TouchableOpacity
        onPress={() => setAuthModalVisible(true)}
        className="bg-red-600 px-4 py-2 rounded-xl"
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

{currentView === 'topscorers' && (
  <TopScorersScreen />
)}

      {/* BOTTOM NAV */}
      {isMainView && (
        <View className="absolute bottom-0 left-0 w-full bg-culos flex-row pb-6">

          {/* Jadwal */}
          <TouchableOpacity
            onPress={() => setCurrentView('matches')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <Path d="M7.99105 0.827471C9.39474 -0.232085 11.3621 -0.27409 12.8089 0.701458L12.9868 0.827471L19.7168 5.94254C20.4573 6.48754 20.9116 7.29717 20.9889 8.17821L21 8.38928V16.9046C21 19.0993 19.1752 20.8845 16.8884 21H14.6889C13.6378 20.98 12.7879 20.203 12.7105 19.2264L12.6995 19.0783V16.0761C12.6995 15.7495 12.4442 15.4775 12.1026 15.4239L12.0032 15.4134H9.051C8.69842 15.4239 8.41105 15.6655 8.36684 15.9805L8.35579 16.0761V19.0689C8.35579 19.1308 8.34363 19.2043 8.33368 19.2568L8.32263 19.2789L8.31047 19.3513C8.17895 20.245 7.40526 20.9265 6.44368 20.9905L6.3 21H4.32158C2.01158 21 0.121579 19.2789 0 17.1146V8.38928C0.00994737 7.49564 0.42 6.66606 1.10526 6.0885L7.99105 0.827471ZM12.0253 1.97209C11.1853 1.33152 9.99158 1.30107 9.10737 1.85657L8.94047 1.97209L2.22047 7.11865C1.83474 7.39063 1.60263 7.80017 1.54737 8.23072L1.53521 8.39873V16.9046C1.53521 18.3012 2.68468 19.4458 4.14474 19.5299H6.3C6.54316 19.5299 6.75316 19.3734 6.78521 19.1529L6.80842 18.9638L6.81947 18.9103V16.0761C6.81947 14.9524 7.72579 14.0388 8.88632 13.9538H12.0032C13.1847 13.9538 14.1463 14.8159 14.2358 15.9185V19.0783C14.2358 19.2988 14.4016 19.4889 14.6226 19.5299H16.6773C18.1584 19.5299 19.3631 18.4493 19.4515 17.0726L19.4637 16.9046V8.39873C19.4515 7.94824 19.2537 7.52714 18.9111 7.21316L18.7674 7.0966L12.0253 1.97209Z" fill={currentView === 'matches' ? "#FC0B12" : "#FFF"}/>
            </Svg>
          </TouchableOpacity>

          {/* Klasemen */}
          <TouchableOpacity
            onPress={() => setCurrentView('standings')}
            className="flex-1 py-3 items-center gap-1"
          >
            <Svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <Path d="M23.8528 7.17L17.6898 0.18C17.5713 0.06 17.4231 0 17.2454 0H6.75648C6.5787 0 6.43055 0.06 6.31203 0.18L0.14907 7.17C-0.0287079 7.38 -0.0583376 7.68 0.11944 7.92L2.84537 11.76C3.02314 12.03 3.3787 12.09 3.61574 11.91C3.64537 11.91 3.64537 11.88 3.675 11.88L5.57129 10.5L5.51203 18.6C5.51203 19.23 5.74907 19.86 6.19351 20.31C6.63796 20.76 7.26018 21 7.8824 21H16.1194C16.7417 21 17.3639 20.76 17.8083 20.31C18.2528 19.86 18.4898 19.23 18.4898 18.6L18.4305 10.5L20.3268 11.88C20.5639 12.09 20.9194 12.06 21.1268 11.82C21.1268 11.79 21.1565 11.79 21.1565 11.76L23.8824 7.92C24.0602 7.68 24.0306 7.38 23.8528 7.17ZM14.4009 1.2C14.2824 2.67 13.1565 4.86 12.0009 4.86C10.8454 4.86 9.71944 2.67 9.60092 1.2H14.4009ZM20.5343 10.56L18.1639 8.82C17.9861 8.7 17.7491 8.67 17.5713 8.79C17.3639 8.88 17.2454 9.09 17.2454 9.33L17.3046 18.6C17.3046 18.9 17.1861 19.23 16.9787 19.44C16.7417 19.68 16.4454 19.8 16.1194 19.8H7.8824C7.55648 19.8 7.26018 19.68 7.02314 19.44C6.81574 19.23 6.69722 18.9 6.69722 18.6L6.75648 9.33C6.75648 9.09 6.63796 8.88 6.43055 8.79C6.34166 8.73 6.25277 8.73 6.16388 8.73C6.04537 8.73 5.92685 8.76 5.83796 8.82L3.46759 10.56L1.36388 7.62L7.02314 1.2H8.41574C8.53425 3.03 9.89722 6.06 12.0009 6.06C14.1046 6.06 15.4676 3.03 15.5861 1.2H16.9787L22.638 7.62L20.5343 10.56Z" fill={currentView === 'standings' ? '#FC0B12' : '#FFF'} />
            </Svg>

          </TouchableOpacity>

          {/* Profil */}
          <TouchableOpacity
            onPress={() => setCurrentView('profile')}
            className="flex-1 py-3 items-center gap-1"
          >

            <Svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <Path d="M13.8356 12.1142C15.663 10.9591 16.8812 8.88575 16.8812 6.51622C16.8812 2.90268 14.0097 0 10.471 0C6.93232 0 4.06077 2.9323 4.06077 6.54584C4.06077 8.88575 5.27901 10.9591 7.10635 12.1142C2.98757 13.3583 0 16.8829 0 21H1.74033C1.74033 16.7941 5.65608 13.3583 10.471 13.3583C15.2859 13.3583 19.2017 16.7941 19.2597 21L21 20.9704C20.971 16.8829 17.9544 13.3583 13.8356 12.1142ZM5.8011 6.54584C5.8011 3.90973 7.8895 1.77715 10.471 1.77715C13.0525 1.77715 15.1409 3.90973 15.1409 6.51622C15.1409 9.15233 13.0525 11.2849 10.471 11.2849C7.8895 11.2849 5.8011 9.18195 5.8011 6.54584Z" fill={currentView === 'profile' ? "#FC0B12" : "#FFF"}/>
            </Svg>

          </TouchableOpacity>



{/* Top Scorers */}
<TouchableOpacity
  onPress={() => setCurrentView('topscorers')}
  className="flex-1 py-3 items-center gap-1"
>
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill={currentView === 'topscorers' ? "#FC0B12" : "#FFF"} />
  </Svg>
  <Text className={`text-[10px] ${currentView === 'topscorers' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>Top Skor</Text>
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
