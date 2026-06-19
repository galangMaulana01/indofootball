// src/screens/TopScorersScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { safeFetch } from '../utils/api';
// FIX: Import activeSeasonIdGlobal — sekarang sudah di-export dari MatchesScreen
import { activeSeasonIdGlobal } from './MatchesScreen';

const TARGET_LEAGUE_ID = 501;

export default function TopScorersScreen({ onPlayerClick }) {
  const [loading, setLoading] = useState(true);
  const [topScorers, setTopScorers] = useState([]);
  const [leagueName, setLeagueName] = useState('Top Scorers');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopScorers();
  }, []);

  const fetchTopScorers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil league info untuk nama header & fallback season ID
      const leagueJson = await safeFetch(`/leagues/${TARGET_LEAGUE_ID}`);
      setLeagueName(leagueJson?.data?.name || 'Top Scorers Liga');

      // Resolve season ID: global dulu, fallback ke currentSeason dari league
      let seasonId = activeSeasonIdGlobal;

      if (!seasonId) {
        seasonId =
          leagueJson?.data?.currentSeason?.id ||
          leagueJson?.data?.current_season_id ||
          null;
      }

      if (!seasonId) {
        throw new Error('Tidak bisa mendapatkan season ID aktif');
      }

      // FIX KRITIS: Template literal sebelumnya rusak: `\( {API_BASE_URL}/topscorers/seasons/ \){seasonId}`
      // → sekarang menggunakan safeFetch dengan template literal yang benar
      const json = await safeFetch(`/topscorers/seasons/${seasonId}`);

      const scorersData = json?.data || [];

      // FIX: SportMonks v3 menyimpan gol di scorer.total.goals, bukan scorer.goals langsung
      const sortedScorers = [...scorersData].sort(
        (a, b) => (b.total?.goals ?? b.goals ?? 0) - (a.total?.goals ?? a.goals ?? 0)
      );

      setTopScorers(sortedScorers);
    } catch (err) {
      console.error('Error fetching top scorers:', err);
      setError(err.message || 'Gagal memuat data top scorers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-equd w-full pb-20">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-white/10">
        <Text className="text-2xl font-black text-white tracking-tighter">Top Skor</Text>
        <Text className="text-xs text-gray-400">{leagueName}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : error ? (
          <View className="items-center py-20 px-6">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={fetchTopScorers}
              className="bg-red-600 px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-bold">Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : topScorers.length === 0 ? (
          <View className="items-center py-20">
            <Text className="text-5xl mb-3 opacity-20">🥇</Text>
            <Text className="text-gray-400 font-medium text-sm">Data Top Scorers belum tersedia</Text>
          </View>
        ) : (
          <View className="px-3 pt-4 pb-8">
            {/* Table Header */}
            <View className="flex-row items-center bg-culos py-3 px-4 rounded-t-xl mb-1">
              <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">#</Text>
              <Text className="flex-1 text-[10px] font-bold text-gray-400 uppercase pl-2">Pemain</Text>
              <Text className="w-12 text-center text-[10px] font-bold text-gray-400 uppercase">Tim</Text>
              <Text className="w-10 text-center text-[10px] font-bold text-gray-400 uppercase">Gol</Text>
              <Text className="w-10 text-center text-[10px] font-bold text-gray-400 uppercase">Assist</Text>
            </View>

            <View className="overflow-hidden border-2 border-culos rounded-b-xl">
              {topScorers.map((scorer, idx) => {
                const player = scorer.player || {};
                const team = scorer.team || {};

                // FIX: Ambil dari scorer.total.goals / scorer.total.assists (SportMonks v3)
                // dengan fallback ke scorer.goals / scorer.assists untuk kompatibilitas
                const goals = scorer.total?.goals ?? scorer.goals ?? 0;
                const assists = scorer.total?.assists ?? scorer.assists ?? 0;

                return (
                  <TouchableOpacity
                    key={scorer.player_id || idx}
                    onPress={() => onPlayerClick && onPlayerClick(player.id)}
                    className={`flex-row items-center py-3 px-4 bg-equd ${
                      idx !== topScorers.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <Text className="w-8 text-center text-xs font-bold text-gray-400">
                      {idx + 1}
                    </Text>

                    <View className="flex-1 flex-row items-center gap-3 pl-1">
                      <View className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                        <Image
                          source={{ uri: player.image_path || 'https://placehold.co/32' }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                          {player.name || scorer.player_name || 'Unknown'}
                        </Text>
                        <Text className="text-[10px] text-gray-400" numberOfLines={1}>
                          {team.name || ''}
                        </Text>
                      </View>
                    </View>

                    <View className="w-12 items-center">
                      <Text className="text-lg font-black text-white">{goals}</Text>
                    </View>

                    <View className="w-10 items-center">
                      <Text className="text-sm font-medium text-gray-300">{assists}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-center text-[10px] text-gray-500 mt-6">
              Data dari SportMonks API
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
