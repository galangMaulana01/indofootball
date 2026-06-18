import React, { useState, useEffect } from 'react';                                                                                               
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';                                       

const API_BASE_URL = "https://sportmonks-tawny.vercel.app";
const TARGET_LEAGUE_IDS = [501, 271];
const TARGET_STANDINGS = [25598];
export let activeSeasonIdGlobal = null;

export default function MatchesScreen({ onMatchClick }) {                                                                                           
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState([]);                                                                                                     
  const [leagueName, setLeagueName] = useState("");
  const [leagueImg, setLeagueImg] = useState("");

  const [bannerData, setBannerData] = useState(null);

  useEffect(() => {                                                                                                                                
    fetchAndRenderMatches();
    fetchBanner(); // Panggil fungsi fetch banner saat komponen pertama kali dimuat
  }, []);

  // Fungsi untuk mengambil data banner
  const fetchBanner = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/benner`);
      const json = await res.json();
      if (json && json.image_benner) {
        setBannerData(json);
      }
    } catch (e) {
      console.error("Gagal mengambil data banner:", e);
    }
  };

  // Fungsi untuk menangani klik pada banner
  const handleBannerPress = async () => {
    if (bannerData?.link) {
      const supported = await Linking.canOpenURL(bannerData.link);
      if (supported) {
        await Linking.openURL(bannerData.link);
      } else {
        console.log("Tidak bisa membuka URL: " + bannerData.link);
      }
    }
  };

  const fetchAndRenderMatches = async () => {
    setLoading(true);
    let loadedFixtures = [];                                                                                                                          
    try {
      for (const leagueId of TARGET_LEAGUE_IDS) {
        const leagueRes = await fetch(`${API_BASE_URL}/leagues/${leagueId}`);
        const leagueJson = await leagueRes.json();
        const league = leagueJson?.data;
        if (!league) continue;
                                                                                                                                                          
        setLeagueName(league.name);
        setLeagueImg(league.image_path);
                                                                                                                                                          
        let seasonId = league.currentseason?.id;                                                                                                          
        if (!seasonId) continue;
        activeSeasonIdGlobal = seasonId;
                                                                                                                                                          
        const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${TARGET_STANDINGS}`);                                                                
        const standingsJson = await standingsRes.json();                                                                                                  
        const standings = standingsJson?.data || [];
        if (standings.length === 0) continue;

        const roundId = standings[0].round_id;
        const roundRes = await fetch(`${API_BASE_URL}/rounds/${roundId}`);
        const roundJson = await roundRes.json();
        const fixtureSummaries = roundJson?.data?.fixtures || [];

        for (const summary of fixtureSummaries) {
          const fixtureRes = await fetch(`${API_BASE_URL}/fixtures/${summary.id}?include=participants,scores`);
          const fixtureJson = await fixtureRes.json();
          const fixtureData = fixtureJson.data;                                                                                                             
          if (!fixtureData) continue;                                                                                                                                                                                                                                                                         
          const participants = fixtureData.participants || [];
          const homeTeam = participants.find(p => p.meta?.location === 'home') || {};
          const awayTeam = participants.find(p => p.meta?.location === 'away') || {};

          const homeScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "-";
          const awayScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "-";              
          const statusRaw = fixtureData.state?.short_name || "NS";
          const statusLabel = statusRaw === "FT" ? "FT" : (statusRaw === "NS" ? "NS" : statusRaw);
                                                                                                                                                            
          loadedFixtures.push({ id: fixtureData.id, homeTeam, awayTeam, homeScore, awayScore, statusLabel });
        }                                                                                                                                               
      }                                                                                                                                                 
      setFixtures(loadedFixtures);                                                                                                                    
    } catch (e) {
      console.error(e);
    }
    setLoading(false);                                                                                                                              
  };                                                                                                                                              
  
  return (                                                                                                                                            
    <ScrollView className="flex-1 w-full mb-20 bg-equd" showsVerticalScrollIndicator={false}>                                                                                                                                                                                                             
      
      {/* Banner image dinamis dari API */}
      {bannerData && (
        <View className="px-3 mt-4">
          <TouchableOpacity 
            onPress={handleBannerPress}
            className="w-full h-56 overflow-hidden relative rounded-xl"
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: bannerData.image_benner }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#FC0B12" />
        </View>
      ) : fixtures.length === 0 ? (
        <View className="items-center py-16">
          <Text className="text-5xl mb-3 opacity-30">⚽</Text>
          <Text className="text-gray-500 font-medium text-sm">Tidak ada jadwal tersedia.</Text>
        </View>
      ) : (
        <View className="px-3 mb-6 mt-4">
          {/* League header */}
          <Text className="font-black text-start text-base text-white tracking-wider mb-3">{leagueName}</Text>

          {/* Match list */}
          <View className="overflow-hidden">
            {fixtures.map((match, i) => {
              const isLast = i === fixtures.length - 1;
              const isFT = match.statusLabel === 'FT';                                                                                                          
              const isLive = !isFT && match.statusLabel !== 'NS';

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => onMatchClick(match.id)}
                  className={`flex-row items-center px-4 py-3 mb-2 bg-culos rounded-xl`}
                >
                  {/* Status kiri */}
                  <Text className={`w-8 text-xs font-semibold text-center mr-3 ${isLive ? 'text-green-400' : 'text-gray-200'}`}>
                    {match.statusLabel}
                  </Text>

                  {/* Tim vertikal */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Image source={{ uri: match.homeTeam.image_path || 'https://placehold.co/28' }} className="w-6 h-6" resizeMode="contain" />
                      <Text className="text-sm font-semibold text-gray-200 flex-1" numberOfLines={1}>{match.homeTeam.name || 'TBA'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Image source={{ uri: match.awayTeam.image_path || 'https://placehold.co/28' }} className="w-6 h-6" resizeMode="contain" />
                      <Text className="text-sm font-semibold text-gray-200 flex-1" numberOfLines={1}>{match.awayTeam.name || 'TBA'}</Text>
                    </View>
                  </View>

                  {/* Skor kanan */}
                  <View className="items-center ml-3">                                                                                                                
                    <View className={`w-7 h-7 rounded items-center justify-center mb-1 ${Number(match.homeScore) > Number(match.awayScore) ? 'bg-red-600' : 'bg-white/10'}`}>
                      <Text className={`text-sm font-black text-white`}>{match.homeScore}</Text>
                    </View>
                    <View className={`w-7 h-7 rounded items-center justify-center ${Number(match.awayScore) > Number(match.homeScore) ? 'bg-red-600' : 'bg-white/10'}`}>
                      <Text className={`text-sm font-black text-white`}>{match.awayScore}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}                                                                                                                                             
          </View>                                                                                                                                         
        </View>
      )}
    </ScrollView>
  );
}
