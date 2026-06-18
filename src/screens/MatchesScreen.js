import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { safeFetch } from '../utils/api'; // ✅ import utility yang sudah dibuat

const API_BASE_URL = 'https://sportmonks-tawny.vercel.app';

// 🔹 Fungsi helper untuk mendapatkan warna status
const getStatusColor = (status) => {
  if (!status) return 'text-gray-400';
  const s = status.toLowerCase();
  if (s === 'live' || s === 'inplay' || s === 'in play') return 'text-red-500';
  if (s === 'ft' || s === 'finished' || s === 'full time') return 'text-gray-400';
  return 'text-emerald-400';
};

export default function MatchesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'live'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Live Matches (gunakan safeFetch)
      const liveJson = await safeFetch(
        '/livescores/inplay?include=participants,league,venue'
      );
      setLiveMatches(liveJson?.data || []);

      // 2. Fetch Today's Matches
      const today = new Date().toISOString().split('T')[0];
      const todayJson = await safeFetch(
        `/fixtures/date/${today}?include=participants,league`
      );
      setMatches(todayJson?.data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Gabungkan data berdasarkan filter
  const filteredMatches =
    filter === 'live'
      ? liveMatches
      : filter === 'today'
      ? matches
      : [...liveMatches, ...matches];

  return (
    <View className="flex-1 bg-equd w-full">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-white/10">
        <Text className="text-2xl font-black text-white tracking-tighter">
          IndoFootball
        </Text>
        <Text className="text-xs text-gray-400">Live & Jadwal Hari Ini</Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-3 pt-3 pb-2 border-b border-white/10 bg-equd">
        {['all', 'today', 'live'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            className={`flex-1 py-2 mx-1 rounded-xl items-center ${
              filter === tab ? 'bg-culos' : 'bg-white/5'
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                filter === tab ? 'text-white' : 'text-gray-400'
              }`}
            >
              {tab === 'all' ? 'Semua' : tab === 'today' ? 'Hari Ini' : 'LIVE'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FC0B12"
          />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : error ? (
          <View className="items-center py-20 px-6">
            <Text className="text-red-500 text-center">{error}</Text>
            <TouchableOpacity
              onPress={fetchAllData}
              className="mt-4 bg-red-600 px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-bold">Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* LIVE SECTION */}
            {liveMatches.length > 0 && (filter === 'all' || filter === 'live') && (
              <View className="mt-4 px-3">
                <Text className="text-red-500 font-bold text-sm tracking-widest px-1 mb-3">
                  🔴 SEDANG BERLANGSUNG
                </Text>
                {liveMatches.map((match, idx) => (
                  <MatchCard key={idx} match={match} isLive />
                ))}
              </View>
            )}

            {/* TODAY'S MATCHES */}
            {(filter === 'all' || filter === 'today') && (
              <View className="mt-4 px-3">
                <Text className="text-white font-bold text-sm tracking-widest px-1 mb-3">
                  📅 PERTANDINGAN HARI INI
                </Text>
                {matches.length === 0 ? (
                  <Text className="text-gray-400 text-center py-10">
                    Tidak ada pertandingan hari ini
                  </Text>
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

// ---------------------
// Komponen MatchCard (dipisah agar reusable)
// ---------------------
const MatchCard = ({ match, isLive = false }) => {
  // Cari home & away dengan aman
  const participants = match.participants || [];
  const home = participants.find((p) => p.meta?.location === 'home') || participants[0];
  const away = participants.find((p) => p.meta?.location === 'away') || participants[1];

  // Ambil skor dengan fallback
  const homeScore = match.scores?.ft?.home ?? match.scores?.current?.home ?? '-';
  const awayScore = match.scores?.ft?.away ?? match.scores?.current?.away ?? '-';

  return (
    <View className="bg-culos rounded-2xl p-4 mb-3 border border-white/10">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs text-gray-400">{match.league?.name || 'Liga'}</Text>
        <Text
          className={`text-xs font-bold ${
            isLive ? 'text-red-500' : getStatusColor(match.status)
          }`}
        >
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
            {homeScore} : {awayScore}
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
        {match.venue?.name || ''}
        {match.starting_at
          ? ` • ${new Date(match.starting_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : ''}
      </Text>
    </View>
  );
};
