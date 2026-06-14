import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { activeSeasonIdGlobal } from './MatchesScreen';

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";

export default function TeamScreen({ teamId, goBack }) {
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState({});
  const [squadPositions, setSquadPositions] = useState([]);

  useEffect(() => {
    loadSquadData();
  }, [teamId]);

  const loadSquadData = async () => {
    setLoading(true);
    try {
      const seasonId = activeSeasonIdGlobal;
      const squadRes = await fetch(`${API_BASE_URL}/squads/seasons/${seasonId}/teams/${teamId}`);
      const squadJson = await squadRes.json();
      let playersData = squadJson?.data || [];
      if (playersData.length === 0) throw new Error("Tidak ada pemain");

      const tInfo = playersData[0]?.team || {};
      setTeamInfo({
        name: tInfo.name || "Tim",
        logo: tInfo.image_path || "https://placehold.co/80",
        venue: tInfo.venue?.name || null,
      });

      const positionMap = new Map();
      playersData.forEach(item => {
        const player = item.player;
        if (!player) return;
        const posName = player.position?.name || "Lainnya";
        if (!positionMap.has(posName)) positionMap.set(posName, []);
        positionMap.get(posName).push(item);
      });

      const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
      const sortedPositions = Array.from(positionMap.keys()).sort((a, b) => {
        let idxA = posOrder.indexOf(a), idxB = posOrder.indexOf(b);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      }).map(pos => ({ name: pos, players: positionMap.get(pos) }));

      setSquadPositions(sortedPositions);
    } catch (e) {
      console.error(e);
      setSquadPositions([]);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-equd w-full">

      {/* Header bar */}
      <View className="bg-culos pt-4 pb-3 items-start px-4 gap-3">
        <TouchableOpacity onPress={goBack} className="p-2 bg-white/10 rounded-full">
          <Svg width={20} height={20} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false}>

        {/* Team hero section */}
        <View className="bg-culos px-6 pt-4 pb-6 items-start">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-3 overflow-hidden">
            <Image source={{ uri: teamInfo.logo }} className="w-20 h-20" resizeMode="contain" />
          </View>
          <Text className="text-2xl font-black text-white uppercase tracking-wide">{teamInfo.name}</Text>
        </View>

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
                {/* Label posisi di luar card */}
                <Text className="text-lg font-black text-white tracking-widest mb-2 px-1">{posGrp.name}</Text>

                {/* Card list pemain */}
                <View className="bg-culos rounded-xl overflow-hidden">
                  {posGrp.players.map((item, pIdx) => {
                    const player = item.player;
                    let age = "-";
                    if (player.date_of_birth) {
                      const birthDate = new Date(player.date_of_birth);
                      const today = new Date();
                      let ageNum = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ageNum--;
                      age = ageNum;
                    }
                    const isLast = pIdx === posGrp.players.length - 1;

                    return (
                      <View key={pIdx} className={`flex-row items-center px-4 py-3`}>
                        {/* Foto pemain */}
                        <View className="w-11 h-11 rounded-full bg-white/10 overflow-hidden mr-3">
                          <Image source={{ uri: player.image_path || 'https://placehold.co/44' }} className="w-full h-full" resizeMode="cover" />
                        </View>

                        {/* Info pemain */}
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white">{player.name || 'Tidak diketahui'}</Text>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-[11px] text-gray-400">Umur {age}</Text>
                            {player.nationality && (
                              <View className="flex-row items-center gap-1">
                                <Image source={{ uri: player.nationality.image_path }} className="w-4 h-3" resizeMode="contain" />
                                <Text className="text-[11px] text-gray-400">{player.nationality.name}</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Posisi kanan */}
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
