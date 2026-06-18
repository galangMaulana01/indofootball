import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { activeSeasonIdGlobal } from './MatchesScreen'; // tetap pakai jika ada

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";

export default function MatchesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'live'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Live Matches
      const liveRes = await fetch(`${API_BASE_URL}/livescores/inplay?include=participants,league,venue`);
      const liveJson = await liveRes.json();
      setLiveMatches(liveJson?.data || []);

      // Fetch Today's Matches (bisa pakai fixtures dengan filter date)
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await fetch(`\( {API_BASE_URL}/fixtures/date/ \){today}?include=participants,league`);
      const todayJson = await todayRes.json();
      
      setMatches(todayJson?.data || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const filteredMatches = filter === 'live' 
    ? liveMatches 
    : filter === 'today' 
      ? matches 
      : [...liveMatches, ...matches];

  const getStatusColor = (status) => {
    if (status?.toLowerCase() === 'live' || status?.toLowerCase() === 'inplay') return 'text-red-500';
    if (status?.toLowerCase() === 'ft') return 'text-gray-400';
    return 'text-emerald-400';
  };

  return (
    <View className="flex-1 bg-equd w-full">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-white/10">
        <Text className="text-2xl font-black text-white tracking-tighter">IndoFootball</Text>
        <Text className="text-xs text-gray-400">Live & Jadwal Hari Ini</Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-3 pt-3 pb-2 border-b border-white/10 bg-equd">
        {['all', 'today', 'live'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            className={`flex-1 py-2 mx-1 rounded-xl items-center ${filter === tab ? 'bg-culos' : 'bg-white/5'}`}
          >
            <Text className={`font-semibold text-sm ${filter === tab ? 'text-white' : 'text-gray-400'}`}>
              {tab === 'all' ? 'Semua' : tab === 'today' ? 'Hari Ini' : 'LIVE'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FC0B12" />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : (
          <>
            {/* LIVE SECTION */}
            {liveMatches.length > 0 && (filter === 'all' || filter === 'live') && (
              <View className="mt-4 px-3">
                <Text className="text-red-500 font-bold text-sm tracking-widest px-1 mb-3">🔴 SEDANG BERLANGSUNG</Text>
                {liveMatches.map((match, idx) => (
                  <MatchCard key={idx} match={match} isLive={true} />
                ))}
              </View>
            )}

            {/* TODAY'S MATCHES */}
            {(filter === 'all' || filter === 'today') && (
              <View className="mt-4 px-3">
                <Text className="text-white font-bold text-sm tracking-widest px-1 mb-3">📅 PERTANDINGAN HARI INI</Text>
                {matches.length === 0 ? (
                  <Text className="text-gray-400 text-center py-10">Tidak ada pertandingan hari ini</Text>
                ) : (
                  matches.map((match, idx) => (
                    <MatchCard key={idx} match={match} />
                  ))
                )}
              </View>
            )}

            {filteredMatches.length === 0 && !loading && (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4 opacity-30">⚽</Text>
                <Text className="text-gray-400">Tidak ada data pertandingan</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Reusable Match Card Component
const MatchCard = ({ match, isLive = false }) => {
  const home = match.participants?.find(p => p.meta?.location === 'home') || match.participants?.[0];
  const away = match.participants?.find(p => p.meta?.location === 'away') || match.participants?.[1];

  return (
    <View className="bg-culos rounded-2xl p-4 mb-3 border border-white/10">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs text-gray-400">{match.league?.name || 'Liga'}</Text>
        <Text className={`text-xs font-bold ${isLive ? 'text-red-500' : getStatusColor(match.status)}`}>
          {isLive ? 'LIVE' : match.status || match.result_info || 'VS'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        {/* Home Team */}
        <View className="flex-row items-center flex-1">
          <Image 
            source={{ uri: home?.image_path || 'https://placehold.co/40' }} 
            className="w-8 h-8 rounded-full" 
          />
          <Text className="ml-3 font-semibold text-white flex-1" numberOfLines={1}>
            {home?.name || 'Home'}
          </Text>
        </View>

        {/* Score */}
        <View className="items-center px-4">
          <Text className="text-2xl font-black text-white">
            {match.scores?.ft?.home ?? '-'} : {match.scores?.ft?.away ?? '-'}
          </Text>
          {isLive && match.scores?.current && (
            <Text className="text-xs text-red-500 font-bold">
              {match.scores.current.home} - {match.scores.current.away}
            </Text>
          )}
        </View>

        {/* Away Team */}
        <View className="flex-row items-center flex-1 justify-end">
          <Text className="mr-3 font-semibold text-white text-right flex-1" numberOfLines={1}>
            {away?.name || 'Away'}
          </Text>
          <Image 
            source={{ uri: away?.image_path || 'https://placehold.co/40' }} 
            className="w-8 h-8 rounded-full" 
          />
        </View>
      </View>

      <Text className="text-center text-[10px] text-gray-500 mt-3">
        {match.venue?.name || ''} • {match.starting_at ? new Date(match.starting_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
      </Text>
    </View>
  );
};
