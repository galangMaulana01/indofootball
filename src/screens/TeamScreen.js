import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { safeFetch } from '../utils/api';
// FIX: Import activeSeasonIdGlobal — sekarang sudah di-export dari MatchesScreen
import { activeSeasonIdGlobal } from './MatchesScreen';

const TARGET_LEAGUE_ID = 501;

export default function TeamScreen({ teamId, goBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState({});
  const [squadPositions, setSquadPositions] = useState([]);

  useEffect(() => {
    loadTeamAndSquadData();
  }, [teamId]);

  const loadTeamAndSquadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Resolve season ID — coba dari global, fallback ke league endpoint
      let seasonId = activeSeasonIdGlobal;

      if (!seasonId) {
        const leagueJson = await safeFetch(`/leagues/${TARGET_LEAGUE_ID}`);
        seasonId =
          leagueJson?.data?.currentSeason?.id ||
          leagueJson?.data?.current_season_id ||
          null;
      }

      if (!seasonId) {
        throw new Error('Tidak bisa mendapatkan season ID aktif');
      }

      // Jalankan kedua fetch secara paralel
      const [teamJson, squadJson] = await Promise.all([
        safeFetch(`/teams/${teamId}`),
        safeFetch(`/squads/seasons/${seasonId}/teams/${teamId}`),
      ]);

      const tData = teamJson?.data || {};
      const playersData = squadJson?.data || [];

      setTeamInfo({
        name: tData.name || 'Tim',
        logo: tData.image_path || 'https://placehold.co/80',
        venue: tData.venue?.name || null,
        venueImg: tData.venue?.image_path || null,
      });

      if (playersData.length === 0) {
        setSquadPositions([]);
      } else {
        const positionMap = new Map();
        playersData.forEach((item) => {
          const player = item.player;
          if (!player) return;
          const posName = player.position?.name || 'Lainnya';
          if (!positionMap.has(posName)) positionMap.set(posName, []);
          positionMap.get(posName).push(item);
        });

        const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
        const sortedPositions = Array.from(positionMap.keys())
          .sort((a, b) => {
            let idxA = posOrder.indexOf(a);
            let idxB = posOrder.indexOf(b);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
          })
          .map((pos) => ({ name: pos, players: positionMap.get(pos) }));

        setSquadPositions(sortedPositions);
      }
    } catch (e) {
      console.error('TeamScreen error:', e);
      setError(e.message || 'Gagal memuat data tim');
      setSquadPositions([]);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Tampilkan error state agar tidak blank screen diam
  if (!loading && error) {
    return (
      <View className="flex-1 bg-equd items-center justify-center px-6">
        <TouchableOpacity
          onPress={goBack}
          className="absolute top-6 left-4 p-2 bg-white/10 rounded-full"
        >
          <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text className="text-red-400 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={loadTeamAndSquadData}
          className="bg-red-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-equd w-full">
      <ImageBackground
        source={teamInfo.venueImg ? { uri: teamInfo.venueImg } : undefined}
        style={{ paddingTop: 16, paddingBottom: 24 }}
        className="relative z-10 bg-culos"
      >
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 z-0" />

        <View className="flex-row items-center justify-start px-4 mb-4 z-20">
          <TouchableOpacity onPress={goBack} className="p-2 bg-black/30 rounded-full">
            <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View className="px-6 items-start z-20">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-3 overflow-hidden">
            <Image source={{ uri: teamInfo.logo }} className="w-20 h-20" resizeMode="contain" />
          </View>
          <Text className="text-2xl font-black text-white uppercase tracking-wide">
            {teamInfo.name}
          </Text>
          {teamInfo.venue && (
            <View className="flex-row items-center mt-1.5 opacity-90">
              <Text className="text-xs font-medium text-gray-200">🏟️ {teamInfo.venue}</Text>
            </View>
          )}
        </View>
      </ImageBackground>

      <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : squadPositions.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-3 opacity-30">👕</Text>
            <Text className="text-gray-500 font-medium text-sm">Belum ada data pemain.</Text>
          </View>
        ) : (
          <View className="px-4 pt-4 pb-8">
            {squadPositions.map((posGrp, idx) => (
              <View key={idx} className="mb-5">
                <Text className="text-lg font-black text-white tracking-widest mb-2 px-1">
                  {posGrp.name}
                </Text>
                <View className="bg-culos rounded-xl overflow-hidden">
                  {posGrp.players.map((item, pIdx) => {
                    const player = item.player;
                    let age = '-';
                    if (player.date_of_birth) {
                      const birthDate = new Date(player.date_of_birth);
                      const today = new Date();
                      let ageNum = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (
                        monthDiff < 0 ||
                        (monthDiff === 0 && today.getDate() < birthDate.getDate())
                      )
                        ageNum--;
                      age = ageNum;
                    }

                    return (
                      <View key={pIdx} className="flex-row items-center px-4 py-3">
                        <View className="w-11 h-11 rounded-full bg-white/10 overflow-hidden mr-3">
                          <Image
                            source={{ uri: player.image_path || 'https://placehold.co/44' }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white">
                            {player.name || 'Tidak diketahui'}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-[11px] text-gray-400">Umur {age}</Text>
                            {player.nationality && (
                              <View className="flex-row items-center gap-1">
                                <Image
                                  source={{ uri: player.nationality.image_path }}
                                  className="w-4 h-3"
                                  resizeMode="contain"
                                />
                                <Text className="text-[11px] text-gray-400">
                                  {player.nationality.name}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text className="text-xs text-gray-500 italic">{posGrp.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
