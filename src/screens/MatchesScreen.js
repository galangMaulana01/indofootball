
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

  const [activeTab, setActiveTab] = useState(todayStr);

  useEffect(() => {
    fetchAllData(activeTab);
  }, []);

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

      const liveJson = await safeFetch(
        '/livescores/inplay?include=participants;league;venue'
      );
      setLiveMatches(liveJson?.data || []);

      if (targetTab !== 'LIVE') {
      const dateJson = await safeFetch(
        `/fixtures/date/${targetTab}?include=participants;league;scores;state`
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
              uri: benner?.image_benner,
            }}
            className="w-full h-full justify-end overflow-hidden"
            imageStyle={{ opacity: 0.9 }}
          >
            <View className="absolute inset-0 bg-black/40" />
            <View className="p-6 pb-10">
              <Text className="text-white text-xl font-black leading-tight">
                {benner?.desc}
              </Text>
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

  // FIX: deteksi status dari state
  const statusShort = match.state?.short_name || match.state?.state || 'NS';
  const isFinished = ['FT', 'AET', 'FT_PEN', 'CANCL', 'POSTP', 'AWARDED'].includes(statusShort);
  const hasScore = homeScore !== '-' && awayScore !== '-';

  const timeOrMinute = isLive
    ? `${match.minute || match.state?.minute || '?'}'`
    : isFinished
    ? statusShort  // Tampilkan "FT" di bawah skor
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
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Image
            source={{ uri: match.league?.image_path }}
            className="w-6 h-6 rounded-full mr-2"
            resizeMode="contain"
          />
          <Text className="text-xs text-white font-semibold">{match.league?.name}</Text>
        </View>
        {/* Bell icon tetap sama */}
      </View>

      {/* MAIN CONTENT */}
      <View className="flex-row justify-between items-center px-2">
        <View className="items-center flex-1">
          <Image source={{ uri: home?.image_path }} className="w-10 h-10 mb-1" resizeMode="contain" />
          <Text className="font-semibold text-white text-xs text-center" numberOfLines={1}>
            {home?.name}
          </Text>
        </View>

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
          ) : isFinished && hasScore ? (
            // FIX: Match sudah selesai — tampilkan skor final
            <View className="items-center flex-col justify-center">
              <Text className="text-3xl font-black text-white tracking-widest mb-1">
                {homeScore} - {awayScore}
              </Text>
              <Text className="text-gray-400 font-bold text-xs">{timeOrMinute}</Text>
            </View>
          ) : (
            <View className="items-center flex-col w-full justify-center">
              <Text className="text-white font-bold text-base mb-1">VS</Text>
              <Text className="text-gray-300 text-xs font-semibold">{timeOrMinute}</Text>
            </View>
          )}
        </View>

        <View className="items-center flex-1">
          <Image source={{ uri: away?.image_path }} className="w-10 h-10 mb-1" resizeMode="contain" />
          <Text className="font-semibold text-white text-xs text-center" numberOfLines={1}>
            {away?.name || 'Away'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
