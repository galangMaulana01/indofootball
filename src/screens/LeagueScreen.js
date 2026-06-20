import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';

import { safeFetch } from '../utils/api';

export default function LeagueScreen({ league, goBack }) {
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [debugError, setDebugError] = useState('');

  useEffect(() => {
    loadStandings();
  }, [league]);

  const loadStandings = async () => {
    // 1. Fallback ID: Antisipasi kalau season_id di-passing dengan nama key lain
    const targetSeasonId = league?.season_id || league?.current_season_id || league?.id;

    if (!targetSeasonId) {
      console.log('ID Season tidak ditemukan di props "league"');
      setLoading(false);
      return;
    }

    try {
      // 2. Pastikan endpoint ini cocok dengan router backend-mu (sesion / sesions / season)
      const json = await safeFetch(`/standings/live/leagues/${targetSeasonId}`);
      if (json && json.data) {
        setStandings(json.data);
      } else {
        console.log('API berhasil konek, tapi "json.data" kosong atau null');
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getValue = (details, code) => {
    if (!details) return 0;
    return details.find((d) => d.type?.code === code)?.value || 0;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] items-center justify-center">
        <ActivityIndicator size="large" color="#FC0B12" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Header Info League */}
      <View className="pt-12 pb-6 bg-[#1E1E1E] rounded-b-3xl shadow-lg z-10">
        <TouchableOpacity onPress={goBack} className="absolute top-12 left-4 p-2 z-20">
          <Text className="text-white text-xl font-bold">← Back</Text>
        </TouchableOpacity>
        <View className="items-center mt-2">
          <Image source={{ uri: league?.image_path }} className="w-16 h-16 rounded-full bg-white p-1" resizeMode="contain" />
          <Text className="text-white text-xl font-bold mt-3">{league?.name || 'Unknown League'}</Text>
          <Text className="text-gray-400 text-xs mt-1">Klasemen Musim Ini</Text>
        </View>
      </View>

      {/* Table Header */}
      <View className="flex-row px-4 py-3 bg-[#121212] mt-2">
        <Text className="text-gray-400 w-6 text-xs font-bold text-center">#</Text>
        <Text className="text-gray-400 flex-1 ml-4 text-xs font-bold">Klub</Text>
        <View className="flex-row w-48 justify-between">
          <Text className="text-gray-400 w-6 text-center text-xs font-bold">P</Text>
          <Text className="text-gray-400 w-6 text-center text-xs font-bold">W</Text>
          <Text className="text-gray-400 w-6 text-center text-xs font-bold">D</Text>
          <Text className="text-gray-400 w-6 text-center text-xs font-bold">L</Text>
          <Text className="text-gray-400 w-8 text-center text-xs font-bold">GD</Text>
          <Text className="text-white w-8 text-center text-xs font-bold">PTS</Text>
        </View>
      </View>

      {/* Standings List / Empty State */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {standings.length === 0 ? (
          /* TAMPILAN JIKA DATA KOSONG (UNTUK TRACER ERROR) */
          <View className="items-center justify-center pt-20 px-6">
            <Text className="text-red-500 text-base font-semibold text-center">Data Klasemen Kosong</Text>
            {debugError ? (
              <Text className="text-gray-400 text-xs mt-2 text-center bg-[#1E1E1E] p-3 rounded-lg w-full">
                {debugError}
              </Text>
            ) : null}
            <Text className="text-gray-500 text-xs mt-4 text-center">
              Target ID yang dikirim: {league?.season_id || league?.current_season_id || league?.id || 'Tidak Ada ID sama sekali'}
            </Text>
          </View>
        ) : (
          /* TAMPILAN JIKA DATA SUKSES ADA */
          standings
            .sort((a, b) => a.position - b.position)
            .map((team, index) => {
              const played = getValue(team.details, 'overall-matches-played');
              const won = getValue(team.details, 'overall-won');
              const draw = getValue(team.details, 'overall-draw');
              const lost = getValue(team.details, 'overall-lost');
              const gd = getValue(team.details, 'goal-difference');

              let borderLeftClass = 'border-transparent';
              if (team.position <= 4) borderLeftClass = 'border-blue-500';
              else if (team.position === 5) borderLeftClass = 'border-orange-500';
              else if (team.position >= standings.length - 2) borderLeftClass = 'border-red-500';

              return (
                <View 
                  key={team.id || index} 
                  className={`flex-row items-center px-4 py-3 bg-[#1E1E1E] mb-[2px] border-l-4 ${borderLeftClass}`}
                >
                  <Text className="text-white w-6 text-center font-bold">{team.position}</Text>
                  
                  <View className="flex-1 flex-row items-center ml-4">
                    <Image source={{ uri: team.participant?.image_path }} className="w-6 h-6 mr-3" resizeMode="contain" />
                    <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                      {team.participant?.name}
                    </Text>
                  </View>

                  <View className="flex-row w-48 justify-between items-center">
                    <Text className="text-gray-300 w-6 text-center text-xs">{played}</Text>
                    <Text className="text-gray-300 w-6 text-center text-xs">{won}</Text>
                    <Text className="text-gray-300 w-6 text-center text-xs">{draw}</Text>
                    <Text className="text-gray-300 w-6 text-center text-xs">{lost}</Text>
                    <Text className="text-gray-300 w-8 text-center text-xs">
                      {gd > 0 ? `+${gd}` : gd}
                    </Text>
                    <Text className="text-[#FC0B12] w-8 text-center font-bold text-sm">
                      {team.points}
                    </Text>
                  </View>
                </View>
              );
            })
        )}
      </ScrollView>
    </View>
  );
}
