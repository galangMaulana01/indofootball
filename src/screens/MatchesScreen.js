import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { safeFetch } from '../utils/api';

export let activeSeasonIdGlobal = null;

// --- Icon SVG ---
const LiveIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="8" fill="#ef4444" /><Circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.3" /></Svg>
);

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
      const dayLabel = i === 0 ? 'Hari ini' : current.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateLabel = current.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      tabs.push({ dateString, dayLabel, dateLabel });
    }
    return tabs;
  };

  const fetchAllData = async (targetTab = activeTab) => {
    setLoading(true);
    setError(null);
    try {
      if (!benner) {
        const bennerJson = await safeFetch('/benner');
        setBenner(bennerJson?.data || bennerJson);
      }
      const liveJson = await safeFetch('/livescores/inplay?include=participants;league;venue');
      setLiveMatches(liveJson?.data || []);

      if (targetTab !== 'LIVE') {
        const dateJson = await safeFetch(`/fixtures/date/${targetTab}?include=participants;league;scores;state`);
        const matchesData = dateJson?.data || [];
        setMatches(matchesData);
        if (!activeSeasonIdGlobal && matchesData.length > 0) activeSeasonIdGlobal = matchesData[0].season_id || null;
      } else {
        setMatches([]); 
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(activeTab);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-equd w-full">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FC0B12" />}>
        {/* Banner Bersih */}
        <View className="w-full h-56 relative bg-culos">
          {benner?.image_benner ? (
            <ImageBackground source={{ uri: benner.image_benner }} className="w-full h-full justify-end overflow-hidden" imageStyle={{ opacity: 0.6 }}>
              <View className="absolute inset-0 bg-gradient-to-t from-equd to-transparent" />
              <View className="p-6">
                <Text className="text-white text-xl font-black leading-snug">{benner?.desc}</Text>
              </View>
            </ImageBackground>
          ) : (
            <View className="p-6 justify-end h-full"><Text className="text-gray-500 font-medium">Memuat info...</Text></View>
          )}
        </View>

        {/* Date Filter Sleek */}
        <View className="w-full bg-equd py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {generateDateTabs().map((tab) => {
              const isActive = activeTab === tab.dateString;
              return (
                <TouchableOpacity key={tab.dateString} onPress={() => { setActiveTab(tab.dateString); fetchAllData(tab.dateString); }} activeOpacity={0.7}
                  className={`px-4 py-2 rounded-lg mr-3 items-center justify-center ${isActive ? 'bg-white text-equd' : 'bg-culos'}`}>
                  <Text className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-equd' : 'text-gray-400'}`}>{tab.dayLabel}</Text>
                  <Text className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-equd/80' : 'text-gray-500'}`}>{tab.dateLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="p-5">
          {loading && !refreshing ? (
            <View className="items-center py-12"><ActivityIndicator size="large" color="#FC0B12" /></View>
          ) : error ? (
            <View className="items-center py-12">
              <Text className="text-gray-400 text-center mb-4">{error}</Text>
              <TouchableOpacity onPress={() => fetchAllData(activeTab)} className="bg-red-600 px-6 py-2.5 rounded-full"><Text className="text-white font-bold text-xs">Coba Lagi</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              {liveMatches.length > 0 && (activeTab === todayStr || activeTab === 'LIVE') && (
                <View className="mb-6">
                  <View className="flex-row items-center mb-4 gap-2 px-1"><LiveIcon /><Text className="text-white font-black text-[11px] tracking-widest uppercase">Sedang Berlangsung</Text></View>
                  {liveMatches.map((match) => <MatchCard key={match.id} match={match} isLive onPress={() => onMatchClick && onMatchClick(match.id)} />)}
                </View>
              )}
              {activeTab !== 'LIVE' && (
                <View className="mb-6">
                  <Text className="text-white font-black text-[11px] tracking-widest uppercase mb-4 px-1">{activeTab === todayStr ? "Jadwal Mendatang" : "Pertandingan"}</Text>
                  {matches.length === 0 ? (
                    <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-gray-500 text-xs font-medium">Tidak ada pertandingan.</Text></View>
                  ) : (
                    matches.map((match) => <MatchCard key={match.id} match={match} onPress={() => onMatchClick && onMatchClick(match.id)} />)
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const MatchCard = ({ match, isLive = false, onPress }) => {
  const participants = match.participants || [];
  const home = participants.find((p) => p.meta?.location === 'home') || participants[0];
  const away = participants.find((p) => p.meta?.location === 'away') || participants[1];

  const scores = Array.isArray(match.scores) ? match.scores : [];
  const homeScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals ?? '-';
  const awayScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals ?? '-';

  const statusShort = match.state?.short_name || match.state?.state || 'NS';
  const isFinished = ['FT', 'AET', 'FT_PEN', 'CANCL', 'POSTP', 'AWARDED'].includes(statusShort);
  const hasScore = homeScore !== '-' && awayScore !== '-';

  const timeOrMinute = isLive ? `${match.minute || match.state?.minute || '?'}'` : isFinished ? statusShort : match.starting_at ? new Date(match.starting_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'VS';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="bg-culos rounded-xl p-2 mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Image source={{ uri: match.league?.image_path }} className="w-6 h-6 rounded mr-2" resizeMode="contain" />
          <Text className="text-sm text-gray-200 font-bold tracking-wider">{match.league?.name}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center px-1">
        <View className="items-center flex-1">
          <Image source={{ uri: home?.image_path }} className="w-10 h-10 mb-2" resizeMode="contain" />
          <Text className="font-bold text-white text-xs text-center leading-tight" numberOfLines={2}>{home?.name}</Text>
        </View>

        <View className="items-center justify-center px-4 w-1/3">
          {isLive ? (
            <>
              <Text className="text-xl font-black text-white tracking-widest">{homeScore} - {awayScore}</Text>
              <Text className="text-red-500 font-black text-xs mb-1">{timeOrminute}</Text>
            </>
          ) : isFinished && hasScore ? (
            <>
              <Text className="text-xl font-black text-white tracking-widest">{homeScore} - {awayScore}</Text>
              <Text className="text-gray-300 font-bold text-xs mb-1">{timeOrMinute}</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-black text-xl mb-1">VS</Text>
              <Text className="text-gray-400 text-[10px] font-bold">{timeOrMinute}</Text>
            </>
          )}
        </View>

        <View className="items-center flex-1">
          <Image source={{ uri: away?.image_path }} className="w-10 h-10 mb-2" resizeMode="contain" />
          <Text className="font-bold text-white text-xs text-center leading-tight" numberOfLines={2}>{away?.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
