import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg'; // FIX: Tambah Rect untuk icon kalender
import { safeFetch } from '../utils/api';

export let activeSeasonIdGlobal = null;

export default function MatchesScreen({ onMatchClick }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [error, setError] = useState(null);
  const [benner, setBenner] = useState(null);
  
  // State untuk melacak tab aktif (bisa berupa tanggal 'YYYY-MM-DD' atau 'LIVE')
  const [activeTab, setActiveTab] = useState(todayStr);

  useEffect(() => {
    fetchAllData(activeTab);
  }, []);

  // Helper untuk generate list tanggal secara dinamis (-3 hari s/d +4 hari dari hari ini)
  const generateDateTabs = () => {
    const tabs = [];
    const baseDate = new Date();
    
    for (let i = -3; i <= 4; i++) {
      const current = new Date();
      current.setDate(baseDate.getDate() + i);
      
      const dateString = current.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : current.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      tabs.push({ dateString, dayLabel, dateLabel });
    }
    return tabs;
  };

  const fetchAllData = async (targetTab = activeTab) => {
    setLoading(true);
    setError(null);
    try {
      // Ambil banner iklan/berita jika belum ada
      if (!benner) {
        const bennerJson = await safeFetch('/benner');
        setBenner(bennerJson?.data || bennerJson);
      }

      // Selalu ambil live matches untuk update live score indicator
      const liveJson = await safeFetch(
        '/livescores/inplay?include=participants;league;venue'
      );
      setLiveMatches(liveJson?.data || []);

      // Jika tab yang dipilih bukan tab khusus 'LIVE', tarik data fixture berdasarkan tanggal tersebut
      if (targetTab !== 'LIVE') {
        const dateJson = await safeFetch(
          `/fixtures/date/${targetTab}?include=participants;league`
        );
        const matchesData = dateJson?.data || [];
        setMatches(matchesData);

        if (!activeSeasonIdGlobal && matchesData.length > 0) {
          activeSeasonIdGlobal = matchesData[0].season_id || null;
        }
      } else {
        setMatches([]); // Kosongkan jadwal tanding jika fokus di tab LIVE saja
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
    fetchAllData(tabValue);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(activeTab);
    setRefreshing(false);
  };

  const SectionHeader = ({ title, showDot }) => (
    <View className="flex-row justify-between items-center px-4 mt-6 mb-4">
      <View className="flex-row items-center">
        {showDot && <View className="w-2 h-2 rounded-full bg-red-600 mr-2" />}
        <Text className="text-white font-black text-sm tracking-widest uppercase">
          {title}
        </Text>
      </View>
      <TouchableOpacity>
        <Text className="text-green-500 text-xs font-semibold">View all {'>'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-equd w-full">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* HERO BANNER - Top News */}
        <View className="w-full h-64 relative">
          <ImageBackground
            source={{
              uri: benner?.image_benner || 'https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=1000',
            }}
            className="w-full h-full justify-end overflow-hidden"
            imageStyle={{ opacity: 0.8 }}
          >
            <View className="absolute inset-0 bg-black/40" />
            <View className="p-6 pb-10">
              <Text className="text-yellow-500 text-xs font-bold mb-2 tracking-widest">
                TOP NEWS
              </Text>
              <Text className="text-white text-3xl font-black leading-tight">
                {benner?.title_benner || 'Mbappé double\nsecures Madrid win\nat Bernabéu 🔥'}
              </Text>
              <Text className="text-gray-300 text-xs mt-3">2h ago</Text>
            </View>
          </ImageBackground>
        </View>

        {/* DYNAMIC DATE FILTER SLIDER (Sesuai Gambar Referensi) */}
        <View className="w-full bg-transparent py-4 border-b border-white/5 flex-row items-center px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-grow-1"
          >
            {/* Tab Live */}
            <TouchableOpacity
              onPress={() => handleTabChange('LIVE')}
              activeOpacity={0.7}
              className={`px-4 py-2.5 rounded-full justify-center items-center mr-3 h-12 ${
                activeTab === 'LIVE' ? 'bg-white/10 border border-white/10' : 'bg-transparent'
              }`}
            >
              <Text className="text-white font-black text-sm px-1">Live</Text>
            </TouchableOpacity>

            {/* Tab Deretan Tanggal */}
            {generateDateTabs().map((tab) => {
              const isActive = activeTab === tab.dateString;
              return (
                <TouchableOpacity
                  key={tab.dateString}
                  onPress={() => handleTabChange(tab.dateString)}
                  activeOpacity={0.7}
                  className={`px-3 py-1 rounded-xl items-center justify-center min-w-[64px] mr-2 h-12 ${
                    isActive ? 'bg-white/10 border border-white/10' : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-xs font-black ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {tab.dayLabel}
                  </Text>
                  <Text className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tab.dateLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading && !refreshing ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : error ? (
          <View className="items-center py-20 px-6">
            <Text className="text-red-500 text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => fetchAllData(activeTab)}
              className="mt-4 bg-red-600 px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-bold">Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-10">
            {/* LIVE NOW SECTION - Hanya muncul jika ada pertandingan live & pengguna tidak di filter tanggal masa depan/lalu */}
            {liveMatches.length > 0 && (activeTab === todayStr || activeTab === 'LIVE') && (
              <>
                <SectionHeader title="Live Now" showDot />
                <View className="px-4">
                  {liveMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isLive
                      onPress={() => onMatchClick && onMatchClick(match.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* MATCHES LIST SECTION */}
            {activeTab !== 'LIVE' && (
              <>
                <SectionHeader title={activeTab === todayStr ? "Upcoming Matches" : "Matches"} />
                <View className="px-4">
                  {matches.length === 0 ? (
                    <Text className="text-gray-500 text-center py-6">
                      Tidak ada pertandingan untuk tanggal ini
                    </Text>
                  ) : (
                    matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onPress={() => onMatchClick && onMatchClick(match.id)}
                      />
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const MatchCard = ({ match, isLive = false, onPress }) => {
  const participants = match.participants || [];
  const home = participants.find((p) => p.meta?.location === 'home') || participants[0];
  const away = participants.find((p) => p.meta?.location === 'away') || participants[1];

  const scores = Array.isArray(match.scores) ? match.scores : [];
  const homeScore =
    scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'home')
      ?.score?.goals ?? '-';
  const awayScore =
    scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'away')
      ?.score?.goals ?? '-';

  const timeOrMinute = isLive
    ? `${match.minute || match.state?.minute || '78'}'`
    : match.starting_at
    ? new Date(match.starting_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : 'VS';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-culos rounded-xl p-3 mb-3 relative"
    >
      {/* HEADER: League & Bell Icon */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Image
            source={{ uri: match.league?.image_path }}
            className="w-6 h-6 rounded-full mr-2"
            resizeMode="contain"
          />
          <Text className="text-xs text-white font-semibold">{match.league?.name || 'League'}</Text>
        </View>

        <View>
          <Svg width="18" height="18" viewBox="0 0 17 20" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.19467 0H8.1262C4.89182 0 1.92628 2.35402 1.63857 5.47055C1.61939 5.6935 1.60631 5.92131 1.59786 6.16673L1.58604 6.74049L1.5837 7.25492L1.59814 7.19628C1.46466 7.84916 1.15704 8.45475 0.707073 8.94957L0.642589 9.03278C0.257315 9.61985 0.035945 10.2994 0.00167969 11.0011L0.000867783 11.2305C-0.0188017 12.1534 0.296466 13.0666 0.889564 13.7919C1.69386 14.6437 2.735 15.1518 3.85244 15.2597C6.7104 15.571 9.60191 15.571 12.4678 15.2588C13.5776 15.1564 14.6219 14.6467 15.3925 13.8264C15.9743 13.1282 16.2918 12.2903 16.3191 11.4227L16.32 11.0343C16.2882 10.3018 16.0654 9.62162 15.6755 9.03709L15.6163 8.96081L15.4716 8.79013C15.1465 8.38283 14.9091 7.91365 14.774 7.41181L14.7312 7.23163L14.7224 7.04266C14.7197 6.95767 14.7184 6.86342 14.718 6.74571L14.7178 6.09754C14.7156 5.84959 14.7083 5.67328 14.6912 5.4748C14.3937 2.35238 11.4273 0 8.19467 0ZM8.1262 1.34367H8.19467C10.7843 1.34367 13.1466 3.21702 13.3735 5.59796C13.3869 5.75427 13.3929 5.90339 13.3947 6.12492L13.3973 6.99606C13.4002 7.13538 13.4056 7.25123 13.415 7.3816L13.4273 7.47084L13.4896 7.73641C13.6742 8.43893 14.0058 9.09431 14.4621 9.65934L14.5945 9.81505L14.5799 9.79063C14.833 10.1701 14.9772 10.6105 14.9974 11.0646L14.9967 11.222C15.012 11.8537 14.8032 12.454 14.408 12.9294C13.886 13.4834 13.1396 13.8476 12.3373 13.9218C9.5546 14.2248 6.75771 14.2248 3.98561 13.9228C3.17455 13.8445 2.42766 13.48 1.87554 12.897C1.51763 12.4565 1.31106 11.8582 1.32403 11.2449L1.32418 11.0343L1.34095 10.8509C1.38134 10.544 1.48357 10.2329 1.64203 9.94653L1.72239 9.81312C2.31148 9.14851 2.71577 8.34035 2.89383 7.46939L2.90764 7.33283L2.91391 6.4476L2.92932 5.99849C2.93631 5.85681 2.94526 5.72219 2.95649 5.59171C3.17571 3.21713 5.53585 1.34367 8.1262 1.34367ZM1.72239 9.81312C1.70814 9.8292 1.69378 9.84519 1.67932 9.86109L1.72662 9.8061L1.72239 9.81312ZM10.6636 17.0354C10.3789 16.8028 9.96242 16.8486 9.73336 17.1377C9.63409 17.263 9.51915 17.3754 9.39126 17.4722C8.95752 17.8135 8.41624 17.9654 7.87814 17.9011C7.34083 17.8369 6.8524 17.5626 6.521 17.1402C6.29329 16.85 5.87701 16.8022 5.59121 17.0334C5.3054 17.2646 5.2583 17.6873 5.486 17.9775C6.03552 18.6779 6.84075 19.1301 7.72349 19.2356C8.60545 19.341 9.49353 19.0917 10.1921 18.5419C10.3994 18.3851 10.5951 18.1937 10.7644 17.98C10.9935 17.6909 10.9484 17.268 10.6636 17.0354Z"
              fill="white"
            />
          </Svg>
        </View>
      </View>

      {/* MAIN CONTENT: Teams & Score */}
      <View className="flex-row justify-between items-center px-2">
        {/* HOME TEAM */}
        <View className="items-center flex-1">
          <Image
            source={{ uri: home?.image_path }}
            className="w-12 h-12 mb-1"
            resizeMode="contain"
          />
          <Text className="font-semibold text-white text-xs text-center" numberOfLines={1}>
            {home?.name || 'Home'}
          </Text>
        </View>

        {/* SCORE & TIME */}
        <View className="items-center justify-center px-4 w-1/3">
          {isLive ? (
            <View className="items-center flex-col justify-center">
              <View className="bg-red-600 px-2 py-0.5 rounded-[4px] mb-2">
                <Text className="text-white text-[9px] font-black tracking-wider">LIVE</Text>
              </View>
              <Text className="text-3xl font-black text-white tracking-widest mb-1">
                {homeScore} - {awayScore}
              </Text>
              <Text className="text-green-500 font-bold text-xs">{timeOrMinute}</Text>
            </View>
          ) : (
            <View className="items-center flex-col w-full justify-center">
              <Text className="text-white font-bold text-base mb-1">VS</Text>
              <Text className="text-gray-300 text-xs font-semibold">{timeOrMinute}</Text>
            </View>
          )}
        </View>

        {/* AWAY TEAM */}
        <View className="items-center flex-1">
          <Image
            source={{ uri: away?.image_path || 'https://placehold.co/60' }}
            className="w-12 h-12 mb-1"
            resizeMode="contain"
          />
          <Text className="font-semibold text-white text-xs text-center" numberOfLines={1}>
            {away?.name || 'Away'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
