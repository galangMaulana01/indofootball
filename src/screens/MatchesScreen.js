import React, { useState, useEffect } from 'react';  
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';  
import Svg, { Circle } from 'react-native-svg';  
import { safeFetch } from '../utils/api';  
  
export let activeSeasonIdGlobal = null;  
  
const LiveIcon = () => (  
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="8" fill="#ef4444" />
    <Circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.3" />
  </Svg>  
);  
  
export default function MatchesScreen({ onMatchClick, onLeaguePress }) {  
  const todayStr = new Date().toISOString().split('T')[0];  
  const [loading, setLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [matches, setMatches] = useState([]);  
  const [liveMatches, setLiveMatches] = useState([]);  
  const [error, setError] = useState(null);  
  const [benner, setBenner] = useState(null);  
  const [activeTab, setActiveTab] = useState(todayStr);  
  const [leaguesMap, setLeaguesMap] = useState({});  
  
  useEffect(() => {  
    fetchAllData(activeTab);  
  }, []);  
  
  const generateDateTabs = () => {  
    const tabs = [];  
    const baseDate = new Date();  
    for (let i = -3; i <= 4; i++) {  
      const current = new Date();  
      current.setDate(baseDate.getDate() + i);  
      const dateString = current.toISOString().split('T')[0];  
      const dayLabel = i === 0 ? 'Hari ini' : current.toLocaleDateString('id-ID', { weekday: 'short' });  
      const dateLabel = current.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });  
      tabs.push({ dateString, dayLabel, dateLabel });  
    }
    return tabs;  
  };  
  
  const handleLeaguePress = async (league) => {
    try {
      const res = await safeFetch(`/leagues/${league.id}?include=seasons`);
      const full = res?.data;
      const seasonId = full?.currentseason?.id || full?.seasons?.[0]?.id;
      if (seasonId) activeSeasonIdGlobal = seasonId;
      onLeaguePress?.(league);
    } catch (e) {
      console.log('League detail error:', e);
      onLeaguePress?.(league);
    }
  };
  
  const fetchAllData = async (targetTab = activeTab) => {
    setLoading(true);
    setError(null);

    try {
      if (!benner) {
        const bennerJson = await safeFetch('/benner');
        setBenner(bennerJson?.data || bennerJson);
      }

      // Tambahkan 'scores;state' di akhir string include
      const liveJson = await safeFetch('/livescores/inplay?include=participants;league;venue;scores;state');
      setLiveMatches(liveJson?.data || []);                                                                                                       

      const leaguesJson = await safeFetch('/leagues');
      const leagues = leaguesJson?.data || [];

      const map = {};
      leagues.forEach(l => { map[l.id] = l; });
      setLeaguesMap(map);                                                                                                                         

      if (targetTab !== 'LIVE') {                                                                                                                 
        const dateJson = await safeFetch(`/fixtures/date/${targetTab}?include=participants;league;scores;state`);
        const matchesData = dateJson?.data || [];
        setMatches(matchesData);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  
  const onRefresh = async () => {  
    setRefreshing(true);  
    await fetchAllData(activeTab);  
    setRefreshing(false);  
  };  
  
  return (  
    <View className="flex-1 bg-equd w-full">  
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FC0B12" />}>  
        <View
  className="mx-4 mt-4 overflow-hidden"
  style={{
    height: 200,
    borderRadius: 24,
  }}
>
  {benner?.image_benner ? (
    <ImageBackground
      source={{ uri: benner.image_benner }}
      style={{ flex: 1, justifyContent: 'flex-end' }}
      resizeMode="cover"
    >
     <View className="p-4">
           <Text className="text-yellow-400 text-[5px]">Top News</Text>

        <Text className="text-xl font-black text-white">
          {benner?.desc}
        </Text>

        <Text
          style={{
            color: '#ccc',
            fontSize: 12,
            marginTop: 10,
          }}
        >
          2h
        </Text>
      </View>
    </ImageBackground>
  ) : (
    <View
      style={{
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#ffffff' }}>
        Memuat berita...
      </Text>
    </View>
  )}
</View>  
  
        <View className="w-full bg-equd py-3">  
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">  
            {generateDateTabs().map((tab) => {  
              const isActive = activeTab === tab.dateString;  
              return (  
                <TouchableOpacity key={tab.dateString} onPress={() => { setActiveTab(tab.dateString); fetchAllData(tab.dateString); }} activeOpacity={0.7}  
                  className={`px-4 py-2 rounded-lg mr-3 items-center justify-center ${isActive ? 'bg-white text-equd' : 'bg-culos'}`}>  
                  <Text className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-equd' : 'text-gray-400'}`}>{tab.dayLabel}</Text>  
                  <Text className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-equd/80' : 'text-gray-500'}`}>{tab.dateLabel}</Text>  
                </TouchableOpacity>  
              );  
            })}  
          </ScrollView>  
        </View>  
  
        <View className="p-5">  
          {loading && !refreshing ? (  
            <View className="items-center py-12"><ActivityIndicator size="large" color="#FC0B12" /></View>  
          ) : error ? (  
            <View className="items-center py-12">  
              <Text className="text-gray-400 text-center mb-4">{error}</Text>  
              <TouchableOpacity onPress={() => fetchAllData(activeTab)} className="bg-red-600 px-6 py-2.5 rounded-full"><Text className="text-white font-bold text-xs">Coba Lagi</Text></TouchableOpacity>  
            </View>  
          ) : (  
            <>  
              {liveMatches.length > 0 && (activeTab === todayStr || activeTab === 'LIVE') && (
                <View className="mb-6">  
                  <View className="flex-row items-center mb-4 gap-2 px-1"><LiveIcon /><Text className="text-white font-black text-[11px] tracking-widest uppercase">Sedang Berlangsung</Text></View>  
                  {liveMatches.map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      isLive 
                      leaguesMap={leaguesMap} 
                      onPress={() => onMatchClick?.(match.id)} 
                      onLeaguePress={handleLeaguePress} 
                    />
                  ))}
                </View>  
              )}  
              {activeTab !== 'LIVE' && (  
                <View className="mb-6">  
                  <Text className="text-white font-black text-[11px] tracking-widest uppercase mb-4 px-1">{activeTab === todayStr ? "Pertandingan" : "Pertandingan"}</Text>  
                  {matches.length === 0 ? (  
                    <View className="bg-culos py-12 rounded-2xl items-center"><Text className="text-gray-500 text-xs font-medium">Tidak ada pertandingan.</Text></View>  
                  ) : (  
                    matches.map((match) => (  
                      <MatchCard  
                        key={match.id}  
                        match={match}                                                                                                                                     
                        leaguesMap={leaguesMap}  
                        onPress={() => onMatchClick?.(match.id)}  
                        onLeaguePress={handleLeaguePress}  
                      />  
                    ))                                                                                                                                                  
                  )}  
                </View>
              )}  
            </>  
          )}  
        </View>
      </ScrollView>  
    </View>  
  );  
}  
  
const MatchCard = ({ match, isLive = false, onPress, onLeaguePress, leaguesMap = {} }) => {
  const participants = match.participants || [];
  const home = participants.find((p) => p.meta?.location === 'home') || participants[0];
  const away = participants.find((p) => p.meta?.location === 'away') || participants[1];

  const scores = Array.isArray(match.scores) ? match.scores : [];
  const homeScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals ?? '-';
  const awayScore = scores.find((s) => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals ?? '-';

  const statusShort = match.state?.short_name || match.state?.state || 'NS';
  const isFinished = ['FT', 'AET', 'FT_PEN', 'CANCL', 'POSTP', 'AWARDED'].includes(statusShort);
  const hasScore = homeScore !== '-' && awayScore !== '-';
  const league = leaguesMap[match.league?.id] || match.league;

  // --- LOGIKA BARU UNTUK MENGAMBIL MENIT DARI "PERIODS" ---
  let activeMinute = match.minute || match.state?.minute;
  if (!activeMinute && Array.isArray(match.periods) && match.periods.length > 0) {
    // Mengambil periode terakhir (misal babak ke-1 atau ke-2 yang sedang berjalan)
    const lastPeriod = match.periods[match.periods.length - 1];
    activeMinute = lastPeriod.minutes;
  }
  const displayMinute = activeMinute ? `${activeMinute}'` : "?'";
  // ---------------------------------------------------------

  const timeOrMinute = isLive 
    ? displayMinute 
    : isFinished 
      ? statusShort 
      : match.starting_at 
        ? new Date(match.starting_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
        : 'VS';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="bg-culos rounded-xl p-2 mb-3">
      <TouchableOpacity
        className="flex-row items-center mb-2"
        onPress={() => onLeaguePress?.(match.league)}
      >
        <Image source={{ uri: match.league?.image_path }} className="w-6 h-6 rounded mr-2" resizeMode="contain" />
        <Text className="text-sm text-gray-200 font-bold tracking-wider">{match.league?.name}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between items-center px-1">
        <View className="items-center flex-1">
          <Image source={{ uri: home?.image_path }} className="w-10 h-10 mb-2" resizeMode="contain" />
          <Text className="font-bold text-white text-xs text-center leading-tight" numberOfLines={2}>{home?.name}</Text>
        </View>

        <View className="items-center justify-center px-4 w-1/3">
          {isLive ? (
            <>
              <Text className="text-xl font-black text-white tracking-widest">{homeScore} - {awayScore}</Text>
              <Text className="text-red-500 font-black text-xs mb-1">{timeOrMinute}</Text>
            </>
          ) : isFinished && hasScore ? (
            <>
              <Text className="text-xl font-black text-white tracking-widest">{homeScore} - {awayScore}</Text>
              <Text className="text-gray-300 font-bold text-xs mb-1">{timeOrMinute}</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-black text-xl mb-1">VS</Text>
              <Text className="text-gray-400 text-[10px] font-bold">{timeOrMinute}</Text>
            </>
          )}
        </View>

        <View className="items-center flex-1">
          <Image source={{ uri: away?.image_path }} className="w-10 h-10 mb-2" resizeMode="contain" />
          <Text className="font-bold text-white text-xs text-center leading-tight" numberOfLines={2}>{away?.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
