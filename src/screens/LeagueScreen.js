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

  useEffect(() => {
    loadStandings();
  }, [league]);

  const loadStandings = async () => {
    if (!league?.season_id) {
      setLoading(false);
      return;
    }
    try {
      const json = await safeFetch(`/standings/sesion/${league.season_id}`);
      setStandings(json.data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getValue = (details, code) => {
    return details?.find((d) => d.type?.code === code)?.value || 0;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-equd items-center justify-center">
        <ActivityIndicator color="#FC0B12" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-equd">
      <TouchableOpacity onPress={goBack} className="p-4">
        <Text className="text-white">← Kembali</Text>
      </TouchableOpacity>

      <View className="items-center mb-5">
        <Image source={{ uri: league.image_path }} className="w-16 h-16" />
        <Text className="text-white text-xl font-bold mt-2">{league.name}</Text>
      </View>

      <ScrollView>
        {standings
          .sort((a, b) => a.position - b.position)
          .map((team) => (
            <View key={team.id} className="flex-row items-center px-4 py-3 border-b border-gray-800">
              <Text className="text-white w-8">{team.position}</Text>
              <Image source={{ uri: team.participant?.image_path }} className="w-6 h-6 mr-2" />
              <Text className="text-white flex-1" numberOfLines={1}>{team.participant?.name}</Text>
              <Text className="text-white font-bold">{team.points}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}
