// src/screens/TopScorersScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { activeSeasonIdGlobal } from './MatchesScreen';

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";

export default function TopScorersScreen({ onPlayerClick }) {  // onPlayerClick optional jika mau navigasi ke detail player nanti
  const [loading, setLoading] = useState(true);
  const [topScorers, setTopScorers] = useState([]);
  const [leagueName, setLeagueName] = useState("Top Scorers");

  useEffect(() => {
    fetchTopScorers();
  }, []);

  const fetchTopScorers = async () => {
    setLoading(true);
    try {
      let seasonId = activeSeasonIdGlobal;
      
      // Ambil league info untuk header
      const leagueRes = await fetch(`${API_BASE_URL}/leagues/501`); // Sesuaikan dengan TARGET_LEAGUE_IDS di MatchesScreen
      const leagueJson = await leagueRes.json();
      setLeagueName(leagueJson?.data?.name || "Top Scorers Liga");

      if (!seasonId) {
        seasonId = leagueJson?.data?.currentseason?.id;
      }

      if (!seasonId) {
        console.error("No season ID available");
        setLoading(false);
        return;
      }

      const res = await fetch(`\( {API_BASE_URL}/topscorers/seasons/ \){seasonId}?include=player,team`);
      const json = await res.json();
      
      const scorersData = json?.data || [];
      // Sort by goals descending (API biasanya sudah sorted, tapi pastikan)
      const sortedScorers = [...scorersData].sort((a, b) => (b.goals || 0) - (a.goals || 0));
      
      setTopScorers(sortedScorers);
    } catch (err) {
      console.error("Error fetching top scorers:", err);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-equd w-full pb-20">
      {/* Header */}
      <Text className="text-md font-black text-white tracking-tight px-3 mt-2">{leagueName}</Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#FC0B12" />
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

            {/* Scorers List */}
            <View className="overflow-hidden border-2 border-culos rounded-b-xl">
              {topScorers.map((scorer, idx) => {
                const player = scorer.player || {};
                const team = scorer.team || {};
                
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => onPlayerClick && onPlayerClick(player.id)} // Siap untuk future player detail
                    className={`flex-row items-center py-3 px-4 bg-equd ${idx !== topScorers.length - 1 ? 'border-b border-white/10' : ''}`}
                  >
                    <Text className="w-8 text-center text-xs font-bold text-gray-400">{idx + 1}</Text>
                    
                    <View className="flex-1 flex-row items-center gap-3 pl-1">
                      <View className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                        <Image 
                          source={{ uri: player.image_path || 'https://placehold.co/32' }} 
                          className="w-full h-full" 
                          resizeMode="cover" 
                        />
                      </View>
                      <View>
                        <Text className="text-sm font-semibold text-white" numberOfLines={1}>{player.name || 'Unknown'}</Text>
                        <Text className="text-[10px] text-gray-400">{team.name || ''}</Text>
                      </View>
                    </View>

                    <View className="w-12 items-center">
                      <Text className="text-lg font-black text-white">{scorer.goals || 0}</Text>
                    </View>
                    
                    <View className="w-10 items-center">
                      <Text className="text-sm font-medium text-gray-300">{scorer.assists || 0}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text className="text-center text-[10px] text-gray-500 mt-6">Data dari SportMonks API</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
