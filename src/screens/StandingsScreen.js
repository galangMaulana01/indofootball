import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { activeSeasonIdGlobal } from './MatchesScreen';

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";
const TARGET_LEAGUE_IDS = [501];
const TARGET_STANDINGS = [25598];
export default function StandingsScreen({ onTeamClick }) {
  const [loading, setLoading] = useState(true);
  const [standingsData, setStandingsData] = useState([]);
  const [leagueName, setLeagueName] = useState("Klasemen Liga");
  const [leagueLogo, setLeagueLogo] = useState(null);

  useEffect(() => {
    fetchAndRenderStandings();
  }, []);

  const fetchAndRenderStandings = async () => {
    setLoading(true);
    try {
      let seasonId = activeSeasonIdGlobal;

      const leagueRes = await fetch(`${API_BASE_URL}/leagues/${TARGET_LEAGUE_IDS[0]}`);
      const leagueJson = await leagueRes.json();
      setLeagueName(leagueJson?.data?.name || "Klasemen Liga");
      setLeagueLogo(leagueJson?.data?.image_path || null);

      if (!seasonId) {
        seasonId = leagueJson?.data?.currentseason?.id;
        if (!seasonId) throw new Error("No season ID");
      }

      const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${TARGET_STANDINGS}`);
      const standingsJson = await standingsRes.json();
      let allStandings = standingsJson?.data || [];
      if (allStandings.length === 0) throw new Error("Standings kosong");

      let finalStandings = allStandings.filter(s => s.group_id !== null);
      if (finalStandings.length === 0) {
        const maxStageId = Math.max(...allStandings.map(s => s.stage_id));
        finalStandings = allStandings.filter(s => s.stage_id === maxStageId);
      }

      const groupsMap = new Map();
      for (const standing of finalStandings) {
        const groupId = standing.group_id;
        if (!groupId) continue;
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, {
            groupId,
            groupName: standing.group?.name || `Grup ${groupId}`,
            standings: []
          });
        }
        groupsMap.get(groupId).standings.push(standing);
      }

      const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
        if (a.groupName.includes('Championship')) return -1;
        if (b.groupName.includes('Championship')) return 1;
        return a.groupName.localeCompare(b.groupName);
      });

      sortedGroups.forEach(group => group.standings.sort((a, b) => a.position - b.position));
      setStandingsData(sortedGroups);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-equd w-full pb-20">

      {/* Header */}
      <Text className="text-md font-black text-white tracking-tight px-3">{leagueName}</Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#FC0B12" />
          </View>
        ) : standingsData.length === 0 ? (
          <View className="items-center py-20">
            <Text className="text-5xl mb-3 opacity-20">📋</Text>
            <Text className="text-gray-400 font-medium text-sm">Klasemen belum tersedia</Text>
          </View>
        ) : (
          <View className="px-3 pt-4 pb-2">
            {standingsData.map((group, idx) => {
              return (
                <View key={idx} className="mb-5">
                  {/* Nama grup di luar card */}
                  <Text className="text-sm font-black text-white tracking-wide text-center mb-2">{group.groupName}</Text>

                  <View className="overflow-hidden border-2 border-culos rounded-sm">
                    {/* Table header */}
                    <View className="flex-row items-center bg-culos py-2.5 px-3">
                      <Text className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase">No</Text>
                      <Text className="flex-1 text-[10px] font-bold text-gray-400 uppercase pl-2">Tim</Text>
                      <Text className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase">P</Text>
                      <Text className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase">M</Text>
                      <Text className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase">S</Text>
                      <Text className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase">K</Text>
                      <Text className="w-14 text-center text-[10px] font-bold text-gray-400 uppercase">GF/GA</Text>
                      <Text className="w-8 text-center text-[10px] font-bold text-gray-400 uppercase">GD</Text>
                      <Text className="w-8 text-center text-[10px] font-black text-gray-400 uppercase">PTS</Text>
                    </View>

                    {group.standings.map((standing, sIdx) => {
                      const participant = standing.participant;
                      const teamName = participant?.name;
                      const teamLogo = participant?.image_path;
                      let played = 0, wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

                      if (standing.details && Array.isArray(standing.details)) {
                        for (const det of standing.details) {
                          switch (det.type_id) {
                            case 129: played = det.value; break;
                            case 130: wins = det.value; break;
                            case 131: draws = det.value; break;
                            case 132: losses = det.value; break;
                            case 133: goalsFor = det.value; break;
                            case 134: goalsAgainst = det.value; break;
                          }
                        }
                      }

                      const gd = goalsFor - goalsAgainst;
                      const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
                      const isEven = sIdx % 2 === 0;

                      return (
                        <View
                          key={sIdx}
                          className={`flex-row items-center py-2.5 px-3 bg-equd`}
                        >
                          <Text className="w-6 text-center text-xs font-bold text-gray-400">{standing.position}</Text>

                          <TouchableOpacity
                            onPress={() => onTeamClick(standing.participant_id)}
                            className="flex-1 flex-row items-center gap-1.5 pl-1"
                          >
                            <Image source={{ uri: teamLogo }} className="w-5 h-5 shrink-0" resizeMode="contain" />
                            <Text className="flex-1 text-xs font-semibold text-white" numberOfLines={1}>{teamName}</Text>
                          </TouchableOpacity>

                          <Text className="w-6 text-center text-xs text-gray-300">{played}</Text>
                          <Text className="w-6 text-center text-xs text-gray-300">{wins}</Text>
                          <Text className="w-6 text-center text-xs text-gray-300">{draws}</Text>
                          <Text className="w-6 text-center text-xs text-gray-300">{losses}</Text>
                          <Text className="w-14 text-center text-xs text-gray-300">{goalsFor}/{goalsAgainst}</Text>
                          <Text className={`w-8 text-center text-xs font-semibold ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>{gdStr}</Text>
                          <Text className="w-8 text-center text-xs font-black text-white">{standing.points || 0}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
