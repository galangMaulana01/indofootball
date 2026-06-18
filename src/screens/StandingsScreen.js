// src/screens/StandingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { safeFetch } from '../utils/api';

export default function StandingsScreen({ seasonId = 1 }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [standings, setStandings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStandings();
  }, [seasonId]);

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await safeFetch(`/standings/seasons/${seasonId}?include=team`);
      setStandings(json?.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching standings:', err);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStandings();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0B1120]">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0B1120] px-4">
        <Text className="text-red-500 text-center">{error}</Text>
        <TouchableOpacity onPress={fetchStandings} className="mt-4 bg-green-600 px-6 py-2 rounded-xl">
          <Text className="text-white font-bold">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#0B1120]"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        <Text className="text-white text-2xl font-bold mb-4">Klasemen</Text>
        {standings.length === 0 ? (
          <Text className="text-gray-400 text-center">Belum ada data klasemen</Text>
        ) : (
          standings.map((item, index) => (
            <View key={index} className="bg-[#1A2332] rounded-xl p-4 mb-2 flex-row items-center">
              <Text className="text-gray-400 w-8">{index + 1}</Text>
              <Text className="text-white flex-1">{item.team?.name || 'Tim'}</Text>
              <Text className="text-white font-bold">{item.points || 0}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
